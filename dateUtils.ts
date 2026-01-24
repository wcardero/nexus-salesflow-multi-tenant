import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yy', { locale: es });
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
