import { CYCLE_CONSTANTS, VALIDATION_MESSAGES } from '@/constants/app';
import { FlowIntensity } from '@/types/period';
import { DataEncryption } from './encryption';

// Enhanced validation utilities with comprehensive error handling
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Security validation for input sanitization
export const sanitizeAndValidateInput = async (input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  encrypt?: boolean;
} = {}): Promise<{ sanitized: string; isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  let sanitized = input || '';
  
  // Basic sanitization
  sanitized = sanitized.trim();
  
  // Length validation
  const maxLength = options.maxLength || 1000;
  if (sanitized.length > maxLength) {
    errors.push(`Input must be less than ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // HTML/Script injection prevention
  if (!options.allowHtml) {
    sanitized = sanitized.replace(/[<>"'&]/g, '');
    
    // Check for potential script injection
    const dangerousPatterns = [
      /javascript:/i,
      /on\w+\s*=/i,
      /<script/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(sanitized))) {
      errors.push('Input contains potentially harmful content');
      sanitized = sanitized.replace(/[^\w\s\-\.@]/g, '');
    }
  }
  
  // Encrypt if requested
  if (options.encrypt && sanitized) {
    const encrypted = await DataEncryption.encrypt(sanitized);
    if (encrypted) {
      sanitized = JSON.stringify(encrypted);
    }
  }
  
  return {
    sanitized,
    isValid: errors.length === 0,
    errors
  };
};

// Enhanced date validation with security checks
export const validateDateEnhanced = (dateString: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!dateString) {
    errors.push('Date is required');
    return { isValid: false, errors };
  }
  
  // Check for SQL injection patterns in date
  const sqlPatterns = /['";`\-\-\/\*\*\/]/;
  if (sqlPatterns.test(dateString)) {
    errors.push('Invalid date format');
    return { isValid: false, errors };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
    return { isValid: false, errors };
  }
  
  // Check if date is not in the future (more than today)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (date > today) {
    errors.push('Date cannot be in the future');
  }
  
  // Check if date is not too far in the past (more than 10 years)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  
  if (date < tenYearsAgo) {
    errors.push('Date cannot be more than 10 years ago');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Cycle length validation with enhanced security
export const validateCycleLengthEnhanced = (length: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Number.isInteger(length)) {
    errors.push('Cycle length must be a whole number');
  }
  
  if (length < CYCLE_CONSTANTS.MIN_CYCLE_LENGTH || length > CYCLE_CONSTANTS.MAX_CYCLE_LENGTH) {
    errors.push(VALIDATION_MESSAGES.INVALID_CYCLE_LENGTH);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Period length validation with enhanced security
export const validatePeriodLengthEnhanced = (length: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Number.isInteger(length)) {
    errors.push('Period length must be a whole number');
  }
  
  if (length < CYCLE_CONSTANTS.MIN_PERIOD_LENGTH || length > CYCLE_CONSTANTS.MAX_PERIOD_LENGTH) {
    errors.push(VALIDATION_MESSAGES.INVALID_PERIOD_LENGTH);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Flow intensity validation
export const validateFlowIntensity = (flow: string): flow is FlowIntensity => {
  return ['none', 'light', 'medium', 'heavy'].includes(flow);
};

// Comprehensive form validation with security
export const validatePeriodLog = async (data: {
  date?: string;
  flow?: string;
  symptoms?: string[];
  mood?: string;
  notes?: string;
}): Promise<{ isValid: boolean; errors: Record<string, string[]>; sanitizedData: any }> => {
  const errors: Record<string, string[]> = {};
  const sanitizedData: any = {};
  
  // Date validation
  if (data.date) {
    const dateValidation = validateDateEnhanced(data.date);
    if (!dateValidation.isValid) {
      errors.date = dateValidation.errors;
    } else {
      sanitizedData.date = data.date;
    }
  } else {
    errors.date = [VALIDATION_MESSAGES.REQUIRED_FIELD];
  }
  
  // Flow validation
  if (!data.flow) {
    errors.flow = [VALIDATION_MESSAGES.REQUIRED_FIELD];
  } else if (!validateFlowIntensity(data.flow)) {
    errors.flow = ['Please select a valid flow intensity'];
  } else {
    sanitizedData.flow = data.flow;
  }
  
  // Symptoms validation
  if (data.symptoms) {
    const validSymptoms = data.symptoms.filter(symptom => 
      typeof symptom === 'string' && symptom.length > 0 && symptom.length < 100
    );
    sanitizedData.symptoms = validSymptoms;
  }
  
  // Mood validation
  if (data.mood) {
    const moodValidation = await sanitizeAndValidateInput(data.mood, { maxLength: 50 });
    if (moodValidation.isValid) {
      sanitizedData.mood = moodValidation.sanitized;
    } else {
      errors.mood = moodValidation.errors;
    }
  }
  
  // Notes validation
  if (data.notes) {
    const notesValidation = await sanitizeAndValidateInput(data.notes, { maxLength: 500 });
    if (notesValidation.isValid) {
      sanitizedData.notes = notesValidation.sanitized;
    } else {
      errors.notes = notesValidation.errors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
};

// Enhanced profile validation
export const validateUserProfile = async (profile: {
  cycleAvgLength?: number;
  periodAvgLength?: number;
  birthDate?: string;
  height?: number;
  weight?: number;
}): Promise<{ isValid: boolean; errors: Record<string, string[]>; sanitizedData: any }> => {
  const errors: Record<string, string[]> = {};
  const sanitizedData: any = {};
  
  if (profile.cycleAvgLength !== undefined) {
    const cycleValidation = validateCycleLengthEnhanced(profile.cycleAvgLength);
    if (!cycleValidation.isValid) {
      errors.cycleAvgLength = cycleValidation.errors;
    } else {
      sanitizedData.cycleAvgLength = profile.cycleAvgLength;
    }
  }
  
  if (profile.periodAvgLength !== undefined) {
    const periodValidation = validatePeriodLengthEnhanced(profile.periodAvgLength);
    if (!periodValidation.isValid) {
      errors.periodAvgLength = periodValidation.errors;
    } else {
      sanitizedData.periodAvgLength = profile.periodAvgLength;
    }
  }
  
  if (profile.birthDate) {
    const dateValidation = validateDateEnhanced(profile.birthDate);
    if (!dateValidation.isValid) {
      errors.birthDate = dateValidation.errors;
    } else {
      sanitizedData.birthDate = profile.birthDate;
    }
  }
  
  if (profile.height !== undefined) {
    if (profile.height < 50 || profile.height > 300) {
      errors.height = ['Height must be between 50 and 300 cm'];
    } else {
      sanitizedData.height = profile.height;
    }
  }
  
  if (profile.weight !== undefined) {
    if (profile.weight < 20 || profile.weight > 500) {
      errors.weight = ['Weight must be between 20 and 500 kg'];
    } else {
      sanitizedData.weight = profile.weight;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
};

// Rate limiting for API calls
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static isAllowed(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
  
  static reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};