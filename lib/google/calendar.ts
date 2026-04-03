import { getUserTimeZone, formatToGoogleISO } from '../utils/date-utils';
import dayjs from 'dayjs';

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
  // Используем либо новое поле UTC, либо старое due_at
  const targetDate = task.due_datetime_utc || task.due_at;

  if (!targetDate) {
    console.log(`[GoogleSync] 🚫 Task "${task.title}" skipped: no valid date found.`);
    return { id: null }; 
  }

  try {
    const timeZone = getUserTimeZone();
    const startISO = formatToGoogleISO(targetDate, task.is_all_day);

    if (!startISO) return { id: null };

    // Расчет окончания на основе targetDate
    const endISO = formatToGoogleISO(dayjs(targetDate).add(30, 'minute').toISOString(), task.is_all_day);

    const event: any = {
      summary: `📌 ${task.title}`,
      description: `${task.description || ''}\n\nПриоритет: ${task.priority?.toUpperCase()}`,
      // Если All Day - шлем только дату. Если нет - шлем локальное время + timeZone
      start: task.is_all_day 
        ? { date: task.due_date || startISO.split('T')[0] } 
        : { dateTime: startISO, timeZone },
      end: task.is_all_day 
        ? { date: task.due_date || startISO.split('T')[0] } 
        : { dateTime: endISO, timeZone },
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
    const targetDate = task.due_datetime_utc || task.due_at;

    if (!targetDate) {
      await deleteFromGoogleCalendar(eventId, accessToken);
      return { id: null };
    }

    const timeZone = getUserTimeZone();
    const startISO = formatToGoogleISO(targetDate, task.is_all_day);
    if (!startISO) return { id: null };

    const endISO = formatToGoogleISO(dayjs(targetDate).add(30, 'minute').toISOString(), task.is_all_day);

    const event: any = {
      summary: `📌 ${task.title}`,
      description: task.description || '',
      start: task.is_all_day 
        ? { date: task.due_date || startISO.split('T')[0] } 
        : { dateTime: startISO, timeZone },
      end: task.is_all_day 
        ? { date: task.due_date || startISO.split('T')[0] } 
        : { dateTime: endISO, timeZone },
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