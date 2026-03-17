'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Настройка для Vercel (без export для безопасности клиентского импорта)
const maxDuration = 30;

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
  if (!file) return { success: false, response_phrase: "Ошибка: файл не получен" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (!user || !session) {
    return { success: false, response_phrase: "Пожалуйста, авторизуйтесь" }
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

    if (!whisperRes.ok) throw new Error("Whisper API Error")
    
    const whisperData = await whisperRes.json()
    const transcript = whisperData.text?.trim()

    console.log("🎙️ Транскрипт:", transcript)

    if (!transcript || transcript.length < 2) {
      return { success: false, response_phrase: "Я ничего не расслышал. Попробуйте еще раз?" }
    }

    // 2. GPT: Определяем намерение (Intent)
    const { object: aiDecision } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        intent: z.enum(['create', 'query', 'delete_tasks', 'complete_tasks', 'noise']),
        taskData: z.object({
          title: z.string().describe("Краткий заголовок задачи"),
          priority: z.enum(['low', 'medium', 'high']),
          due_at: z.string().nullable().describe("ISO дата или null"),
          tags: z.array(z.string()),
          is_calendar_synced: z.boolean(),
        }).nullable(),
        filterCriteria: z.object({
          all_today: z.boolean(),
          all_tomorrow: z.boolean(),
          tag: z.string().nullable(),
          only_completed: z.boolean(),
        }).nullable(),
        response_phrase: z.string().describe("Ответ пользователю на русском"),
      }),
      prompt: `
        Текст пользователя: "${transcript}".
        Текущее время: ${new Date().toISOString()} (Пользователь в Аргентине/Чили, GMT-3).

        Инструкции по интентам:
        - 'delete_tasks': если просят "удали", "очисти", "убери". 
          * "удали выполненные" -> filterCriteria: { only_completed: true, ... }
          * "удали всё на завтра" -> filterCriteria: { all_tomorrow: true, only_completed: false, ... }
        - 'complete_tasks': если просят "отметь сделанным", "выполни", "сделал".
        - 'query': если спрашивают "что у меня?", "какие планы?".
        - 'create': запись новой задачи.
        
        Если intent не 'create', taskData должен быть null.
        Если intent не 'delete_tasks' или 'complete_tasks', filterCriteria должен быть null.
      `,
    })

    console.log("🤖 Интент:", aiDecision.intent, "| Критерии:", aiDecision.filterCriteria);

    // --- ОБРАБОТКА ---

    // А. УДАЛЕНИЕ ЗАДАЧ
    if (aiDecision.intent === 'delete_tasks' && aiDecision.filterCriteria) {
      const { all_today, all_tomorrow, tag, only_completed } = aiDecision.filterCriteria;
      let query = supabase.from('tasks').delete().eq('user_id', user.id);

      if (only_completed) query = query.eq('completed', true);
      if (tag) query = query.contains('tags', [tag]);

      if (all_today || all_tomorrow) {
        const targetDate = new Date();
        if (all_tomorrow) targetDate.setDate(targetDate.getDate() + 1);
        const dateStr = targetDate.toISOString().split('T')[0];
        query = query.gte('due_at', `${dateStr}T00:00:00.000Z`).lte('due_at', `${dateStr}T23:59:59.999Z`);
      }

      const { error } = await query;
      revalidatePath('/');
      return { success: true, transcript, response_phrase: error ? "Ошибка при удалении." : "Задачи успешно удалены." };
    }

    // Б. ЗАВЕРШЕНИЕ ЗАДАЧ
    if (aiDecision.intent === 'complete_tasks' && aiDecision.filterCriteria) {
      const { all_today, tag } = aiDecision.filterCriteria;
      let query = supabase.from('tasks').update({ completed: true }).eq('user_id', user.id).eq('completed', false);

      if (tag) query = query.contains('tags', [tag]);
      if (all_today) {
        const dateStr = new Date().toISOString().split('T')[0];
        query = query.gte('due_at', `${dateStr}T00:00:00.000Z`).lte('due_at', `${dateStr}T23:59:59.999Z`);
      }

      const { error } = await query;
      revalidatePath('/');
      return { success: true, transcript, response_phrase: error ? "Ошибка обновления." : `Готово! Отметил задачи как выполненные.` };
    }

    // В. ЗАПРОС ПЛАНОВ
    if (aiDecision.intent === 'query') {
      const { data: tasks, error: dbError } = await supabase
        .from('tasks')
        .select('title')
        .eq('user_id', user.id)
        .eq('completed', false);

      if (dbError) throw dbError;

      const summary = tasks && tasks.length > 0
        ? `У тебя ${tasks.length} активных задач: ` + tasks.map(t => t.title).join(', ')
        : "На сегодня планов нет, ты всё сделал!";
      
      return { success: true, transcript, response_phrase: summary };
    }

    // Г. СОЗДАНИЕ ЗАДАЧИ
    if (aiDecision.intent === 'create' && aiDecision.taskData?.title) {
      const { data: task, error: dbError } = await supabase.from('tasks').insert([{ 
        ...aiDecision.taskData, 
        user_id: user.id, 
        completed: false 
      }]).select().single();

      if (dbError) throw dbError;

      if (aiDecision.taskData.is_calendar_synced && aiDecision.taskData.due_at && session.provider_token) {
        await syncWithGoogle(task, session.provider_token);
      }

      revalidatePath('/');
      return { success: true, transcript, response_phrase: aiDecision.response_phrase };
    }

    return { success: true, transcript, response_phrase: aiDecision.response_phrase || "Я тебя понял." };

  } catch (err) {
    console.error("❌ Критическая ошибка в экшене:", err);
    return { success: false, response_phrase: "Произошла ошибка при обработке голоса." };
  }
}