import { Symptom } from '@/types/period';

const symptoms: Symptom[] = [
  // Physical symptoms
  { id: 'cramps', name: 'Cramps', icon: 'activity', category: 'physical' },
  { id: 'headache', name: 'Headache', icon: 'brain', category: 'physical' },
  { id: 'backache', name: 'Backache', icon: 'activity', category: 'physical' },
  { id: 'nausea', name: 'Nausea', icon: 'thermometer', category: 'physical' },
  { id: 'fatigue', name: 'Fatigue', icon: 'battery-low', category: 'physical' },
  { id: 'bloating', name: 'Bloating', icon: 'droplet', category: 'physical' },
  { id: 'breast_tenderness', name: 'Breast Tenderness', icon: 'heart', category: 'physical' },
  { id: 'acne', name: 'Acne', icon: 'circle-dot', category: 'physical' },
  { id: 'spotting', name: 'Spotting', icon: 'droplet', category: 'physical' },
  { id: 'insomnia', name: 'Insomnia', icon: 'moon', category: 'physical' },
  
  // Emotional symptoms
  { id: 'mood_swings', name: 'Mood Swings', icon: 'refresh-ccw', category: 'emotional' },
  { id: 'anxiety', name: 'Anxiety', icon: 'alert-circle', category: 'emotional' },
  { id: 'irritability', name: 'Irritability', icon: 'zap', category: 'emotional' },
  { id: 'depression', name: 'Depression', icon: 'cloud-rain', category: 'emotional' },
  { id: 'low_energy', name: 'Low Energy', icon: 'battery-low', category: 'emotional' },
  
  // Other symptoms
  { id: 'cravings', name: 'Cravings', icon: 'cookie', category: 'other' },
  { id: 'appetite_changes', name: 'Appetite Changes', icon: 'utensils', category: 'other' },
  { id: 'constipation', name: 'Constipation', icon: 'clock', category: 'other' },
  { id: 'diarrhea', name: 'Diarrhea', icon: 'clock', category: 'other' },
  { id: 'dizziness', name: 'Dizziness', icon: 'refresh-ccw', category: 'other' },
];

export default symptoms;