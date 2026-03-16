'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Увеличиваем время выполнения для Vercel (Hobby план позволяет до 30с)
// export const maxDuration = 30;

async function syncWithGoogle(task: any, token: string) {
  try {
    // На сервере Intl.DateTimeFormat может вернуть UTC, 
    // поэтому для календаря лучше использовать ISO строку напрямую
    const startTime = new Date(task.due_at);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const event = {
      summary: task.title,
      description: `Создано через AI. Приоритет: ${task.priority}`,
      start: { 
        dateTime: startTime.toISOString(),
      },
      end: { 
        dateTime: endTime.toISOString(),
      },
      reminders: { useDefault: true },
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Google Calendar API Error:', errorData);
    }

    return res.ok
  } catch (e) {
    console.error('Ошибка синхронизации календаря:', e)
    return false
  }
}

export async function processVoiceTask(formData: FormData) {
  const file = formData.get('audio') as File
  if (!file) return { success: false, error: "Нет аудиофайла" }

  const supabase = await createClient()

  // 1. БЕЗОПАСНАЯ ПРОВЕРКА: используем getUser() вместо getSession()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Для Google Calendar API нам всё равно нужен токен из сессии
  const { data: { session } } = await supabase.auth.getSession()

  if (authError || !user || !session) {
    console.error("Auth error:", authError)
    return { success: false, error: "Требуется авторизация" }
  }

  try {
    // 2. Whisper: Голос в текст
    const whisperFormData = new FormData()
    whisperFormData.append('file', file)
    whisperFormData.append('model', 'whisper-1')
    
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperFormData
    })

    if (!whisperRes.ok) throw new Error("Ошибка Whisper API")
    const { text: transcript } = await whisperRes.json()

    // 3. GPT-4o-mini: Текст в структурированные данные
    const { object: taskData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        title: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        due_at: z.string().nullable(),
        tags: z.array(z.string()),
        is_calendar_synced: z.boolean(),
      }),
      prompt: `Текущее время (ISO): ${new Date().toISOString()}. 
               Разбери задачу из текста: "${transcript}". 
               Если пользователь указал конкретную дату или время, установи is_calendar_synced: true. 
               Если время не указано, due_at: null и is_calendar_synced: false.`,
    })

    // 4. Сохранение в Supabase
    const { data: task, error: dbError } = await supabase
      .from('tasks')
      .insert([{ 
        ...taskData, 
        user_id: user.id, // Используем проверенный ID из getUser()
        completed: false 
      }])
      .select().single()

    if (dbError) throw dbError

    // 5. Синхронизация с Google Calendar
    // Используем provider_token из сессии
    let syncSuccess = false;
    if (taskData.is_calendar_synced && taskData.due_at && session.provider_token) {
      syncSuccess = await syncWithGoogle(task, session.provider_token)
      
      if (syncSuccess) {
        await supabase
          .from('tasks')
          .update({ is_calendar_synced: true })
          .eq('id', task.id)
      }
    }

    revalidatePath('/')
    return { success: true, task, transcript }

  } catch (err) {
    console.error('Ошибка процесса:', err)
    return { success: false, error: err instanceof Error ? err.message : "Неизвестная ошибка" }
  }
}