'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function syncWithGoogle(task: any, token: string) {
  try {
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
  if (!file) return { success: false, error: "Нет аудиофайла", response_phrase: "Ошибка: аудиофайл не получен" }

  const supabase = await createClient()

  // БЕЗОПАСНАЯ ПРОВЕРКА
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (authError || !user || !session) {
    console.error("Auth error:", authError)
    return { success: false, error: "Требуется авторизация", response_phrase: "Пожалуйста, войдите в систему" }
  }

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

    if (!whisperRes.ok) throw new Error("Ошибка Whisper API")
    const { text: transcript } = await whisperRes.json()

    // 2. GPT-4o-mini: Фильтрация мусора и структурирование
    const { object: taskData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        is_task: z.boolean(),
        title: z.string().nullable(),
        priority: z.enum(['low', 'medium', 'high']),
        due_at: z.string().nullable(),
        tags: z.array(z.string()),
        is_calendar_synced: z.boolean(),
        response_phrase: z.string(),
      }),
      prompt: `Текущее время (ISO): ${new Date().toISOString()}. 
               Текст пользователя: "${transcript}". 

               Твоя задача:
               1. Определи, содержит ли текст реальное намерение создать задачу. 
                  Если это просто шум, фоновые звуки, случайные слова ("проверка", "привет" без задачи) — установи is_task: false.
               2. Если это задача:
                  - Очисти заголовок от лишних слов ("запиши", "эээ").
                  - Исправь опечатки.
                  - Если указано конкретное время/дата, вычисли ISO и поставь is_calendar_synced: true.
               3. Сформируй response_phrase для озвучки:
                  - При успехе: "Окей, добавил: [заголовок]".
                  - При успехе со временем: "Записал на [время]: [заголовок]".
                  - Если это мусор/не задача: "Извини, я не расслышал задачу".`,
    })

    // Если AI решил, что это мусор
    if (!taskData.is_task) {
      return { 
        success: false, 
        error: "Task not detected", 
        response_phrase: taskData.response_phrase 
      }
    }

    // 3. Сохранение в Supabase
    const { data: task, error: dbError } = await supabase
      .from('tasks')
      .insert([{ 
        title: taskData.title,
        priority: taskData.priority,
        due_at: taskData.due_at,
        tags: taskData.tags,
        user_id: user.id,
        completed: false 
      }])
      .select().single()

    if (dbError) throw dbError

    // 4. Синхронизация с Google Calendar
    if (taskData.is_calendar_synced && taskData.due_at && session.provider_token) {
      const isSynced = await syncWithGoogle(task, session.provider_token)
      if (isSynced) {
        await supabase
          .from('tasks')
          .update({ is_calendar_synced: true })
          .eq('id', task.id)
      }
    }

    revalidatePath('/')
    
    // Возвращаем результат с response_phrase
    return { 
      success: true, 
      task, 
      transcript, 
      response_phrase: taskData.response_phrase 
    }

  } catch (err) {
    console.error('Ошибка процесса:', err)
    return { 
      success: false, 
      error: "Ошибка сервера", 
      response_phrase: "Произошла ошибка при обработке голоса" 
    }
  }
}