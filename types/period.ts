export type FlowIntensity = 'none' | 'light' | 'medium' | 'heavy';

export type Symptom = {
  id: string;
  name: string;
  icon: string;
  category: 'physical' | 'emotional' | 'other';
};

export type Mood = {
  id: string;
  name: string;
  icon: string;
};

export type PeriodLog = {
  date: string; // ISO date string
  flow: FlowIntensity;
  symptoms: string[]; // Array of symptom ids
  mood: string; // Mood id
  notes?: string;
};

export type CycleData = {
  startDate: string;
  endDate: string;
  length: number;
  periodLength: number;
};

export type UserProfile = {
  cycleAvgLength: number;
  periodAvgLength: number;
  lastPeriodStart: string | null;
  birthDate?: string;
  height?: number;
  weight?: number;
};