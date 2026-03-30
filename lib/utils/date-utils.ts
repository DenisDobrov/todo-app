// lib/utils/date-utils.ts

export const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatToGoogleISO = (dateInput: string | Date | null | undefined,isAllDay: boolean = false) => {
  // Если даты нет — возвращаем null, чтобы вызывающий код (календарь) понял это
  if (!dateInput || dateInput === 'null') {
    console.log(`[DateUtils] Google Format: Input is empty, returning null`);
    return null;
  }

  const d = new Date(dateInput);
  // Проверка на валидность даты (чтобы не было 1970 года или Invalid Date)
    if (isNaN(d.getTime())) {
      return null;
    }
    if (isAllDay) {
    // Используем методы UTC, чтобы игнорировать смещение Боготы (-5)
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
  const offset = d.getTimezoneOffset() * 60000;
  const formatted = new Date(d.getTime() - offset).toISOString().split('.')[0];
  
  console.log(`[DateUtils] Google Format: ${dateInput} -> ${formatted} (TZ: ${getUserTimeZone()})`);
  return formatted;
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