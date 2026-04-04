'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  deleteFromGoogleCalendar, 
  updateInGoogleCalendar, 
  addToGoogleCalendar 
} from '@/lib/google/calendar';
import { prepareTaskStorage } from "@/lib/utils/date-utils";
import dayjs from 'dayjs';

/**
 * СОЗДАНИЕ ЗАДАЧИ
 */
export async function createTask(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Подготовка данных (UTC для БД, Чистая дата для фильтров)
  const { due_date, due_datetime_utc } = prepareTaskStorage(data.due_at, data.is_all_day);

  const cleanData = {
    ...data,
    due_at: data.due_at && data.due_at.trim() !== "" ? data.due_at : null,
    due_date,
    due_datetime_utc,
    recurrence: data.recurrence === "none" ? null : data.recurrence
  };

  let googleEventId = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const providerToken = session?.provider_token;

    if (providerToken && cleanData.due_at) {
      console.log('[CreateTask] 🚀 Синхронизация с Google...');
      const googleEvent = await addToGoogleCalendar(cleanData, providerToken);
      if (googleEvent?.id) {
        googleEventId = googleEvent.id;
      }
    }
  } catch (err) {
    console.error('[CreateTask] Google Sync Error:', err);
  }

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert([{
      ...cleanData,
      user_id: user?.id,
      google_event_id: googleEventId,
      completed: false
    }])
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/dashboard');
  return newTask;
}

/**
 * ПЕРЕКЛЮЧЕНИЕ СТАТУСА И РЕКУРСИЯ
 */
export async function toggleTaskStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const newStatus = !currentStatus;

  // Просто обновляем статус. 
  // Если у задачи есть recurrence, триггер в Postgres сам создаст копию.
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ completed: newStatus })
    .eq('id', id);

  if (updateError) {
    console.error("Ошибка при смене статуса:", updateError.message);
    throw new Error(updateError.message);
  }

  revalidatePath('/dashboard');
}
/**
 * ОБНОВЛЕНИЕ ЗАДАЧИ
 */
export async function updateTask(id: string, updates: any) {
  const supabase = await createClient();

  // Подготавливаем даты для новых колонок
  const { due_date, due_datetime_utc } = prepareTaskStorage(updates.due_at, updates.is_all_day);

  try {
    const { data: updatedTask, error: dbError } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        due_at: updates.due_at,
        due_date,
        due_datetime_utc,
        project_id: updates.project_id,
        priority: updates.priority,
        is_all_day: updates.is_all_day,
        recurrence: updates.recurrence
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;

    if (updatedTask.google_event_id) {
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      if (providerToken) {
        await updateInGoogleCalendar(updatedTask.google_event_id, updatedTask, providerToken);
      }
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error(`[UpdateTask] Error:`, error);
    throw error;
  }
}

/**
 * УДАЛЕНИЕ ЗАДАЧИ
 */
export async function deleteTask(id: string) {
  const supabase = await createClient();
  
  const { data: task } = await supabase
    .from('tasks')
    .select('google_event_id')
    .eq('id', id)
    .single();

  if (task?.google_event_id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      await deleteFromGoogleCalendar(task.google_event_id, session.provider_token);
    }
  }

  await supabase.from('tasks').delete().eq('id', id);
  revalidatePath('/dashboard');
}

/**
 * СТАТУС ПРОЕКТА
 */
export async function updateProjectActiveStatus(projectId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from('projects').update({ is_active: isActive }).eq('id', projectId);
  revalidatePath('/dashboard');
}