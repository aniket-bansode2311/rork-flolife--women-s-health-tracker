export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPeriodDay: boolean;
  isPredictedPeriod: boolean;
  isFertileDay: boolean;
}

export interface PredictionAccuracy {
  percentage: number;
  confidence: 'low' | 'medium' | 'high';
  dataQuality: 'insufficient' | 'fair' | 'good' | 'excellent';
}