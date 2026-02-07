import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yy', { locale: es });
};

// Format accounting date without timezone conversion
// Accounting dates are stored as DATE (without time) in the database
// and should be displayed exactly as stored, without UTC conversion
export const formatAccountingDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    // If it's already a string like "2025-02-06", parse it directly
    if (date.length === 10) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year.slice(2)}`;
    }
    // Otherwise convert to Date first
    date = new Date(date);
  }
  
  // For Date objects, extract components in local time to avoid UTC conversion
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(2);
  
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'dd/MM/yy HH:mm', { locale: es });
};

export const getPresetRanges = () => {
  const now = new Date();
  return {
    hoy: { start: startOfDay(now), end: endOfDay(now), label: 'Hoy' },
    ultimos7: { start: subDays(startOfDay(now), 6), end: endOfDay(now), label: 'Últimos 7 días' },
    estaSemana: { start: startOfWeek(now), end: endOfDay(now), label: 'Esta semana' },
    esteMes: { start: startOfMonth(now), end: endOfDay(now), label: 'Este mes' },
    ultimos30: { start: subDays(startOfDay(now), 29), end: endOfDay(now), label: 'Últimos 30 días' },
    personalizado: { start: startOfMonth(now), end: endOfDay(now), label: 'Personalizado' }
  };
};

export type PresetRange = keyof ReturnType<typeof getPresetRanges>;
