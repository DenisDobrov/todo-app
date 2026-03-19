'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}