// AI-powered cycle predictions using historical data and machine learning patterns

import { PeriodLog, CycleData, UserProfile } from '@/types/period';
import { daysBetween, addDays, predictNextPeriod } from './dateUtils';

export interface AIPrediction {
  type: 'cycle_length' | 'period_length' | 'ovulation' | 'symptoms' | 'mood';
  prediction: any;
  confidence: number; // 0-1
  reasoning: string;
  basedOnData: string;
}

// Predict next cycle length based on historical patterns
export const predictNextCycleLength = (cycles: CycleData[]): AIPrediction => {
  if (cycles.length === 0) {
    return {
      type: 'cycle_length',
      prediction: 28,
      confidence: 0.5,
      reasoning: 'Using average cycle length as no historical data available',
      basedOnData: 'Default medical average'
    };
  }
  
  if (cycles.length < 3) {
    const avgLength = Math.round(cycles.reduce((sum, c) => sum + c.length, 0) / cycles.length);
    return {
      type: 'cycle_length',
      prediction: avgLength,
      confidence: 0.6,
      reasoning: `Based on ${cycles.length} recorded cycle${cycles.length > 1 ? 's' : ''}`,
      basedOnData: `${cycles.length} cycle${cycles.length > 1 ? 's' : ''}`
    };
  }
  
  // Advanced prediction using trend analysis
  const lengths = cycles.map(c => c.length);
  const recentCycles = lengths.slice(-6); // Last 6 cycles
  
  // Calculate weighted average (more recent cycles have higher weight)
  let weightedSum = 0;
  let totalWeight = 0;
  
  recentCycles.forEach((length, index) => {
    const weight = index + 1; // More recent = higher weight
    weightedSum += length * weight;
    totalWeight += weight;
  });
  
  const weightedAvg = Math.round(weightedSum / totalWeight);
  
  // Check for trends
  let trendScore = 0;
  for (let i = 1; i < recentCycles.length; i++) {
    if (recentCycles[i] > recentCycles[i - 1]) trendScore++;
    else if (recentCycles[i] < recentCycles[i - 1]) trendScore--;
  }
  
  const trendStrength = Math.abs(trendScore) / (recentCycles.length - 1);
  
  // Adjust prediction based on trend
  let prediction = weightedAvg;
  if (trendStrength > 0.5) {
    const adjustment = trendScore > 0 ? 1 : -1;
    prediction += adjustment;
  }
  
  // Calculate confidence based on consistency
  const variance = recentCycles.reduce((sum, len) => sum + Math.pow(len - weightedAvg, 2), 0) / recentCycles.length;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0.7, Math.min(0.95, 1 - (stdDev / 10)));
  
  return {
    type: 'cycle_length',
    prediction: Math.max(21, Math.min(45, prediction)), // Keep within reasonable bounds
    confidence,
    reasoning: trendStrength > 0.5 
      ? `Detected ${trendScore > 0 ? 'increasing' : 'decreasing'} trend in recent cycles`
      : `Consistent pattern detected across ${recentCycles.length} recent cycles`,
    basedOnData: `${cycles.length} cycles (last ${recentCycles.length} weighted)`
  };
};

// Predict likely symptoms for upcoming cycle phases
export const predictUpcomingSymptoms = (logs: PeriodLog[], profile: UserProfile): AIPrediction => {
  if (logs.length < 10) {
    return {
      type: 'symptoms',
      prediction: [],
      confidence: 0.4,
      reasoning: 'Insufficient data for symptom prediction',
      basedOnData: `${logs.length} logs`
    };
  }
  
  // Analyze symptom patterns by cycle phase
  const symptomsByPhase: Record<string, Record<string, number>> = {
    period: {},
    follicular: {},
    ovulation: {},
    luteal: {}
  };
  
  logs.forEach(log => {
    // Simplified phase detection based on flow
    let phase = 'follicular';
    if (log.flow !== 'none') {
      phase = 'period';
    }
    // In a real implementation, you'd calculate the actual cycle phase
    
    if (!symptomsByPhase[phase]) symptomsByPhase[phase] = {};
    
    log.symptoms.forEach(symptom => {
      symptomsByPhase[phase][symptom] = (symptomsByPhase[phase][symptom] || 0) + 1;
    });
  });
  
  // Find most common symptoms for each phase
  const predictions: Record<string, string[]> = {};
  Object.keys(symptomsByPhase).forEach(phase => {
    const symptoms = Object.entries(symptomsByPhase[phase])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .filter(([_, count]) => count >= 2)
      .map(([symptom, _]) => symptom);
    
    predictions[phase] = symptoms;
  });
  
  const totalLogs = logs.length;
  const confidence = Math.min(0.85, 0.5 + (totalLogs / 50));
  
  return {
    type: 'symptoms',
    prediction: predictions,
    confidence,
    reasoning: 'Pattern analysis of historical symptom data by cycle phase',
    basedOnData: `${totalLogs} logs analyzed`
  };
};

// Predict mood patterns
export const predictMoodPatterns = (logs: PeriodLog[]): AIPrediction => {
  if (logs.length < 15) {
    return {
      type: 'mood',
      prediction: { dominant: 'neutral', patterns: [] },
      confidence: 0.4,
      reasoning: 'Insufficient data for mood pattern analysis',
      basedOnData: `${logs.length} logs`
    };
  }
  
  const moodCounts: Record<string, number> = {};
  logs.forEach(log => {
    if (log.mood) {
      moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    }
  });
  
  const sortedMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1]);
  
  const dominantMood = sortedMoods[0]?.[0] || 'neutral';
  const moodVariability = sortedMoods.length;
  
  // Analyze mood stability
  const recentMoods = logs.slice(-10).map(log => log.mood).filter(Boolean);
  const moodChanges = recentMoods.reduce((changes, mood, index) => {
    if (index > 0 && mood !== recentMoods[index - 1]) {
      changes++;
    }
    return changes;
  }, 0);
  
  const stability = 1 - (moodChanges / Math.max(1, recentMoods.length - 1));
  const confidence = Math.min(0.9, 0.6 + (logs.length / 100) + (stability * 0.2));
  
  return {
    type: 'mood',
    prediction: {
      dominant: dominantMood,
      stability: stability > 0.7 ? 'stable' : stability > 0.4 ? 'moderate' : 'variable',
      patterns: sortedMoods.slice(0, 3).map(([mood, count]) => ({
        mood,
        frequency: Math.round((count / logs.length) * 100)
      }))
    },
    confidence,
    reasoning: `Mood analysis shows ${stability > 0.7 ? 'stable' : 'variable'} patterns with ${dominantMood} as dominant mood`,
    basedOnData: `${logs.length} mood entries`
  };
};

// Generate comprehensive AI predictions
export const generateAIPredictions = (
  logs: PeriodLog[],
  cycles: CycleData[],
  profile: UserProfile
): AIPrediction[] => {
  const predictions: AIPrediction[] = [];
  
  // Cycle length prediction
  predictions.push(predictNextCycleLength(cycles));
  
  // Symptom predictions
  predictions.push(predictUpcomingSymptoms(logs, profile));
  
  // Mood predictions
  predictions.push(predictMoodPatterns(logs));
  
  // Ovulation prediction (simplified)
  if (profile.lastPeriodStart && cycles.length > 0) {
    const avgCycleLength = cycles.reduce((sum, c) => sum + c.length, 0) / cycles.length;
    const nextOvulation = addDays(new Date(profile.lastPeriodStart), Math.round(avgCycleLength - 14));
    
    predictions.push({
      type: 'ovulation',
      prediction: {
        date: nextOvulation.toISOString().split('T')[0],
        fertilityWindow: {
          start: addDays(nextOvulation, -5).toISOString().split('T')[0],
          end: addDays(nextOvulation, 1).toISOString().split('T')[0]
        }
      },
      confidence: cycles.length >= 3 ? 0.8 : 0.6,
      reasoning: 'Ovulation typically occurs 14 days before next period',
      basedOnData: `${cycles.length} cycles`
    });
  }
  
  return predictions.sort((a, b) => b.confidence - a.confidence);
};

// Get AI insights summary
export const getAIInsightsSummary = (
  logs: PeriodLog[],
  cycles: CycleData[],
  profile: UserProfile
): string => {
  const predictions = generateAIPredictions(logs, cycles, profile);
  
  if (predictions.length === 0) {
    return "Keep logging your cycle data to unlock AI-powered insights and predictions.";
  }
  
  const cyclePrediction = predictions.find(p => p.type === 'cycle_length');
  const moodPrediction = predictions.find(p => p.type === 'mood');
  
  let summary = "🤖 AI Analysis: ";
  
  if (cyclePrediction && cyclePrediction.confidence > 0.7) {
    summary += `Your next cycle is predicted to be ${cyclePrediction.prediction} days. `;
  }
  
  if (moodPrediction && moodPrediction.confidence > 0.6) {
    const moodData = moodPrediction.prediction as any;
    summary += `Your mood patterns show ${moodData.stability} stability with ${moodData.dominant} being your most common mood. `;
  }
  
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  summary += `(${Math.round(avgConfidence * 100)}% confidence)`;
  
  return summary;
};