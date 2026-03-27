// lib/google/calendar.ts
import { getUserTimeZone, formatToGoogleISO } from '../utils/date-utils';

const getRRULE = (recurrence: string | null) => {
  if (!recurrence || recurrence === 'none') return null;
  const rrules: Record<string, string[]> = {
    daily: ["RRULE:FREQ=DAILY"],
    weekly: ["RRULE:FREQ=WEEKLY"],
    monthly: ["RRULE:FREQ=MONTHLY"],
    yearly: ["RRULE:FREQ=YEARLY"]
  };
  return rrules[recurrence] || null;
};

export async function addToGoogleCalendar(task: any, accessToken: string) {
// 1. Первичная проверка входных данных
  if (!task.due_at || task.due_at === 'null' || task.due_at === '') {
    console.log(`[GoogleSync] 🚫 Task "${task.title}" skipped: no valid due_at date found.`);
    return { id: null }; 
  }

  try {
    const timeZone = getUserTimeZone();
    const taskDate = new Date(task.due_at);

 // 2. Проверка на валидность объекта даты
    if (isNaN(taskDate.getTime())) {
      console.log(`[GoogleSync] ❌ Некорректный формат даты: ${task.due_at}. Пропускаем.`);
      return { id: null };
    }

    const startISO = formatToGoogleISO(task.due_at);

// 3. Если утилита форматирования вернула null (наш новый предохранитель в utils)
    if (!startISO) {
      console.log(`[GoogleSync] 🚫 Task "${task.title}" skipped: formatToGoogleISO returned null.`);
      return { id: null };
    }
    // Расчет времени окончания (+30 мин)
    const endISO = formatToGoogleISO(new Date(taskDate.getTime() + 30 * 60000));
    console.log(`[GoogleSync] Creating Event: "${task.title}" | Start: ${startISO} | TZ: ${timeZone}`);

    const event: any = {
      summary: `📌 ${task.title}`,
      description: `${task.description || ''}\n\nПриоритет: ${task.priority?.toUpperCase()}`,
      start: task.is_all_day ? { date: startISO.split('T')[0] } : { dateTime: startISO, timeZone },
      end: task.is_all_day ? { date: startISO.split('T')[0] } : { dateTime: endISO, timeZone },
      recurrence: getRRULE(task.recurrence)
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return await response.json();
  } catch (error) { return { id: null, error }; }
}

export async function updateInGoogleCalendar(eventId: string, task: any, accessToken: string) {
  try {
// Если даты нет — удаляем событие из календаря, чтобы оно не висело на старом времени
    if (!task.due_at || task.due_at === 'null' || task.due_at === '') {
      console.log(`[GoogleSync] No date for task, deleting event ${eventId}`);
      await deleteFromGoogleCalendar(eventId, accessToken);
      return { id: null };
    }
    const timeZone = getUserTimeZone();
    const startISO = formatToGoogleISO(task.due_at);
    if (!startISO) {
      await deleteFromGoogleCalendar(eventId, accessToken);
      return { id: null };
    }
    const endISO = formatToGoogleISO(new Date(new Date(task.due_at).getTime() + 30 * 60000));

    console.log(`[GoogleSync] Updating Event ${eventId} | TZ: ${timeZone}`);
    const event: any = {
      summary: `📌 ${task.title}`,
      description: task.description || '',
      start: task.is_all_day 
        ? { date: startISO.split('T')[0], dateTime: null } 
        : { dateTime: startISO, timeZone, date: null },
      end: task.is_all_day 
        ? { date: startISO.split('T')[0], dateTime: null } 
        : { dateTime: endISO, timeZone, date: null },
      recurrence: getRRULE(task.recurrence) || [] 
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return await response.json();
  } catch (error) { throw error; }
}

export async function deleteFromGoogleCalendar(eventId: string, accessToken: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    return response.ok;
  } catch (error) { return false; }
}