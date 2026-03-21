// lib/google/calendar.ts

export async function addToGoogleCalendar(task: any, accessToken: string) {
  try {
    const startTime = new Date(task.due_at);
    // Делаем событие на 30 минут по умолчанию
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const event = {
      summary: `📌 ${task.title}`,
      description: `Приоритет: ${task.priority?.toUpperCase()}\nСоздано через SOLUTER AI`,
      start: {
        dateTime: task.is_all_day ? undefined : startTime.toISOString(),
        date: task.is_all_day ? startTime.toISOString().split('T')[0] : undefined,
        timeZone: 'America/Santiago',
      },
      end: {
        dateTime: task.is_all_day ? undefined : endTime.toISOString(),
        date: task.is_all_day ? endTime.toISOString().split('T')[0] : undefined,
        timeZone: 'America/Santiago',
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Ошибка Google API:', data);
      return { id: null, error: data };
    }

    return data;
  } catch (error) {
    console.error('❌ Исключение при вызове Google Calendar:', error);
    return { id: null, error };
  }
}

export async function deleteFromGoogleCalendar(eventId: string, accessToken: string) {
  console.log(`🗑️ API CALL: Google Calendar Delete -> ${eventId}`);
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

        console.log(`📡 Google API Response Status: ${response.status} (${response.statusText})`);
        return response.ok;
  } catch (error) {
    console.error('❌ Ошибка при удалении из Google Calendar:', error);
    return false;
  }
}
// lib/google/calendar.ts

export async function updateInGoogleCalendar(eventId: string, task: any, accessToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: task.title,
          description: task.description,
          start: {
            dateTime: task.due_at,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            // Для PATCH Google требует end, если меняется start. 
            // Добавляем 30 минут по умолчанию
            dateTime: new Date(new Date(task.due_at).getTime() + 30 * 60000).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Calendar API Error: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error);
    throw error;
  }
}