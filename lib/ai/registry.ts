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