'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SKILL_REGISTRY } from '@/lib/ai/registry'

// Используем твою общую утилиту для работы с таймзонами
import { getUserTimeZone } from '@/lib/utils/date-utils'

// Вспомогательная функция для динамической сборки документации скиллов
const getIntentContext = (intent: string) => {
  const intentMap: Record<string, string[]> = {
    tasks: ['create_task', 'delete_tasks', 'complete_task', 'reschedule_task','create_project'],
    learning: ['update_learning_status', 'explain_course'],
    general: ['chat_response'],
    ui_command: ['ui_navigation', 'ui_filter']
  };

  const allowedSkills = intentMap[intent] || [];
  
  return Object.entries(SKILL_REGISTRY)
    .filter(([name]) => allowedSkills.includes(name))
    .map(([name, config]) => {
      const fields = Object.keys(config.schema.shape).join(', ');
      return `- ${name}: ${config.description}. Поля: [${fields}]`;
    })
    .join('\n');
};

export async function processVoiceTask(formData: FormData) {
  console.log("--- 🎙️ СТАРТ (PROCESS VOICE) ---");
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
      prompt: `Текст: "${transcript}". Категории: tasks (задачи), learning (курсы/обучение), ui_command (интерфейс/фильтры), general (болтовня).`
    });
    console.log("🚦 Роутер выбрал:", route.intent);

    // 3. Подготовка контекста: ТЕПЕРЬ БЕРЕМ ПРОЕКТЫ ПОЛЬЗОВАТЕЛЯ
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, is_system')
      .eq('user_id', user.id);

    // Улучшенный контекст проектов: помечаем системные проекты
    const projectsContext = projects?.map(p => 
      `- ${p.title}${p.is_system ? ` (СИСТЕМНЫЙ ПРОЕКТ "${p.title.toUpperCase()}")` : ''}: ID ${p.id}`
    ).join('\n') || 'Проектов нет';
    
    const skillsDocs = getIntentContext(route.intent);

    // Используем динамическую таймзону вместо хардкода Santiago
    const currentTimezone = getUserTimeZone();
    const now = new Date().toLocaleString('ru-RU', { timeZone: currentTimezone });

    console.log("📦 Контекст проектов для GPT:", projectsContext);
    // 4. Executor (Формирование параметров)
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
        Сегодняшняя дата и время: ${now} (Часовая зона: ${currentTimezone})

        ДОСТУПНЫЕ ФУНКЦИИ:
        ${skillsDocs}

        СПИСОК ЛИЧНЫХ ПРОЕКТОВ ПОЛЬЗОВАТЕЛЯ:
        ${projectsContext}

       ПРАВИЛА ОБРАБОТКИ ПРОЕКТОВ:
        1. Если пользователь говорит "отложи на когда-нибудь", "в долгий ящик", "напомни когда-нибудь" — ВСЕГДА выбирай ID проекта "Когда-нибудь".
        2. Если выбран проект "Когда-нибудь", параметр "due_at" ОБЯЗАТЕЛЬНО должен быть null, а "is_all_day" — false. Игнорируй любые даты в тексте для этого проекта.
        3. Если пользователь хочет "во входящие/инбокс" — выбери ID проекта "Входящие".
        4. Если проект не упомянут — используй ID проекта "Входящие" по умолчанию.

        ПРАВИЛА ПАРАМЕТРОВ:
        - priority: "low", "medium", "high". По дефолту "medium".
        - Время: если указано время ("в 10:00"), ставь is_all_day: false. Если только дата — is_all_day: true.
        - Recurrence: daily, weekly, monthly, yearly или null.
        - Ответ: кратко и дружелюбно, как SOLUTER AI.
      `
    });

    console.log("🎯 GPT выбрал:", decision.skill_name);

    // 5. Исполнение
    const activeSkill = SKILL_REGISTRY[decision.skill_name];
    if (!activeSkill) {
      return { success: true, transcript, response_phrase: decision.response_phrase };
    }
      // ПАРСИНГ СТРОКИ В ОБЪЕКТ
      let rawParams = {};
      try {
        rawParams = JSON.parse(decision.parameters_json);
      } catch (e) {
        console.error("❌ GPT прислал кривой JSON:", decision.parameters_json);
        return { success: false, response_phrase: "Ошибка формата данных." };
      }

      // Валидация уже готового объекта
      const validation = activeSkill.schema.safeParse(rawParams);

    if (!validation.success) {
      console.error("❌ Ошибка валидации параметров:", validation.error.format());
      return { success: true, transcript, response_phrase: "Я не смог правильно распознать детали задачи." };
    }

    console.log("🚀 Запуск хендлера...");
    const result = await activeSkill.handler(supabase, user, validation.data);

    // Логика RAG для обучения
    if (decision.skill_name === 'explain_course' && result.data) {
      const ragResponse = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({ answer: z.string() }),
        prompt: `Данные: "${result.data}". Вопрос: "${transcript}". Ответь кратко и вдохновляюще.`
      });
      decision.response_phrase = ragResponse.object.answer;
    }
    
    if (result?.error) {
      console.error("❌ Ошибка DB:", result.error);
      return { success: false, response_phrase: "Не удалось сохранить данные." };
    }

    console.log("✅ УСПЕШНО");
    revalidatePath('/dashboard');
    
    return { 
      success: true, 
      transcript, 
      response_phrase: decision.response_phrase,
      action: decision.skill_name.startsWith('ui_') ? decision.skill_name : null,
      params: validation.data
    };

  } catch (err) {
    console.error("🔥 КРИТИЧЕСКИЙ СБОЙ:", err);
    return { success: false, response_phrase: "Произошла ошибка, попробуй еще раз." };
  } finally {
    console.log("--- 🏁 КОНЕЦ ---");
  }
}