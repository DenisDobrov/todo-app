'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { deleteFromGoogleCalendar } from '@/lib/google/calendar';
import { updateInGoogleCalendar } from "@/lib/google/calendar";

import { addToGoogleCalendar } from "@/lib/google/calendar"; // Убедись, что импорт есть

// actions.ts

export async function createTask(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. ОЧИСТКА ДАННЫХ
  const cleanData = {
    ...data,
    due_at: data.due_at && data.due_at.trim() !== "" ? data.due_at : null,
    recurrence: data.recurrence === "none" ? null : data.recurrence
  };

  let googleEventId = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;

    // 2. СИНХРОНИЗАЦИЯ (теперь активна)
    // Проверяем: есть токен, есть дата и это не проект "Когда-нибудь"
    if (providerToken && cleanData.due_at) {
      console.log('[CreateTask] 🚀 Отправка в Google Calendar...');
      
      // Используем импортированную функцию addToGoogleCalendar
      const googleEvent = await addToGoogleCalendar(cleanData, providerToken);
      
      if (googleEvent?.id) {
        googleEventId = googleEvent.id;
        console.log('[CreateTask] ✅ Google Event ID получен:', googleEventId);
      }
    } else {
      if (!providerToken) console.log('[CreateTask] ⚠️ Пропуск Google: нет токена');
      if (!cleanData.due_at) console.log('[CreateTask] ℹ️ Пропуск Google: нет даты');
    }
  } catch (err) {
    console.error('[CreateTask] 🚨 Google Sync Error:', err);
    // Не блокируем создание в БД, если календарь ответил ошибкой
  }

  // 3. СОХРАНЕНИЕ В SUPABASE
  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([{
      ...cleanData,
      user_id: user?.id,
      google_event_id: googleEventId, // Теперь здесь будет реальный ID
      completed: false
    }])
    .select()
    .single();

  if (error) {
    console.error('[CreateTask] Database Error:', error.message);
    throw error;
  }

  revalidatePath('/dashboard');
  return newTask;
}
export async function updateProjectActiveStatus(projectId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update({ is_active: isActive })
    .eq('id', projectId);
    
  if (error) {
    console.error("Ошибка обновления статуса проекта:", error.message);
    throw error;
  }
  
  // КРИТИЧНО: Чтобы проекты сразу поменялись местами на экране
    revalidatePath('/dashboard');
}

export async function toggleTaskStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  // 1. Сначала достаем данные задачи, чтобы узнать её параметры
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !task) throw new Error(fetchError?.message || "Task not found");

  const newStatus = !currentStatus;

  // 2. Обновляем текущую задачу (завершаем или возвращаем в работу)
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ completed: newStatus })
    .eq('id', id);

  if (updateError) throw new Error(updateError.message);

  // 3. МАГИЯ ПОВТОРЕНИЯ (Recurrence)
  if (newStatus === true && task.recurrence) {
    const currentDate = new Date(task.due_at || new Date());
    let nextDate = new Date(currentDate);

    // Рассчитываем следующую дату
    switch (task.recurrence) {
      case 'daily': 
        nextDate.setDate(nextDate.getDate() + 1); 
        break;
      case 'weekly': 
        nextDate.setDate(nextDate.getDate() + 7); 
        break;
      case 'monthly': 
        nextDate.setMonth(nextDate.getMonth() + 1); 
        break;
      case 'yearly': 
        nextDate.setFullYear(nextDate.getFullYear() + 1); 
        break;
    }

    let nextGoogleEventId = null;

    // 4. СИНХРОНИЗАЦИЯ НОВОЙ ЗАДАЧИ С GOOGLE
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      // Создаем событие в Google, если есть токен и у оригинала была дата
      if (providerToken && task.due_at) {
        console.log(`[Recurrence] Создаю повтор в Google Calendar для: "${task.title}"`);
        
        const nextTaskData = {
          title: task.title,
          description: task.description,
          due_at: nextDate.toISOString(),
          is_all_day: task.is_all_day,
          priority: task.priority,
          project_id: task.project_id
        };

        const googleEvent = await addToGoogleCalendar(nextTaskData, providerToken);
        if (googleEvent?.id) {
          nextGoogleEventId = googleEvent.id;
          console.log(`[Recurrence] Новый Google Event ID получен: ${nextGoogleEventId}`);
        }
      }
    } catch (err) {
      console.error("[Recurrence] Ошибка синхронизации с Google:", err);
      // Продолжаем работу, даже если Google подвел — задача в БД важнее
    }

    // 5. Вставляем новую задачу (клон старой с новым Google ID)
    const { error: insertError } = await supabase.from('tasks').insert([{
      user_id: task.user_id,
      title: task.title,
      description: task.description,
      due_at: nextDate.toISOString(),
      priority: task.priority,
      project_id: task.project_id,
      is_all_day: task.is_all_day,
      recurrence: task.recurrence,
      google_event_id: nextGoogleEventId, // Привязываем новый ID
      completed: false
    }]);

    if (insertError) console.error("Ошибка создания повтора в БД:", insertError.message);
  }

  // Обновляем страницу, чтобы увидеть изменения
  revalidatePath('/dashboard');
}

export async function updateTask(id: string, updates: any) {
  console.log(`[UpdateTask] Начинаю обновление задачи ${id}...`);
  const supabase = await createClient();

  try {
    // 1. Обновляем в Supabase
    const { data: updatedTask, error: dbError } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        due_at: updates.due_at,
        project_id: updates.project_id,
        priority: updates.priority
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error(`[UpdateTask] Ошибка БД: ${dbError.message}`);
      throw dbError;
    }
    console.log(`[UpdateTask] База данных обновлена успешно.`);

    // 2. Синхронизация с Google
    if (updatedTask.google_event_id) {
      console.log(`[UpdateTask] Обнаружен Google Event ID: ${updatedTask.google_event_id}`);
      
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;

      if (providerToken) {
        console.log('[UpdateTask] Токен провайдера найден. Отправляю запрос в Google...');
        await updateInGoogleCalendar(updatedTask.google_event_id, updatedTask, providerToken);
        console.log('[UpdateTask] Google Calendar синхронизирован.');
      } else {
        console.warn('[UpdateTask] Provider Token отсутствует. Синхронизация невозможна.');
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error(`[UpdateTask] Критическая ошибка:`, error);
    throw error;
  }
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  
  console.log('--- 🗑️ НАЧАЛО УДАЛЕНИЯ ---');
  console.log(`🆔 ID задачи в БД: ${id}`);

// 1. Получаем данные задачи
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('title, google_event_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('❌ Ошибка при поиске задачи:', fetchError.message);
    throw new Error("Задача не найдена");
  }

  console.log(`📝 Название: "${task?.title}"`);
  console.log(`📅 Google Event ID: ${task?.google_event_id || 'ОТСУТСТВУЕТ'}`);

  // 2. Синхронное удаление из Google Calendar
  if (task?.google_event_id) {
    const { data: { session } } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;

    if (providerToken) {
      console.log('🚀 Отправка запроса на удаление в Google API...');
      const isDeleted = await deleteFromGoogleCalendar(task.google_event_id, providerToken);
      console.log(isDeleted ? '✅ Удалено из Google Calendar' : '⚠️ Ошибка удаления из Google (возможно, событие уже удалено вручную)');
    } else {
      console.log('⚠️ Токен провайдера не найден, удаление только локально');
    }
  }

  // 3. Удаление из базы данных Supabase
  console.log('📡 Удаление из Supabase...');
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('❌ Ошибка удаления из БД:', deleteError.message);
    throw new Error(deleteError.message);
  }

  console.log('🏁 УДАЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО');
  console.log('-------------------------');
  
  revalidatePath('/dashboard');
}