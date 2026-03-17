'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SKILL_REGISTRY } from '@/lib/ai/registry'

// Вспомогательная функция для динамической сборки документации скиллов
// Она избавляет нас от хардкода в промпте
const getIntentContext = (intent: string) => {
  const intentMap: Record<string, string[]> = {
    tasks: ['create_task', 'delete_tasks', 'complete_task'],
    learning: ['update_learning_status', 'explain_course'],
    general: ['chat_response'],
    // ДОБАВЛЯЕМ СЮДА:
    ui_command: ['ui_navigation', 'ui_filter']
  };

  const allowedSkills = intentMap[intent] || [];
  
  return Object.entries(SKILL_REGISTRY)
    .filter(([name]) => allowedSkills.includes(name))
    .map(([name, config]) => {
      // Автоматически вытаскиваем ключи из Zod схемы
      const fields = Object.keys(config.schema.shape).join(', ');
      return `- ${name}: ${config.description}. Ожидаемые поля в JSON: [${fields}]`;
    })
    .join('\n');
};

export async function processVoiceTask(formData: FormData) {
  console.log("--- 🎙️ СТАРТ (ROUTER + DIAGNOSTICS) ---");
  const file = formData.get('audio') as File
  if (!file) return { success: false, response_phrase: "Файл не найден" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, response_phrase: "Нужна авторизация" }

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
    const whisperData = await whisperRes.json()
    const transcript = whisperData.text?.trim()
    console.log("📝 Текст:", transcript);

    if (!transcript) return { success: false, response_phrase: "Я ничего не услышал." }

    // 2. Intent Router
    const { object: route } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({ intent: z.enum(['learning', 'tasks', 'general', 'ui_command']) }),
      prompt: `
      Текст пользователя: "${transcript}"
        Определи категорию:
      - learning: если речь об обучении или курсах.
      - tasks: если нужно создать/удалить задачу.
      - ui_command: если пользователь просит что-то "открыть", "показать", "прокрутить" или "перейти".
      - general: простое общение.
  `
    });
    console.log("🚦 Роутер выбрал:", route.intent);

// 3. ШАГ 2: Подготовка динамического контекста
    let extraData = "";
    if (route.intent === 'learning') {
      const { data: courses } = await supabase.from('courses').select('id, title');
      extraData = `СПИСОК КУРСОВ ДЛЯ ID: ${courses?.map(c => `${c.title} [${c.id}]`).join(', ')}`;
    }

    // Получаем описание только нужных скиллов для этого интента
    const skillsDocs = getIntentContext(route.intent);

// 4. ШАГ 3: Executor (Формирование параметров)
    const { object: decision } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        skill_name: z.string(),
        parameters_json: z.string(),
        response_phrase: z.string()
      }),
      prompt: `
        Текст пользователя: "${transcript}"
        Категория: ${route.intent}
        Сегодня: ${new Date().toISOString()} (GMT-3)

        ДОСТУПНЫЕ ФУНКЦИИ И ИХ ПОЛЯ:
        ${skillsDocs}

        ${extraData}

        ИНСТРУКЦИЯ:
        1. Выбери подходящий skill_name из списка выше.
        2. Заполни parameters_json, используя ТОЛЬКО указанные поля.
        3. Если это просто беседа, выбирай 'chat_response'.
        4. Отвечай дружелюбно, как ассистент SOLUTER AI.
      `
    });

    console.log("🎯 GPT выбрал скилл:", decision.skill_name);

    // 5. Безопасное исполнение
    const activeSkill = SKILL_REGISTRY[decision.skill_name];
    if (!activeSkill) {
      console.warn("⚠️ Скилл не найден:", decision.skill_name);
      return { success: true, transcript, response_phrase: decision.response_phrase };
    }

    // Парсинг JSON с защитой
    const jsonString = decision.parameters_json?.trim() || "{}";
    let rawParams = {};
    try {
      rawParams = JSON.parse(jsonString);
    } catch (e) {
      console.error("❌ Ошибка парсинга JSON от GPT");
    }
    const validation = activeSkill.schema.safeParse(rawParams);

    if (!validation.success) {
      console.error("❌ Ошибка валидации параметров:", validation.error.format());
      return { success: true, transcript, response_phrase: decision.response_phrase };
    }

    console.log("🚀 Запуск хендлера...");
    const result = await activeSkill.handler(supabase, user, validation.data);
    
    if (result?.error) {
      console.error("❌ Ошибка базы данных:", result.error);
      return { success: false, response_phrase: "Ошибка при сохранении в базу." };
    }

    console.log("✅ УСПЕШНО");
    revalidatePath('/');
    return { 
      success: true, 
      transcript, 
      response_phrase: decision.response_phrase,
      action: decision.skill_name.startsWith('ui_') ? decision.skill_name : null,
      params: validation.data
    };

  } catch (err) {
    console.error("🔥 КРИТИЧЕСКИЙ СБОЙ:", err);
    return { success: false, response_phrase: "Техническая заминка, попробуем еще раз?" };
  } finally {
    console.log("--- 🏁 КОНЕЦ ---");
  }
}