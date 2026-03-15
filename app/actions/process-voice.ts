'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processVoiceTask(formData: FormData) {
  const file = formData.get('audio') as File
  if (!file) throw new Error("Аудио файл не найден")

  const supabase = await createClient()

  try {
    // 1. Транскрибация через OpenAI Whisper
    // Используем стандартный fetch к API OpenAI для гибкости
    const whisperFormData = new FormData()
    whisperFormData.append('file', file)
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'ru')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperFormData
    })
    const { text: transcript } = await whisperRes.json()

    // 2. Структурирование данных (тот же код, что был раньше)
    const { object: taskData } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        title: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        due_at: z.string().nullable(),
        tags: z.array(z.string()),
        is_calendar_synced: z.boolean(),
      }),
      prompt: `Извлеки задачу из текста: "${transcript}". 
               Текущее время: ${new Date().toISOString()}.`,
    })

    // 3. Сохранение в базу
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...taskData, completed: false }])
      .select().single()

    if (error) throw error
    
    revalidatePath('/')
    return { success: true, transcript, task: data }
  } catch (err) {
    console.error(err)
    return { success: false }
  }
}