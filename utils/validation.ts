import { CYCLE_CONSTANTS, VALIDATION_MESSAGES } from '@/constants/app';
import { ValidationResult } from '@/types/ui';

export const validateCycleLength = (value: string): ValidationResult => {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED_FIELD };
  }
  
  if (num < CYCLE_CONSTANTS.MIN_CYCLE_LENGTH || num > CYCLE_CONSTANTS.MAX_CYCLE_LENGTH) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_CYCLE_LENGTH };
  }
  
  return { isValid: true };
};

export const validatePeriodLength = (value: string): ValidationResult => {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return { isValid: false, error: VALIDATION_MESSAGES.REQUIRED_FIELD };
  }
  
  if (num < CYCLE_CONSTANTS.MIN_PERIOD_LENGTH || num > CYCLE_CONSTANTS.MAX_PERIOD_LENGTH) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_PERIOD_LENGTH };
  }
  
  return { isValid: true };
};

export const validateDate = (date: string): ValidationResult => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_DATE };
  }
  
  // Don't allow future dates
  if (dateObj > new Date()) {
    return { isValid: false, error: 'Cannot select future dates' };
  }
  
  return { isValid: true };
};