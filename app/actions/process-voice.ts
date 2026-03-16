'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function syncWithGoogle(task: any, token: string) {
  try {
    const event = {
      summary: task.title,
      description: `Создано через AI. Приоритет: ${task.priority}`,
      start: { 
        dateTime: task.due_at, 
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
      },
      end: { 
        // Событие на 30 минут по умолчанию
        dateTime: new Date(new Date(task.due_at).getTime() + 30 * 60000).toISOString(), 
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone 
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
    return res.ok
  } catch (e) {
    console.error('Ошибка синхронизации календаря:', e)
    return false
  }
}

export async function processVoiceTask(formData: FormData) {
  const file = formData.get('audio') as File
  const supabase = await createClient()

  // Получаем сессию, где лежит provider_token от Google
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("Требуется авторизация")

  try {
    // 1. Whisper: Голос в текст
    const whisperFormData = new FormData()
    whisperFormData.append('file', file)
    whisperFormData.append('model', 'whisper-1')
    
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperFormData
    })
    const { text: transcript } = await whisperRes.json()

    // 2. GPT-4o-mini: Текст в структурированные данные
    const { object: taskData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        title: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        due_at: z.string().nullable(),
        tags: z.array(z.string()),
        is_calendar_synced: z.boolean(),
      }),
      prompt: `Текущее время: ${new Date().toISOString()}. Разбери задачу из текста: "${transcript}". 
               Если есть четкое время, установи is_calendar_synced: true.`,
    })

    // 3. Сохранение в Supabase (auth.uid() подставится автоматически или передай session.user.id)
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{ 
        ...taskData, 
        user_id: session.user.id,
        completed: false 
      }])
      .select().single()

    if (error) throw error

    // 4. Синхронизация с Google Calendar
    // Используем provider_token, который Supabase сохраняет при входе через Google
    if (taskData.due_at && session.provider_token) {
      const isSynced = await syncWithGoogle(task, session.provider_token)
      
      if (isSynced) {
        await supabase
          .from('tasks')
          .update({ is_calendar_synced: true })
          .eq('id', task.id)
      }
    }

    revalidatePath('/')
    return { success: true, task }
  } catch (err) {
    console.error('Ошибка процесса:', err)
    return { success: false }
  }
}