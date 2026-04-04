import { z } from 'zod';
import { SupabaseClient, User } from '@supabase/supabase-js';

import { addToGoogleCalendar } from '@/lib/google/calendar'; // Проверь правильность пути к файлу
import { prepareTaskStorage } from '@/lib/utils/date-utils'; // Наш новый хелпер
import dayjs from 'dayjs';

export interface SkillConfig<T extends z.ZodRawShape> {
  description: string;
  schema: z.ZodObject<T>;
  handler: (supabase: SupabaseClient, user: User, params: z.infer<z.ZodObject<T>>) => Promise<any>;
}

export const SKILL_REGISTRY: Record<string, SkillConfig<any>> = {
create_task: {
    description: "Создание задачи. Если время не указано, ставь is_all_day: true. Для повторов используй recurrence.",
    schema: z.object({
      title: z.string(),
      due_at: z.string().optional().nullable(),
      priority: z.enum(['low', 'medium', 'high']).catch('medium').default('medium'),
      is_all_day: z.boolean().default(false),
      project_id: z.string().nullable().optional().catch(null),
      recurrence: z.preprocess(
        (val) => (val === "" || val === "none" || val === "null" ? null : val),
        z.enum(['daily', 'weekly', 'monthly', 'yearly']).nullable().optional()
      ).catch(null)
    }),
    handler: async (supabase, user, params: any) => {
      // ФИКС ТИПИЗАЦИИ: Гарантируем строку для хелпера
      const dateInput = params.due_at || "";
      const { due_date, due_datetime_utc } = prepareTaskStorage(dateInput, params.is_all_day);

      console.log('-----------------------------------');
      console.log(`🆕 AI СОЗДАНИЕ ЗАДАЧИ: "${params?.title}"`);
      // Используем dayjs для красивого лога из новой архитектуры
      const logDate = due_datetime_utc ? dayjs(due_datetime_utc).format('DD.MM.YYYY HH:mm') : due_date;
      console.log(`📅 Дата: ${logDate || 'БЕЗ ДАТЫ (Someday)'}`);
      console.log(`🔥 Приоритет: ${String(params?.priority ?? 'medium').toUpperCase()}`);
      console.log(`📂 ID Проекта: ${params.project_id || '❌ НЕ ВЫБРАН'}`);
      console.log('-----------------------------------');

      const { data: newTask, error: dbError } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          project_id: params.project_id || null,
          title: params.title,
          due_at: due_datetime_utc || due_date, // Совместимость
          due_date: due_date,                   // Новая архитектура
          due_datetime_utc: due_datetime_utc,   // Новая архитектура
          priority: params.priority,
          is_all_day: !!params.is_all_day,
          recurrence: params.recurrence || null,
          completed: false
        }])
        .select()
        .single();

      if (dbError) return { data: null, error: dbError };

      console.log('--- 🛡️ ИНТЕГРАЦИЯ С КАЛЕНДАРЕМ ---');
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token; 

      if (providerToken && newTask) {
        console.log(`🚀 Отправка в Google Calendar...`);
        const calendarResult = await addToGoogleCalendar(newTask, providerToken);
        
        if (calendarResult.id) {
          console.log(`📅 Google Event ID получен: ${calendarResult.id}`);
          await supabase
            .from('tasks')
            .update({ google_event_id: calendarResult.id })
            .eq('id', newTask.id);
        }
      } else {
        console.log(`⚠️ Токен не найден или задача пуста.`);
      }

      return { data: newTask, error: null };
    }
  },

  reschedule_task: {
    description: "Перенос задачи на другое время/дату. Поля: title (название), new_date (ISO дата/время).",
    schema: z.object({
      title: z.string(),
      new_date: z.string(),
      is_all_day: z.boolean().default(false)
    }),
    handler: async (supabase, user, params: any) => {
      // ФИКС ТИПИЗАЦИИ: params.new_date гарантированно строка из Zod
      const { due_date, due_datetime_utc } = prepareTaskStorage(params.new_date, params.is_all_day);
      
      console.log(`📅 AI ПЕРЕНОС: "${params.title}" -> ${due_date}`);
      
      return await supabase
        .from('tasks')
        .update({ 
          due_at: due_datetime_utc || due_date,
          due_date: due_date,
          due_datetime_utc: due_datetime_utc 
        })
        .eq('user_id', user.id)
        .ilike('title', `%${params.title}%`);
    }
  },
// libs/ai/registry.ts

  complete_task: {
  description: "Отметить задачу или задачи на сегодня как выполненные. Повторы создаются автоматически в БД.",
  schema: z.object({
    title: z.string().optional(),
    all_today: z.boolean().optional().default(false)
  }),
  handler: async (supabase, user, params: any) => {
    let query = supabase
      .from('tasks')
      .update({ completed: true })
      .eq('user_id', user.id)
      .eq('completed', false);

    if (params.all_today) {
      const todayStr = dayjs().format('YYYY-MM-DD');
      console.log(`[AI Skill] Завершаю всё на сегодня: ${todayStr}`);
      query = query.eq('due_date', todayStr);
    } else if (params.title) {
      console.log(`[AI Skill] Завершаю: "${params.title}"`);
      query = query.ilike('title', `%${params.title}%`);
    } else {
      return { error: 'Не указана цель для завершения' };
    }

    const { data, error } = await query;
    
    if (!error) {
      console.log("✅ Статус обновлен. БД создала следующую итерацию с сохранением Google ID.");
    }

    return { data, error };
  }
},
  // 1. УДАЛЕНИЕ (Чтобы не копить мусор)
  delete_tasks: {
    description: "Удаление задач по названию или всех выполненных. Поля: title (название), only_completed (boolean).",
    schema: z.object({
      title: z.string().optional(),
      only_completed: z.boolean().optional().default(false)
    }),
    handler: async (supabase, user, params) => {
      let query = supabase.from('tasks').delete().eq('user_id', user.id);
      
      if (params.only_completed) {
        query = query.eq('completed', true);
      } else if (params.title) {
        query = query.ilike('title', `%${params.title}%`);
      } else {
        return { error: 'Укажите, что именно удалить' };
      }
      return await query;
    }
  },


// Создание проекта поьзователя 

  create_project: {
    description: "Создание нового личного проекта. Можно привязать к курсу из библиотеки.",
    schema: z.object({
      title: z.string(),
      course_id: z.string().nullable().optional() // ID из общей таблицы courses
    }),
    handler: async (supabase, user, params) => {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          user_id: user.id,
          title: params.title,
          course_id: params.course_id || null,
          status: 'active',
          is_system: false // Личные проекты никогда не системные
        }])
        .select()
        .single();

      return { data, error };
    }
  },
  // ПРИЛОЖЕНИЕ: ОБУЧЕНИЕ
  update_learning_status: {
    description: "Обновление прогресса курса. Параметры: course_id, new_status (not_started|active|done).",
    schema: z.object({
      course_id: z.string(),
      new_status: z.enum(['not_started', 'active', 'done'])
    }),
    handler: async (supabase, user, params) => {
      console.log("🎓 Обновление курса:", params.course_id);
      return await supabase.from('user_progress').upsert({ 
        user_id: user.id, 
        course_id: params.course_id, 
        status: params.new_status,
        updated_at: new Date().toISOString()
      });
    }
  },
    ui_filter: {
      description: "Фильтрация списка задач по проекту или статусу.",
      schema: z.object({
        course_id: z.string().nullable().optional(),
        status: z.enum(['completed', 'active', 'all']).default('all')
      }),
      handler: async (supabase, user, params) => {
        // Этот скилл не пишет в базу, он возвращает параметры для UI
        return { data: params, error: null };
      }
    },
  // Новый навык объяснение обучения 
    explain_course: {
        description: "Поиск подробной информации о курсах, темах и учебном плане. Параметр: query (вопрос пользователя).",
        schema: z.object({
          query: z.string().describe("Конкретный вопрос по содержанию курсов")
        }),
      handler: async (supabase, user, params) => {
      const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: params.query,
          model: 'text-embedding-3-small'
        })
      });
      
      const { data: [{ embedding }] } = await embeddingRes.json();

      const { data: matches, error } = await supabase.rpc('match_courses', {
        query_embedding: embedding,
        match_threshold: 0.25, // Снизили порог для лучшего охвата
        match_count: 5         // Берем чуть больше вариантов для выбора
      });

      if (error) return { error: error.message };

      // Формируем более богатый контекст
      const context = matches && matches.length > 0 
        ? matches.map((m: any) => 
            `ID: ${m.id}, Название: ${m.title}, Описание: ${m.description}, Уровень: ${m.level}`
          ).join('\n---\n')
        : "В базе данных нет точного совпадения, но предложи изучить основы ИИ.";

      return { data: context };
    }      },
 // Навигация голосом  
  ui_navigation: {
    description: "Навигация по интерфейсу. Параметры: target (tasks|learning|stats), section_id (опционально).",
    schema: z.object({
      target: z.enum(['tasks', 'learning', 'stats']),
      section_id: z.string().optional()
    }),
    handler: async () => {
      console.log("🖥️ Команда навигации отправлена на фронтенд");
      return { data: 'ui_signal' }; 
    }
  },
  set_roadmap: {
    description: "Выбор карьерного пути (Machine Learning Engineer, AI Developer, Data Scientist).",
    schema: z.object({
      path_name: z.enum(['ML Engineer', 'AI Developer', 'Data Scientist'])
    }),
    handler: async (supabase, user, params) => {
      // Сохраняем выбор пользователя в профиль или отдельную таблицу
      const { error } = await supabase
        .from('profiles')
        .update({ active_path: params.path_name })
        .eq('id', user.id);
        
      return { 
        data: `Путь "${params.path_name}" активирован. Маршрут перестроен.`,
        error 
      };
    }
  },

  // ОБЩЕЕ: ЧАТ (с поддержкой пустого объекта)
  chat_response: {
    description: "Простой ответ на приветствие или общий вопрос.",
    // Используем .catchall(z.any()) или просто пустой объект, 
    // чтобы Zod не ругался на отсутствие полей
    schema: z.object({ 
      answer: z.string().optional() 
    }).passthrough(), 
    handler: async () => {
      console.log("💬 Выполнен chat_response (диалог без записи в БД)");
      return { data: 'ok' };
    }
  }
};