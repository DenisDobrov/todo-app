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
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
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
  if (!file) return { success: false, error: "Нет аудиофайла", response_phrase: "Ошибка: аудиофайл не получен" }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (authError || !user || !session) {
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

    // 2. GPT-4o-mini: Анализ, время и теги
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
      prompt: `
        Текущее время (ISO): ${new Date().toISOString()}. 
        Часовой пояс пользователя: GMT-3 (Аргентина/Чили).
        Текст пользователя: "${transcript}". 

        Твоя задача:
        1. Проверь, является ли текст задачей. Если это шум/случайные слова — is_task: false.
        2. Если это задача:
           - title: Очищенный заголовок без мусора.
           - tags: Подбери 1-2 логичных тега на русском (например: Дом, Работа, Покупки, Важное, Здоровье, Семья).
           - due_at: 
              - Если в тексте ЕСТЬ указание времени (напр. "в 5 вечера", "завтра в 10 утра", "через час"), вычисли точный ISO с учетом часового пояса GMT-3.
              - Если времени НЕТ — оставь null.
           - is_calendar_synced: true, только если время (due_at) было определено.
        3. response_phrase:
           - Если успех: "Окей, записал: [заголовок]" (если есть время, добавь "на [время]").
           - Если мусор: "Извини, не расслышал задачу".
      `,
    })

    if (!taskData.is_task) {
      return { success: false, error: "Task not detected", response_phrase: taskData.response_phrase }
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

    // 4. Синхронизация с Google Calendar (только если есть дата)
    if (taskData.is_calendar_synced && taskData.due_at && session.provider_token) {
      const isSynced = await syncWithGoogle(task, session.provider_token)
      if (isSynced) {
        await supabase.from('tasks').update({ is_calendar_synced: true }).eq('id', task.id)
      }
    }

    revalidatePath('/')
    return { success: true, task, response_phrase: taskData.response_phrase }

  } catch (err) {
    console.error(err)
    return { success: false, error: "Ошибка", response_phrase: "Произошла ошибка при обработке" }
  }
}