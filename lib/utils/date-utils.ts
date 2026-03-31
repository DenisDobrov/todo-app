// lib/utils/date-utils.ts

export const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatToGoogleISO = (dateInput: string | Date | null | undefined, isAllDay: boolean = false) => {
  if (!dateInput) return null;

  const dateStr = dateInput.toString();
  
  // Проверяем, является ли это "чистой датой" (ISO Date Only)
  // Если в строке нет времени (двоеточия), значит это весь день
  const isDateOnly = !dateStr.includes(':') && !dateStr.includes('T');

  if (isAllDay || isDateOnly) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    // Извлекаем компоненты даты без учета часового пояса
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Логика для DateTime (с часовым поясом)
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('.')[0];
};

export const formatToInputDateTime = (dateInput: string | Date | null) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const offset = d.getTimezoneOffset() * 60000;
  const formatted = new Date(d.getTime() - offset).toISOString().slice(0, 16);
  console.log(`[DateUtils] Input Format: ${dateInput} -> ${formatted}`);
  return formatted;
};

export const formatTaskDate = (dateInput: string | null, isAllDay: boolean) => {
  if (!dateInput) return null;
  if (isAllDay) return "📅 Весь день";
  return new Date(dateInput).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};

export const isOverdue = (dateInput: string | null, completed: boolean) => {
  if (!dateInput || completed) return false;
  return new Date(dateInput) < new Date();
};