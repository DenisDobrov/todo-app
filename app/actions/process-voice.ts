'use server'

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SKILL_REGISTRY } from '@/lib/ai/registry'
import { getUserTimeZone } from '@/lib/utils/date-utils'
import dayjs from 'dayjs'

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
     // prompt: `Текст: "${transcript}". Категории: tasks (задачи), learning (курсы/обучение), ui_command (интерфейс/фильтры), general (болтовня).`
     prompt: `Текст: "${transcript}".`
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
    // Даем GPT четкое понимание текущего момента в Боготе
    const nowContext = dayjs().format('dddd, D MMMM YYYY, HH:mm');

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
        Контекст времени: ${nowContext} (Зона: ${currentTimezone})
        Категория: ${route.intent}

        ДОСТУПНЫЕ ФУНКЦИИ:
        ${skillsDocs}

        СПИСОК ЛИЧНЫХ ПРОЕКТОВ ПОЛЬЗОВАТЕЛЯ:
        ${projectsContext}

        ИНСТРУКЦИИ ДЛЯ СОЗДАНИЯ ЗАДАЧ (create_task):
        - Если время не указано ("завтра"), ставь is_all_day: true.
        - Если время указано ("в 18:00"), ставь is_all_day: false и прибавь время к дате.
        - project_id: Используй ID из списка. Если нет совпадений — используй ID проекта "Входящие".
        - Если "Когда-нибудь" — due_at: null.

        Верни параметры в JSON формате.
      `
    });

    console.log("🎯 GPT выбрал:", decision.skill_name);

    // 5. Исполнение
// 5. Исполнение скилла
    const activeSkill = SKILL_REGISTRY[decision.skill_name];
    if (!activeSkill) return { success: true, response_phrase: decision.response_phrase };

    const rawParams = JSON.parse(decision.parameters_json);
    const validation = activeSkill.schema.safeParse(rawParams);

    if (!validation.success) {
      console.error("❌ Validation Error:", validation.error);
      return { success: false, response_phrase: "Ошибка параметров." };
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