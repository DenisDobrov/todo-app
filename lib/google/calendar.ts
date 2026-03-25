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
  try {
    const timeZone = getUserTimeZone();
    const startISO = formatToGoogleISO(task.due_at);
    const endISO = formatToGoogleISO(new Date(new Date(task.due_at).getTime() + 30 * 60000));

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
    const timeZone = getUserTimeZone();
    const startISO = formatToGoogleISO(task.due_at);
    const endISO = formatToGoogleISO(new Date(new Date(task.due_at).getTime() + 30 * 60000));

    console.log(`[GoogleSync] Updating Event ${eventId}`);
    console.log(`[GoogleSync] TZ: ${timeZone} | Start: ${startISO} | AllDay: ${task.is_all_day}`);

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