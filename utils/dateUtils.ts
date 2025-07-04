import { CycleData, PeriodLog } from '@/types/period';

// Format date to display format
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Get today's date as ISO string (YYYY-MM-DD)
export const getTodayISO = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Convert ISO date string to Date object
export const isoToDate = (isoString: string): Date => {
  return new Date(isoString);
};

// Calculate days between two dates
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  return diffDays;
};

// Get date X days from a given date
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Get date X days before a given date
export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
};

// Get ISO string for a date X days from today
export const getDateFromToday = (days: number): string => {
  const date = addDays(new Date(), days);
  return date.toISOString().split('T')[0];
};

// Calculate next period start date based on average cycle length
export const predictNextPeriod = (lastPeriodStart: string, avgCycleLength: number): string => {
  const lastDate = new Date(lastPeriodStart);
  const nextDate = addDays(lastDate, avgCycleLength);
  return nextDate.toISOString().split('T')[0];
};

// Calculate fertility window (usually 5 days before ovulation + ovulation day)
export const calculateFertilityWindow = (nextPeriodStart: string, avgCycleLength: number): { start: string; end: string } => {
  const nextPeriod = new Date(nextPeriodStart);
  // Ovulation typically occurs 14 days before the next period
  const ovulationDate = subtractDays(nextPeriod, 14);
  const fertilityStart = subtractDays(ovulationDate, 5);
  
  return {
    start: fertilityStart.toISOString().split('T')[0],
    end: ovulationDate.toISOString().split('T')[0],
  };
};

// Calculate average cycle length from historical data
export const calculateAvgCycleLength = (cycles: CycleData[]): number => {
  if (cycles.length === 0) return 28; // Default cycle length
  
  const sum = cycles.reduce((total, cycle) => total + cycle.length, 0);
  return Math.round(sum / cycles.length);
};

// Calculate average period length from historical data
export const calculateAvgPeriodLength = (cycles: CycleData[]): number => {
  if (cycles.length === 0) return 5; // Default period length
  
  const sum = cycles.reduce((total, cycle) => total + cycle.periodLength, 0);
  return Math.round(sum / cycles.length);
};

// Get the current cycle phase based on last period and average cycle length
export const getCyclePhase = (
  lastPeriodStart: string, 
  avgCycleLength: number, 
  avgPeriodLength: number
): 'period' | 'follicular' | 'ovulation' | 'luteal' => {
  const today = new Date();
  const lastPeriod = new Date(lastPeriodStart);
  const daysSinceLastPeriod = daysBetween(today, lastPeriod);
  
  if (daysSinceLastPeriod < avgPeriodLength) {
    return 'period';
  }
  
  const ovulationDay = Math.round(avgCycleLength - 14);
  
  if (daysSinceLastPeriod < ovulationDay - 2) {
    return 'follicular';
  }
  
  if (daysSinceLastPeriod >= ovulationDay - 2 && daysSinceLastPeriod <= ovulationDay + 2) {
    return 'ovulation';
  }
  
  return 'luteal';
};

// Generate dates for a month view calendar
export const getMonthDates = (year: number, month: number): Date[] => {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the first day of the week for the first day of the month
  const firstDayOfWeek = firstDay.getDay();
  
  // Add days from previous month to fill the first week
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    dates.push(date);
  }
  
  // Add all days of the current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    dates.push(date);
  }
  
  // Add days from next month to complete the last week
  const remainingDays = 42 - dates.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    dates.push(date);
  }
  
  return dates;
};