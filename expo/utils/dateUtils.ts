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

// Calculate days between two dates (signed difference - positive if date2 is after date1)
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round((date2.getTime() - date1.getTime()) / oneDay);
  return diffDays;
};

// Calculate absolute days between two dates
export const absoluteDaysBetween = (date1: Date, date2: Date): number => {
  return Math.abs(daysBetween(date1, date2));
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

// Enhanced fertility window calculation
export const calculateFertilityWindow = (
  lastPeriodStart: string, 
  avgCycleLength: number
): { start: string; end: string; ovulationDate: string } => {
  const lastPeriod = new Date(lastPeriodStart);
  
  // Calculate the next period start
  const nextPeriodStart = addDays(lastPeriod, avgCycleLength);
  
  // Ovulation typically occurs 14 days before the next period
  const ovulationDate = subtractDays(nextPeriodStart, 14);
  
  // Fertile window is typically 5 days before ovulation + ovulation day + 1 day after
  const fertilityStart = subtractDays(ovulationDate, 5);
  const fertilityEnd = addDays(ovulationDate, 1);
  
  return {
    start: fertilityStart.toISOString().split('T')[0],
    end: fertilityEnd.toISOString().split('T')[0],
    ovulationDate: ovulationDate.toISOString().split('T')[0],
  };
};

// Calculate fertility window for any given month
export const calculateFertilityWindowForMonth = (
  year: number,
  month: number,
  lastPeriodStart: string,
  avgCycleLength: number
): { start: string; end: string; ovulationDate: string }[] => {
  const windows: { start: string; end: string; ovulationDate: string }[] = [];
  
  // Get the first and last day of the month
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  // Start from the last period and calculate cycles that might overlap with this month
  let currentPeriodStart = new Date(lastPeriodStart);
  
  // Go back a few cycles to ensure we catch any that might overlap
  for (let i = 0; i < 3; i++) {
    currentPeriodStart = subtractDays(currentPeriodStart, avgCycleLength);
  }
  
  // Calculate forward until we're past the month
  while (currentPeriodStart <= addDays(monthEnd, avgCycleLength)) {
    const window = calculateFertilityWindow(
      currentPeriodStart.toISOString().split('T')[0],
      avgCycleLength
    );
    
    const windowStart = new Date(window.start);
    const windowEnd = new Date(window.end);
    
    // Check if this window overlaps with the current month
    if (windowStart <= monthEnd && windowEnd >= monthStart) {
      windows.push(window);
    }
    
    currentPeriodStart = addDays(currentPeriodStart, avgCycleLength);
  }
  
  return windows;
};

// Check if a date is in fertile window
export const isDateInFertileWindow = (
  date: Date,
  lastPeriodStart: string,
  avgCycleLength: number
): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const windows = calculateFertilityWindowForMonth(year, month, lastPeriodStart, avgCycleLength);
  
  return windows.some(window => {
    return dateStr >= window.start && dateStr <= window.end;
  });
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
  const daysSinceLastPeriod = daysBetween(lastPeriod, today);
  
  // If we're past the expected cycle length, we might be in the next cycle
  if (daysSinceLastPeriod >= avgCycleLength) {
    // Calculate how many cycles we might be ahead
    const cyclesPassed = Math.floor(daysSinceLastPeriod / avgCycleLength);
    const adjustedDaysSince = daysSinceLastPeriod - (cyclesPassed * avgCycleLength);
    
    // Check if we're in the period phase of a new cycle
    if (adjustedDaysSince < avgPeriodLength) {
      return 'period';
    }
    
    // Calculate phase based on adjusted days
    const ovulationDay = avgCycleLength - 14; // Ovulation typically 14 days before next period
    
    if (adjustedDaysSince < ovulationDay - 3) {
      return 'follicular';
    }
    
    if (adjustedDaysSince >= ovulationDay - 3 && adjustedDaysSince <= ovulationDay + 1) {
      return 'ovulation';
    }
    
    return 'luteal';
  }
  
  // Normal cycle progression
  if (daysSinceLastPeriod < 0) {
    // This shouldn't happen, but handle gracefully
    return 'luteal';
  }
  
  // Period phase (days 1-avgPeriodLength)
  if (daysSinceLastPeriod < avgPeriodLength) {
    return 'period';
  }
  
  // Calculate ovulation day (typically 14 days before next period)
  const ovulationDay = avgCycleLength - 14;
  
  // Follicular phase (after period, before ovulation window)
  if (daysSinceLastPeriod < ovulationDay - 3) {
    return 'follicular';
  }
  
  // Ovulation phase (3 days before to 1 day after calculated ovulation)
  if (daysSinceLastPeriod >= ovulationDay - 3 && daysSinceLastPeriod <= ovulationDay + 1) {
    return 'ovulation';
  }
  
  // Luteal phase (after ovulation, before next period)
  return 'luteal';
};

// Get cycle day (1-based, where 1 is the first day of period)
export const getCycleDay = (
  lastPeriodStart: string,
  avgCycleLength: number
): number => {
  const today = new Date();
  const lastPeriod = new Date(lastPeriodStart);
  const daysSinceLastPeriod = daysBetween(lastPeriod, today);
  
  if (daysSinceLastPeriod < 0) {
    return 1; // Default to day 1 if calculation is invalid
  }
  
  // If we're past the expected cycle length, calculate the current cycle day
  if (daysSinceLastPeriod >= avgCycleLength) {
    const cyclesPassed = Math.floor(daysSinceLastPeriod / avgCycleLength);
    const adjustedDaysSince = daysSinceLastPeriod - (cyclesPassed * avgCycleLength);
    return adjustedDaysSince + 1; // +1 because cycle days are 1-based
  }
  
  return daysSinceLastPeriod + 1; // +1 because cycle days are 1-based
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