'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { deleteFromGoogleCalendar } from '@/lib/google/calendar';

export async function toggleTaskStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  
  // 1. Сначала достаем данные задачи, чтобы узнать её recurrence и параметры
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
  // Создаем копию, только если мы пометили задачу как ВЫПОЛНЕННУЮ (newStatus === true)
  // и у неё задан цикл повторения.
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

    // Вставляем новую задачу (клон старой, но с новой датой и невыполненную)
    const { error: insertError } = await supabase.from('tasks').insert([{
      user_id: task.user_id,
      title: task.title,
      due_at: nextDate.toISOString(),
      priority: task.priority,
      is_all_day: task.is_all_day,
      recurrence: task.recurrence,
      completed: false // Новая задача всегда активна
    }]);

    if (insertError) console.error("Ошибка создания повтора:", insertError.message);
  }

  // Обновляем страницу, чтобы увидеть изменения
  revalidatePath('/dashboard');
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