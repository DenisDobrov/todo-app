'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { VOICE_SKILLS } from '@/lib/ai/skills-config'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const maxDuration = 30;

export async function processVoiceTask(formData: FormData) {
  console.log("--- 🎙️ НАЧАЛО ОБРАБОТКИ ГОЛОСА ---");
  const file = formData.get('audio') as File
  if (!file) return { success: false, response_phrase: "Ошибка: файл не получен" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (!user || !session) return { success: false, response_phrase: "Пожалуйста, авторизуйтесь" }

  try {
    // 1. Whisper
    const whisperFormData = new FormData()
    whisperFormData.append('file', file)
    whisperFormData.append('model', 'whisper-1')
    
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperFormData
    })

    const whisperData = await whisperRes.json()
    const transcript = whisperData.text?.trim()

    console.log("📝 Распознано Whisper:", transcript || "ПУСТО");

    if (!transcript || transcript.length < 2) {
      console.log("⚠️ Слишком короткий или пустой текст, выхожу.");
      return { success: false, response_phrase: "Я ничего не расслышал. Попробуйте еще раз?" }
    }

      // 2. GPT Decision
    console.log("🤖 Запрос к GPT для выбора скилла...");
    const { object: decision } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        skill_name: z.string().describe("Имя скилла из предоставленного списка"),
        // Передаем параметры как строку, чтобы не ломать схему OpenAI
        parameters_json: z.string().describe("JSON-строка с параметрами для выбранного скилла"),
        response_phrase: z.string().describe("Твой ответ пользователю")
      }),
      prompt: `
        Текст пользователя: "${transcript}"
        Текущее время: ${new Date().toISOString()} (GMT-3).
        Доступные скиллы: ${JSON.stringify(VOICE_SKILLS)}
        
        Твоя задача:
        1. Выбери наиболее подходящий skill_name.
        2. Подготовь параметры для этого скилла и преврати их в JSON-строку для поля parameters_json.
        3. Напиши дружелюбный ответ пользователю.
      `
    });

    // Парсим параметры обратно в объект
    let params: any = {};
    try {
      params = JSON.parse(decision.parameters_json);
    } catch (e) {
      console.error("❌ Ошибка парсинга параметров:", e);
    }

    console.log("🎯 Выбранный скилл:", decision.skill_name);
    console.log("📦 Распакованные параметры:", params);

    // --- ОБРАБОТКА СКИЛЛОВ ---

    switch (decision.skill_name) {
      case 'create_task':
        const { data: task, error: createError } = await supabase.from('tasks').insert([{ 
          ...params, // Используем распакованный объект
          user_id: user.id, 
          completed: false 
        }]).select().single();

        if (createError) {
          console.error("❌ Ошибка при вставке в БД:", createError);
          throw createError;
        }
        revalidatePath('/');
        return { success: true, transcript, response_phrase: decision.response_phrase };

        case 'ui_filter':
        console.log("🖥️ Команда фильтрации:", params);
        return { 
          success: true, 
          transcript, 
          action: 'ui_filter', 
          params: params, 
          response_phrase: decision.response_phrase 
        };
        case 'query_tasks':
        console.log("🔍 Запрос планов...");
        const { data: tasks } = await supabase.from('tasks').select('title').eq('user_id', user.id).eq('completed', false);
        console.log(`📂 Найдено активных задач: ${tasks?.length || 0}`);
        return { success: true, transcript, response_phrase: decision.response_phrase };

      case 'delete_tasks':
        console.log("🗑️ Удаление задач...");
        let delQ = supabase.from('tasks').delete().eq('user_id', user.id);
        if (params.only_completed) delQ = delQ.eq('completed', true);
        const { error: delError } = await delQ;
        if (delError) console.error("❌ Ошибка удаления:", delError);
        revalidatePath('/');
        return { success: true, transcript, response_phrase: decision.response_phrase };

      case 'complete_tasks':
        console.log("✅ Массовое выполнение...");
        let compQ = supabase.from('tasks').update({ completed: true }).eq('user_id', user.id).eq('completed', false);
        if (params.tag) compQ = compQ.contains('tags', [params.tag]);
        const { error: compError } = await compQ;
        if (compError) console.error("❌ Ошибка выполнения:", compError);
        revalidatePath('/');
        return { success: true, transcript, response_phrase: decision.response_phrase };

      case 'ui_filter':
        console.log("🖥️ Передаю команду фильтрации на клиент:", params);
        return { 
          success: true, 
          transcript, 
          action: 'ui_filter', 
          params: params, 
          response_phrase: decision.response_phrase 
        };

      default:
        console.log("❓ Скилл не распознан или шум.");
        return { success: true, transcript, response_phrase: decision.response_phrase };
    }
  } catch (err) {
    console.error("🔥 КРИТИЧЕСКАЯ ОШИБКА:", err);
    return { success: false, response_phrase: "Произошла ошибка в 'мозгах' ассистента." };
  } finally {
    console.log("--- 🏁 КОНЕЦ ОБРАБОТКИ ---");
  }
}