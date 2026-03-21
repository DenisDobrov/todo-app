// lib/google/calendar.ts

const getRRULE = (recurrence: string | null) => {
  if (!recurrence || recurrence === 'none') return null;
  switch (recurrence) {
    case 'daily': return ["RRULE:FREQ=DAILY"];
    case 'weekly': return ["RRULE:FREQ=WEEKLY"];
    case 'monthly': return ["RRULE:FREQ=MONTHLY"];
    case 'yearly': return ["RRULE:FREQ=YEARLY"];
    default: return null;
  }
};

const userTimeZone = 'America/Santiago';

export async function addToGoogleCalendar(task: any, accessToken: string) {
  try {
    const startTime = new Date(task.due_at);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const startISO = startTime.toISOString().split('.')[0];
    const endISO = endTime.toISOString().split('.')[0];

    const event: any = {
      summary: `📌 ${task.title}`,
      description: `${task.description || ''}\n\nПриоритет: ${task.priority?.toUpperCase()}\nСоздано через SOLUTER AI`,
      start: task.is_all_day 
        ? { date: startISO.split('T')[0], timeZone: userTimeZone } 
        : { dateTime: startISO, timeZone: userTimeZone },
      end: task.is_all_day 
        ? { date: startISO.split('T')[0], timeZone: userTimeZone } 
        : { dateTime: endISO, timeZone: userTimeZone },
    };

    const rrule = getRRULE(task.recurrence);
    if (rrule) event.recurrence = rrule;

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('❌ Ошибка Google Calendar (Add):', error);
    return { id: null, error };
  }
}

export async function updateInGoogleCalendar(eventId: string, task: any, accessToken: string) {
  try {
    const startTime = new Date(task.due_at);
    const endTime = new Date(startTime.getTime() + 30 * 60000);
    const startISO = startTime.toISOString().split('.')[0];
    const endISO = endTime.toISOString().split('.')[0];

    const event: any = {
      summary: `📌 ${task.title}`,
      description: `${task.description || ''}\n\nПриоритет: ${task.priority?.toUpperCase()}`,
      start: task.is_all_day 
        ? { date: startISO.split('T')[0], dateTime: null } 
        : { dateTime: startISO, timeZone: userTimeZone, date: null },
      end: task.is_all_day 
        ? { date: startISO.split('T')[0], dateTime: null } 
        : { dateTime: endISO, timeZone: userTimeZone, date: null },
      recurrence: getRRULE(task.recurrence) || [] 
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('❌ Ошибка Google Calendar (Update):', error);
    throw error;
  }
}

export async function deleteFromGoogleCalendar(eventId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );
    return response.ok;
  } catch (error) {
    console.error('❌ Ошибка при удалении из Google:', error);
    return false;
  }
}