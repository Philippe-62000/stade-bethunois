import { addDays, startOfMonth, endOfMonth, startOfYear, endOfYear, getDay, format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface RecurrenceConfig {
  dayOfWeek: number; // 0=dimanche, 1=lundi, etc.
  time: string;
  startDate: Date;
  endDate: Date | null;
  periodType: 'monthly' | 'seasonal' | 'continuous';
}

/**
 * Génère les dates d'événements pour une récurrence mensuelle
 */
export function generateMonthlyDates(config: RecurrenceConfig): Date[] {
  const dates: Date[] = [];
  const { dayOfWeek, time, startDate, endDate } = config;
  
  const end = endDate || endOfMonth(startDate);
  const monthStart = startOfMonth(startDate);
  const monthEnd = endOfMonth(startDate);
  
  let currentDate = monthStart;
  
  while (currentDate <= monthEnd) {
    if (getDay(currentDate) === dayOfWeek) {
      const [hours, minutes] = time.split(':').map(Number);
      const eventDate = new Date(currentDate);
      eventDate.setHours(hours, minutes, 0, 0);
      
      if (eventDate >= startDate && eventDate <= end) {
        dates.push(eventDate);
      }
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Génère les dates d'événements pour une récurrence saisonnière (septembre à juin)
 */
export function generateSeasonalDates(config: RecurrenceConfig): Date[] {
  const dates: Date[] = [];
  const { dayOfWeek, time, startDate, endDate } = config;
  
  if (!endDate) {
    throw new Error('Une récurrence saisonnière doit avoir une date de fin');
  }
  
  // Saison : septembre (mois 8) à juin (mois 5 de l'année suivante)
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (getDay(currentDate) === dayOfWeek) {
      const [hours, minutes] = time.split(':').map(Number);
      const eventDate = new Date(currentDate);
      eventDate.setHours(hours, minutes, 0, 0);
      
      if (eventDate >= startDate && eventDate <= endDate) {
        dates.push(eventDate);
      }
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Génère les dates d'événements pour une récurrence continue
 */
export function generateContinuousDates(config: RecurrenceConfig, monthsAhead: number = 6): Date[] {
  const dates: Date[] = [];
  const { dayOfWeek, time, startDate } = config;
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (getDay(currentDate) === dayOfWeek) {
      const [hours, minutes] = time.split(':').map(Number);
      const eventDate = new Date(currentDate);
      eventDate.setHours(hours, minutes, 0, 0);
      
      if (eventDate >= startDate) {
        dates.push(eventDate);
      }
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

/**
 * Génère toutes les dates d'événements selon le type de récurrence
 */
export function generateEventDates(config: RecurrenceConfig): Date[] {
  switch (config.periodType) {
    case 'monthly':
      return generateMonthlyDates(config);
    case 'seasonal':
      return generateSeasonalDates(config);
    case 'continuous':
      return generateContinuousDates(config);
    default:
      return [];
  }
}

/**
 * Formate une date pour l'affichage
 */
export function formatEventDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: fr });
}

/**
 * Formate une date et heure pour l'affichage
 */
export function formatEventDateTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':');
  const eventDate = new Date(date);
  eventDate.setHours(parseInt(hours), parseInt(minutes));
  return format(eventDate, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
}
