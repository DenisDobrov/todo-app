import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getUserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Подготовка данных для Google Calendar
 * Принимает либо новую колонку due_datetime_utc, либо старую строку
 */
export const formatToGoogleISO = (dateInput: string | Date | null | undefined, isAllDay: boolean = false) => {
  if (!dateInput) return null;

  const dateStr = dateInput.toString();
  
  // Если это AllDay (из колонки due_date или старой логики)
  const isDateOnly = !dateStr.includes(':') && !dateStr.includes('T');

  if (isAllDay || isDateOnly) {
    const d = dayjs.utc(dateStr);
    if (!d.isValid()) return null;
    return d.format('YYYY-MM-DD');
  }

  // Для задач со временем отправляем локальное время БЕЗ 'Z', 
  // так как в Google Calendar мы передаем timeZone отдельно
  return dayjs(dateStr).tz(getUserTimeZone()).format('YYYY-MM-DDTHH:mm:ss');
};

/**
 * Форматирование для value в <input type="datetime-local"> или "date"
 */
export const formatToInputDateTime = (dateInput: string | Date | null) => {
  if (!dateInput) return "";
  const d = dayjs(dateInput);
  if (!d.isValid()) return "";

  // Если это чистая дата (YYYY-MM-DD)
  if (dateInput.toString().length <= 10 && !dateInput.toString().includes(':')) {
    return d.format('YYYY-MM-DD');
  }

  // Для datetime-local возвращаем локальное время в формате ISO без Z
  return d.tz(getUserTimeZone()).format('YYYY-MM-DDTHH:mm');
};

/**
 * Отображение даты в TaskItem
 * Поддерживает новую архитектуру (due_date + due_datetime_utc)
 */
export const formatTaskDate = (dateInput: string | null, isAllDay: boolean) => {
  if (!dateInput) return null;
  
  const d = dayjs(dateInput);
  if (!d.isValid()) return null;

  if (isAllDay) {
    return `📅 ${d.locale('ru').format('D MMM')}`;
  }

  // Отображаем время, переведенное из UTC в зону пользователя
  return d.tz(getUserTimeZone()).locale('ru').format('D MMM, HH:mm');
};

/**
 * Проверка просроченности
 */
export const isOverdue = (dateInput: string | null, completed: boolean) => {
  if (!dateInput || completed) return false;
  // Сравниваем момент "сейчас" с дедлайном
  return dayjs(dateInput).isBefore(dayjs());
};

/**
 * НОВЫЙ ХЕЛПЕР: Подготовка данных для сохранения в БД
 * Возвращает объект для миграции/сохранения в новые колонки
 */
export const prepareTaskStorage = (inputValue: string, isAllDay: boolean) => {
  if (!inputValue) return { due_date: null, due_datetime_utc: null };

  if (isAllDay) {
    return {
      due_date: dayjs(inputValue).format('YYYY-MM-DD'),
      due_datetime_utc: null
    };
  }

  return {
    due_date: dayjs(inputValue).format('YYYY-MM-DD'),
    // Сохраняем в базу как чистый UTC
    due_datetime_utc: dayjs.tz(inputValue, getUserTimeZone()).toISOString()
  };
};