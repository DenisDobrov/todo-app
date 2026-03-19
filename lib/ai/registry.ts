import { z } from 'zod';
import { SupabaseClient, User } from '@supabase/supabase-js';

export interface SkillConfig<T extends z.ZodRawShape> {
  description: string;
  schema: z.ZodObject<T>;
  handler: (supabase: SupabaseClient, user: User, params: z.infer<z.ZodObject<T>>) => Promise<any>;
}

export const SKILL_REGISTRY: Record<string, SkillConfig<any>> = {
  // ПРИЛОЖЕНИЕ: ЗАДАЧИ
  create_task: {
    description: "Создание задачи. Обязательно: title. Опционально: due_at (ISO datetime), priority (low|medium|high).",
    schema: z.object({
      title: z.string().min(1),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      due_at: z.string().nullable().optional()
    }),
    handler: async (supabase, user, params) => {
      console.log("💾 Запись задачи в базу:", params.title);
      return await supabase.from('tasks').insert([{ 
        ...params, 
        user_id: user.id, 
        completed: false 
      }]);
    }
  },
  // Выполнение задачи 
  complete_task: {
    description: "Отметить задачу или список задач как выполненные. Параметры: title (опционально), all_today (boolean).",
    schema: z.object({
      title: z.string().optional(),
      all_today: z.boolean().optional().default(false)
    }),
    handler: async (supabase, user, params) => {
      let query = supabase
        .from('tasks')
        .update({ completed: true })
        .eq('user_id', user.id);

      if (params.all_today) {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('due_at', `${today}T00:00:00`).lte('due_at', `${today}T23:59:59`);
      } else if (params.title) {
        // Поиск по частичному совпадению названия (регистронезависимо)
        query = query.ilike('title', `%${params.title}%`);
      } else {
        return { error: 'Не указана задача для завершения' };
      }

      const { data, error } = await query;
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

  // 2. ПЕРЕНОС (Reschedule)
  reschedule_task: {
    description: "Перенос задачи на другое время/дату. Поля: title (название), new_date (ISO дата/время).",
    schema: z.object({
      title: z.string(),
      new_date: z.string()
    }),
    handler: async (supabase, user, params) => {
      console.log(`📅 Перенос задачи "${params.title}" на ${params.new_date}`);
      return await supabase
        .from('tasks')
        .update({ due_at: params.new_date })
        .eq('user_id', user.id)
        .ilike('title', `%${params.title}%`);
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
    description: "Фильтрация списка задач на экране. Параметры: filter_type (all|high|active).",
    schema: z.object({
      filter_type: z.enum(['all', 'high', 'active'])
    }),
    handler: async () => ({ data: 'ui_signal' })
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