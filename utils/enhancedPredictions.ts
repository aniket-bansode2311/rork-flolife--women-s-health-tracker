import { PeriodLog, CycleData } from '@/types/period';
import { CYCLE_CONSTANTS } from '@/constants/app';
import { daysBetween, addDays } from './dateUtils';

// Enhanced prediction algorithms with machine learning-inspired approaches
export interface PredictionResult {
  nextPeriodDate: string;
  confidence: number; // 0-1
  fertileWindow: {
    start: string;
    end: string;
    ovulationDate: string;
  };
  cyclePhase: 'period' | 'follicular' | 'ovulation' | 'luteal';
  irregularityScore: number; // 0-1, higher means more irregular
  cycleDay: number; // Current day in cycle (1-based)
}

export interface CyclePrediction {
  predictedLength: number;
  confidence: number;
  factors: string[];
}

// Advanced cycle length prediction using weighted moving average
export const predictCycleLength = (cycles: CycleData[]): CyclePrediction => {
  if (cycles.length === 0) {
    return {
      predictedLength: CYCLE_CONSTANTS.DEFAULT_CYCLE_LENGTH,
      confidence: 0.3,
      factors: ['Using default cycle length (no historical data)']
    };
  }

  if (cycles.length === 1) {
    return {
      predictedLength: cycles[0].length,
      confidence: 0.5,
      factors: ['Based on single cycle']
    };
  }

  // Sort cycles by date (most recent first)
  const sortedCycles = [...cycles].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const factors: string[] = [];
  
  // Calculate weighted moving average (more weight to recent cycles)
  let weightedSum = 0;
  let totalWeight = 0;
  
  sortedCycles.forEach((cycle, index) => {
    // Weight decreases exponentially for older cycles
    const weight = Math.pow(0.8, index);
    weightedSum += cycle.length * weight;
    totalWeight += weight;
  });
  
  let weightedAverage = weightedSum / totalWeight;
  
  // Calculate variance to determine confidence
  const variance = sortedCycles.reduce((sum, cycle) => {
    return sum + Math.pow(cycle.length - weightedAverage, 2);
  }, 0) / sortedCycles.length;
  
  const standardDeviation = Math.sqrt(variance);
  
  // Confidence decreases with higher variance
  let confidence = Math.max(0.4, 1 - (standardDeviation / 10));
  
  // Adjust confidence based on number of cycles
  if (sortedCycles.length >= 6) {
    confidence = Math.min(confidence + 0.2, 0.95);
    factors.push(`High confidence (${sortedCycles.length} cycles)`);
  } else if (sortedCycles.length >= 3) {
    confidence = Math.min(confidence + 0.1, 0.85);
    factors.push(`Medium confidence (${sortedCycles.length} cycles)`);
  } else {
    factors.push(`Lower confidence (only ${sortedCycles.length} cycles)`);
  }
  
  // Check for trending patterns
  if (sortedCycles.length >= 3) {
    const recentTrend = analyzeRecentTrend(sortedCycles.slice(0, 3));
    if (recentTrend.isSignificant) {
      factors.push(`Recent trend: ${recentTrend.direction}`);
      // Adjust prediction based on trend
      if (recentTrend.direction === 'increasing') {
        weightedAverage += recentTrend.strength;
      } else if (recentTrend.direction === 'decreasing') {
        weightedAverage -= recentTrend.strength;
      }
    }
  }
  
  // Seasonal adjustments (if we have enough data)
  if (sortedCycles.length >= 12) {
    const seasonalAdjustment = calculateSeasonalAdjustment(sortedCycles);
    if (seasonalAdjustment !== 0) {
      factors.push(`Seasonal adjustment: ${seasonalAdjustment > 0 ? '+' : ''}${seasonalAdjustment.toFixed(1)} days`);
      weightedAverage += seasonalAdjustment;
    }
  }
  
  // Ensure the prediction is within reasonable bounds
  const predictedLength = Math.round(Math.max(
    CYCLE_CONSTANTS.MIN_CYCLE_LENGTH,
    Math.min(CYCLE_CONSTANTS.MAX_CYCLE_LENGTH, weightedAverage)
  ));
  
  return {
    predictedLength,
    confidence,
    factors
  };
};

// Analyze recent trend in cycle lengths
const analyzeRecentTrend = (recentCycles: CycleData[]): {
  isSignificant: boolean;
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
} => {
  if (recentCycles.length < 3) {
    return { isSignificant: false, direction: 'stable', strength: 0 };
  }
  
  const lengths = recentCycles.map(c => c.length);
  let trendScore = 0;
  
  // Calculate trend score
  for (let i = 1; i < lengths.length; i++) {
    if (lengths[i] > lengths[i - 1]) {
      trendScore += 1;
    } else if (lengths[i] < lengths[i - 1]) {
      trendScore -= 1;
    }
  }
  
  const trendStrength = Math.abs(trendScore) / (lengths.length - 1);
  const isSignificant = trendStrength >= 0.6; // 60% of comparisons show same direction
  
  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (trendScore > 0) direction = 'increasing';
  else if (trendScore < 0) direction = 'decreasing';
  
  return {
    isSignificant,
    direction,
    strength: trendStrength * 2 // Convert to days adjustment
  };
};

// Calculate seasonal adjustments based on historical data
const calculateSeasonalAdjustment = (cycles: CycleData[]): number => {
  const currentMonth = new Date().getMonth();
  const monthlyAverages: Record<number, number[]> = {};
  
  // Group cycles by month
  cycles.forEach(cycle => {
    const month = new Date(cycle.startDate).getMonth();
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = [];
    }
    monthlyAverages[month].push(cycle.length);
  });
  
  // Calculate average for current month vs overall average
  if (monthlyAverages[currentMonth] && monthlyAverages[currentMonth].length >= 2) {
    const currentMonthAvg = monthlyAverages[currentMonth].reduce((sum, len) => sum + len, 0) / monthlyAverages[currentMonth].length;
    const overallAvg = cycles.reduce((sum, cycle) => sum + cycle.length, 0) / cycles.length;
    
    return currentMonthAvg - overallAvg;
  }
  
  return 0;
};

// Enhanced fertility window calculation
export const calculateEnhancedFertilityWindow = (
  lastPeriodStart: string,
  predictedCycleLength: number,
  confidence: number
): {
  start: string;
  end: string;
  ovulationDate: string;
  confidence: number;
} => {
  const lastPeriod = new Date(lastPeriodStart);
  
  // Calculate ovulation date (typically 14 days before next period)
  const nextPeriodDate = addDays(lastPeriod, predictedCycleLength);
  const ovulationDate = addDays(nextPeriodDate, -14);
  
  // Fertile window: 5 days before ovulation + ovulation day + 1 day after
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);
  
  // Adjust confidence based on cycle regularity
  const fertilityConfidence = Math.max(0.3, confidence * 0.9);
  
  return {
    start: fertileStart.toISOString().split('T')[0],
    end: fertileEnd.toISOString().split('T')[0],
    ovulationDate: ovulationDate.toISOString().split('T')[0],
    confidence: fertilityConfidence
  };
};

// Calculate current cycle phase with enhanced accuracy
export const calculateCyclePhase = (
  lastPeriodStart: string,
  predictedCycleLength: number,
  avgPeriodLength: number
): 'period' | 'follicular' | 'ovulation' | 'luteal' => {
  const today = new Date();
  const lastPeriod = new Date(lastPeriodStart);
  const daysSinceLastPeriod = daysBetween(lastPeriod, today);
  
  // Handle negative days (shouldn't happen, but be safe)
  if (daysSinceLastPeriod < 0) {
    return 'luteal';
  }
  
  // If we're past the expected cycle length, we might be in the next cycle
  if (daysSinceLastPeriod >= predictedCycleLength) {
    // Calculate how many cycles we might be ahead
    const cyclesPassed = Math.floor(daysSinceLastPeriod / predictedCycleLength);
    const adjustedDaysSince = daysSinceLastPeriod - (cyclesPassed * predictedCycleLength);
    
    // Check if we're in the period phase of a new cycle
    if (adjustedDaysSince < avgPeriodLength) {
      return 'period';
    }
    
    // Calculate phase based on adjusted days
    const ovulationDay = predictedCycleLength - 14; // Ovulation typically 14 days before next period
    
    if (adjustedDaysSince < ovulationDay - 3) {
      return 'follicular';
    }
    
    if (adjustedDaysSince >= ovulationDay - 3 && adjustedDaysSince <= ovulationDay + 1) {
      return 'ovulation';
    }
    
    return 'luteal';
  }
  
  // Period phase (days 1-avgPeriodLength)
  if (daysSinceLastPeriod < avgPeriodLength) {
    return 'period';
  }
  
  // Calculate ovulation day (14 days before next period)
  const ovulationDay = predictedCycleLength - 14;
  
  // Follicular phase (after period, before ovulation window)
  if (daysSinceLastPeriod < ovulationDay - 3) {
    return 'follicular';
  }
  
  // Ovulation phase (3 days before to 1 day after ovulation)
  if (daysSinceLastPeriod >= ovulationDay - 3 && daysSinceLastPeriod <= ovulationDay + 1) {
    return 'ovulation';
  }
  
  // Luteal phase (after ovulation, before next period)
  return 'luteal';
};

// Calculate current cycle day
export const calculateCycleDay = (
  lastPeriodStart: string,
  predictedCycleLength: number
): number => {
  const today = new Date();
  const lastPeriod = new Date(lastPeriodStart);
  const daysSinceLastPeriod = daysBetween(lastPeriod, today);
  
  if (daysSinceLastPeriod < 0) {
    return 1; // Default to day 1 if calculation is invalid
  }
  
  // If we're past the expected cycle length, calculate the current cycle day
  if (daysSinceLastPeriod >= predictedCycleLength) {
    const cyclesPassed = Math.floor(daysSinceLastPeriod / predictedCycleLength);
    const adjustedDaysSince = daysSinceLastPeriod - (cyclesPassed * predictedCycleLength);
    return adjustedDaysSince + 1; // +1 because cycle days are 1-based
  }
  
  return daysSinceLastPeriod + 1; // +1 because cycle days are 1-based
};

// Calculate irregularity score based on cycle variation
export const calculateIrregularityScore = (cycles: CycleData[]): number => {
  if (cycles.length < 2) return 0;
  
  const lengths = cycles.map(c => c.length);
  const average = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - average, 2), 0) / lengths.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Normalize to 0-1 scale (higher = more irregular)
  const coefficientOfVariation = standardDeviation / average;
  return Math.min(1, coefficientOfVariation * 5); // Scale factor of 5
};

// Main enhanced prediction function
export const generateEnhancedPrediction = (
  logs: PeriodLog[],
  cycles: CycleData[],
  profile: { lastPeriodStart: string | null; periodAvgLength: number }
): PredictionResult | null => {
  if (!profile.lastPeriodStart) {
    return null;
  }
  
  // Get cycle length prediction
  const cyclePrediction = predictCycleLength(cycles);
  
  // Calculate next period date
  const lastPeriod = new Date(profile.lastPeriodStart);
  const nextPeriodDate = addDays(lastPeriod, cyclePrediction.predictedLength);
  
  // Calculate fertility window
  const fertilityWindow = calculateEnhancedFertilityWindow(
    profile.lastPeriodStart,
    cyclePrediction.predictedLength,
    cyclePrediction.confidence
  );
  
  // Calculate current cycle phase
  const cyclePhase = calculateCyclePhase(
    profile.lastPeriodStart,
    cyclePrediction.predictedLength,
    profile.periodAvgLength
  );
  
  // Calculate current cycle day
  const cycleDay = calculateCycleDay(
    profile.lastPeriodStart,
    cyclePrediction.predictedLength
  );
  
  // Calculate irregularity score
  const irregularityScore = calculateIrregularityScore(cycles);
  
  return {
    nextPeriodDate: nextPeriodDate.toISOString().split('T')[0],
    confidence: cyclePrediction.confidence,
    fertileWindow: {
      start: fertilityWindow.start,
      end: fertilityWindow.end,
      ovulationDate: fertilityWindow.ovulationDate
    },
    cyclePhase,
    irregularityScore,
    cycleDay
  };
};

// Predict multiple future cycles
export const predictFutureCycles = (
  cycles: CycleData[],
  profile: { lastPeriodStart: string | null; periodAvgLength: number },
  monthsAhead: number = 6
): Array<{
  startDate: string;
  endDate: string;
  confidence: number;
  fertileWindow: { start: string; end: string; ovulationDate: string };
}> => {
  if (!profile.lastPeriodStart) return [];
  
  const predictions: Array<{
    startDate: string;
    endDate: string;
    confidence: number;
    fertileWindow: { start: string; end: string; ovulationDate: string };
  }> = [];
  
  const cyclePrediction = predictCycleLength(cycles);
  let currentPeriodStart = new Date(profile.lastPeriodStart);
  
  for (let i = 0; i < monthsAhead; i++) {
    // Move to next cycle
    currentPeriodStart = addDays(currentPeriodStart, cyclePrediction.predictedLength);
    
    const periodEnd = addDays(currentPeriodStart, profile.periodAvgLength - 1);
    
    // Calculate fertility window for this cycle
    const fertilityWindow = calculateEnhancedFertilityWindow(
      currentPeriodStart.toISOString().split('T')[0],
      cyclePrediction.predictedLength,
      cyclePrediction.confidence
    );
    
    // Confidence decreases for future predictions
    const futureConfidence = cyclePrediction.confidence * Math.pow(0.9, i + 1);
    
    predictions.push({
      startDate: currentPeriodStart.toISOString().split('T')[0],
      endDate: periodEnd.toISOString().split('T')[0],
      confidence: futureConfidence,
      fertileWindow: {
        start: fertilityWindow.start,
        end: fertilityWindow.end,
        ovulationDate: fertilityWindow.ovulationDate
      }
    });
  }
  
  return predictions;
};