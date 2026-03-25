// lib/utils/date-utils.ts

export const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatToGoogleISO = (dateInput: string | Date) => {
  const d = new Date(dateInput);
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