import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yy', { locale: es });
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'dd/MM/yy HH:mm', { locale: es });
};

export const getPresetRanges = () => ({
  hoy: { start: startOfDay(new Date()), end: endOfDay(new Date()), label: 'Hoy' },
  ultimos7: { start: subDays(startOfDay(new Date()), 6), end: endOfDay(new Date()), label: 'Últimos 7 días' },
  estaSemana: { start: startOfWeek(new Date()), end: endOfWeek(new Date()), label: 'Esta semana' },
  esteMes: { start: startOfMonth(new Date()), end: endOfDay(new Date()), label: 'Este mes' },
  ultimos30: { start: subDays(startOfDay(new Date()), 29), end: endOfDay(new Date()), label: 'Últimos 30 días' },
  personalizado: { start: startOfMonth(new Date()), end: endOfDay(new Date()), label: 'Personalizado' }
});

export type PresetRange = keyof ReturnType<typeof getPresetRanges>;
