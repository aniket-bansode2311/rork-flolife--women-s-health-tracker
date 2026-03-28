import { PeriodLog, CycleData, UserProfile } from '@/types/period';

// Medical-grade prediction interfaces
export interface ClinicalPrediction {
  cycleRegularity: 'regular' | 'irregular' | 'highly_irregular';
  ovulationPrediction: {
    date: string;
    confidence: number;
    lutealPhaseLength: number;
  };
  fertilityScore: number; // 0-100
  riskAssessment: {
    pcos: number; // 0-1 probability
    endometriosis: number;
    thyroidIssues: number;
    ovulationDisorders: number;
  };
  recommendations: string[];
  clinicalFlags: string[];
}

export interface SymptomPattern {
  symptom: string;
  frequency: number; // 0-1
  cyclePhaseCorrelation: {
    period: number;
    follicular: number;
    ovulation: number;
    luteal: number;
  };
  severity: 'mild' | 'moderate' | 'severe';
  trend: 'improving' | 'stable' | 'worsening';
}

// Advanced cycle analysis using clinical algorithms
export const analyzeCycleRegularity = (cycles: CycleData[]): {
  regularity: 'regular' | 'irregular' | 'highly_irregular';
  variability: number;
  clinicalNotes: string[];
} => {
  if (cycles.length < 3) {
    return {
      regularity: 'irregular',
      variability: 0,
      clinicalNotes: ['Insufficient data for clinical assessment']
    };
  }

  const lengths = cycles.map(c => c.length);
  const mean = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
  const standardDeviation = Math.sqrt(variance);
  
  const clinicalNotes: string[] = [];
  let regularity: 'regular' | 'irregular' | 'highly_irregular';

  // Clinical criteria for cycle regularity
  if (standardDeviation <= 2) {
    regularity = 'regular';
    clinicalNotes.push('Cycles within normal variation (±2 days)');
  } else if (standardDeviation <= 7) {
    regularity = 'irregular';
    clinicalNotes.push('Moderate cycle variation detected');
    
    // Check for specific patterns
    if (mean < 21) {
      clinicalNotes.push('Short cycles detected - consider thyroid evaluation');
    } else if (mean > 35) {
      clinicalNotes.push('Long cycles detected - consider PCOS screening');
    }
  } else {
    regularity = 'highly_irregular';
    clinicalNotes.push('Significant cycle irregularity - recommend medical consultation');
    
    // Check for concerning patterns
    const hasVeryShortCycles = lengths.some(len => len < 21);
    const hasVeryLongCycles = lengths.some(len => len > 35);
    
    if (hasVeryShortCycles && hasVeryLongCycles) {
      clinicalNotes.push('Mixed cycle patterns - possible hormonal imbalance');
    }
  }

  return {
    regularity,
    variability: standardDeviation,
    clinicalNotes
  };
};

// PCOS risk assessment based on cycle patterns and symptoms
export const assessPCOSRisk = (
  cycles: CycleData[],
  logs: PeriodLog[],
  profile: UserProfile
): number => {
  let riskScore = 0;
  const factors: string[] = [];

  // Cycle irregularity (major criterion)
  if (cycles.length >= 3) {
    const regularity = analyzeCycleRegularity(cycles);
    if (regularity.regularity === 'irregular') {
      riskScore += 0.3;
      factors.push('Irregular cycles');
    } else if (regularity.regularity === 'highly_irregular') {
      riskScore += 0.5;
      factors.push('Highly irregular cycles');
    }

    // Long cycles (>35 days)
    const longCycles = cycles.filter(c => c.length > 35).length;
    if (longCycles / cycles.length > 0.5) {
      riskScore += 0.2;
      factors.push('Frequent long cycles');
    }
  }

  // Symptom analysis
  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return logDate >= threeMonthsAgo;
  });

  // Acne symptoms
  const acneLogs = recentLogs.filter(log => 
    log.symptoms.some(s => s.toLowerCase().includes('acne'))
  );
  if (acneLogs.length / recentLogs.length > 0.3) {
    riskScore += 0.15;
    factors.push('Frequent acne symptoms');
  }

  // Weight-related symptoms
  const weightLogs = recentLogs.filter(log => 
    log.symptoms.some(s => 
      s.toLowerCase().includes('weight') || 
      s.toLowerCase().includes('bloating')
    )
  );
  if (weightLogs.length / recentLogs.length > 0.4) {
    riskScore += 0.1;
    factors.push('Weight-related symptoms');
  }

  // Hair-related symptoms
  const hairLogs = recentLogs.filter(log => 
    log.symptoms.some(s => 
      s.toLowerCase().includes('hair') || 
      s.toLowerCase().includes('hirsutism')
    )
  );
  if (hairLogs.length / recentLogs.length > 0.2) {
    riskScore += 0.15;
    factors.push('Hair-related symptoms');
  }

  return Math.min(1, riskScore);
};

// Endometriosis risk assessment
export const assessEndometriosisRisk = (
  logs: PeriodLog[],
  cycles: CycleData[]
): number => {
  let riskScore = 0;

  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return logDate >= sixMonthsAgo;
  });

  // Severe pain symptoms
  const severePainLogs = recentLogs.filter(log => 
    log.symptoms.some(s => 
      s.toLowerCase().includes('severe') && s.toLowerCase().includes('pain')
    ) || log.symptoms.some(s => 
      s.toLowerCase().includes('cramp') && s.toLowerCase().includes('severe')
    )
  );

  if (severePainLogs.length / recentLogs.length > 0.3) {
    riskScore += 0.4;
  }

  // Heavy bleeding
  const heavyFlowLogs = recentLogs.filter(log => log.flow === 'heavy');
  if (heavyFlowLogs.length / recentLogs.length > 0.4) {
    riskScore += 0.2;
  }

  // Digestive symptoms during period
  const digestiveLogs = recentLogs.filter(log => 
    log.symptoms.some(s => 
      s.toLowerCase().includes('nausea') || 
      s.toLowerCase().includes('diarrhea') ||
      s.toLowerCase().includes('constipation')
    )
  );

  if (digestiveLogs.length / recentLogs.length > 0.25) {
    riskScore += 0.2;
  }

  // Fatigue during period
  const fatigueLogs = recentLogs.filter(log => 
    log.symptoms.some(s => s.toLowerCase().includes('fatigue'))
  );

  if (fatigueLogs.length / recentLogs.length > 0.4) {
    riskScore += 0.15;
  }

  return Math.min(1, riskScore);
};

// Thyroid dysfunction risk assessment
export const assessThyroidRisk = (
  cycles: CycleData[],
  logs: PeriodLog[]
): number => {
  let riskScore = 0;

  if (cycles.length >= 3) {
    const lengths = cycles.map(c => c.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

    // Very short cycles (hyperthyroidism indicator)
    if (avgLength < 21) {
      riskScore += 0.3;
    }

    // Very long cycles (hypothyroidism indicator)
    if (avgLength > 35) {
      riskScore += 0.25;
    }

    // High variability
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    if (Math.sqrt(variance) > 10) {
      riskScore += 0.2;
    }
  }

  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return logDate >= threeMonthsAgo;
  });

  // Fatigue symptoms
  const fatigueLogs = recentLogs.filter(log => 
    log.symptoms.some(s => s.toLowerCase().includes('fatigue'))
  );
  if (fatigueLogs.length / recentLogs.length > 0.5) {
    riskScore += 0.15;
  }

  // Mood symptoms
  const moodLogs = recentLogs.filter(log => 
    log.mood === 'sad' || log.mood === 'anxious'
  );
  if (moodLogs.length / recentLogs.length > 0.4) {
    riskScore += 0.1;
  }

  return Math.min(1, riskScore);
};

// Advanced ovulation prediction using luteal phase analysis
export const predictOvulationAdvanced = (
  cycles: CycleData[],
  logs: PeriodLog[],
  lastPeriodStart: string
): {
  ovulationDate: string;
  confidence: number;
  lutealPhaseLength: number;
  method: string;
} => {
  const defaultResult = {
    ovulationDate: new Date(new Date(lastPeriodStart).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    confidence: 0.5,
    lutealPhaseLength: 14,
    method: 'Standard 14-day rule'
  };

  if (cycles.length < 2) {
    return defaultResult;
  }

  // Analyze luteal phase patterns from historical data
  const lutealPhaseLengths: number[] = [];
  
  cycles.forEach(cycle => {
    // Find period logs for this cycle
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate);
    
    const cycleLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= cycleStart && logDate < cycleEnd;
    });

    // Find last day of period in this cycle
    const periodLogs = cycleLogs.filter(log => log.flow !== 'none');
    if (periodLogs.length > 0) {
      const lastPeriodDay = new Date(Math.max(...periodLogs.map(log => new Date(log.date).getTime())));
      const lutealLength = Math.floor((cycleEnd.getTime() - lastPeriodDay.getTime()) / (1000 * 60 * 60 * 24));
      
      if (lutealLength >= 10 && lutealLength <= 16) { // Normal luteal phase range
        lutealPhaseLengths.push(lutealLength);
      }
    }
  });

  if (lutealPhaseLengths.length === 0) {
    return defaultResult;
  }

  // Calculate average luteal phase length
  const avgLutealLength = Math.round(
    lutealPhaseLengths.reduce((sum, len) => sum + len, 0) / lutealPhaseLengths.length
  );

  // Calculate confidence based on consistency
  const variance = lutealPhaseLengths.reduce((sum, len) => sum + Math.pow(len - avgLutealLength, 2), 0) / lutealPhaseLengths.length;
  const standardDeviation = Math.sqrt(variance);
  const confidence = Math.max(0.3, Math.min(0.95, 1 - (standardDeviation / 5)));

  // Predict next cycle length based on recent cycles
  const recentCycles = cycles.slice(-3);
  const avgCycleLength = Math.round(
    recentCycles.reduce((sum, cycle) => sum + cycle.length, 0) / recentCycles.length
  );

  // Calculate ovulation date
  const nextPeriodDate = new Date(new Date(lastPeriodStart).getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
  const ovulationDate = new Date(nextPeriodDate.getTime() - avgLutealLength * 24 * 60 * 60 * 1000);

  return {
    ovulationDate: ovulationDate.toISOString().split('T')[0],
    confidence,
    lutealPhaseLength: avgLutealLength,
    method: `Personalized luteal phase analysis (${lutealPhaseLengths.length} cycles)`
  };
};

// Generate comprehensive clinical prediction
export const generateClinicalPrediction = (
  logs: PeriodLog[],
  cycles: CycleData[],
  profile: UserProfile
): ClinicalPrediction => {
  const regularity = analyzeCycleRegularity(cycles);
  
  let ovulationPrediction = {
    date: '',
    confidence: 0.5,
    lutealPhaseLength: 14
  };

  if (profile.lastPeriodStart) {
    const ovulationResult = predictOvulationAdvanced(cycles, logs, profile.lastPeriodStart);
    ovulationPrediction = {
      date: ovulationResult.ovulationDate,
      confidence: ovulationResult.confidence,
      lutealPhaseLength: ovulationResult.lutealPhaseLength
    };
  }

  // Risk assessments
  const pcosRisk = assessPCOSRisk(cycles, logs, profile);
  const endometriosisRisk = assessEndometriosisRisk(logs, cycles);
  const thyroidRisk = assessThyroidRisk(cycles, logs);

  // Calculate overall fertility score
  let fertilityScore = 70; // Base score

  // Adjust based on cycle regularity
  if (regularity.regularity === 'regular') {
    fertilityScore += 20;
  } else if (regularity.regularity === 'irregular') {
    fertilityScore -= 10;
  } else {
    fertilityScore -= 25;
  }

  // Adjust based on risk factors
  fertilityScore -= pcosRisk * 30;
  fertilityScore -= endometriosisRisk * 20;
  fertilityScore -= thyroidRisk * 15;

  fertilityScore = Math.max(0, Math.min(100, fertilityScore));

  // Generate recommendations
  const recommendations: string[] = [];
  const clinicalFlags: string[] = [];

  if (regularity.regularity === 'highly_irregular') {
    recommendations.push('Consider consulting a gynecologist for cycle irregularity evaluation');
    clinicalFlags.push('Significant cycle irregularity detected');
  }

  if (pcosRisk > 0.6) {
    recommendations.push('PCOS screening recommended - discuss with healthcare provider');
    clinicalFlags.push('High PCOS risk indicators present');
  }

  if (endometriosisRisk > 0.5) {
    recommendations.push('Endometriosis evaluation may be beneficial due to symptom patterns');
    clinicalFlags.push('Endometriosis risk factors identified');
  }

  if (thyroidRisk > 0.4) {
    recommendations.push('Thyroid function testing recommended');
    clinicalFlags.push('Thyroid dysfunction indicators present');
  }

  if (ovulationPrediction.confidence < 0.4) {
    recommendations.push('Consider ovulation tracking methods for better fertility awareness');
  }

  if (fertilityScore < 50) {
    recommendations.push('Comprehensive fertility evaluation recommended');
    clinicalFlags.push('Multiple fertility risk factors identified');
  }

  // General health recommendations
  if (logs.length > 0) {
    const recentLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return logDate >= oneMonthAgo;
    });

    const stressLogs = recentLogs.filter(log => 
      log.symptoms.some(s => s.toLowerCase().includes('stress')) ||
      log.mood === 'anxious'
    );

    if (stressLogs.length / recentLogs.length > 0.3) {
      recommendations.push('Stress management techniques may help improve cycle regularity');
    }
  }

  return {
    cycleRegularity: regularity.regularity,
    ovulationPrediction,
    fertilityScore,
    riskAssessment: {
      pcos: pcosRisk,
      endometriosis: endometriosisRisk,
      thyroidIssues: thyroidRisk,
      ovulationDisorders: ovulationPrediction.confidence < 0.4 ? 0.6 : 0.2
    },
    recommendations,
    clinicalFlags
  };
};

// Analyze symptom patterns for clinical insights
export const analyzeSymptomPatterns = (logs: PeriodLog[]): SymptomPattern[] => {
  if (logs.length === 0) return [];

  const symptomMap = new Map<string, { occurrences: number; phases: string[] }>();

  logs.forEach(log => {
    // Determine cycle phase (simplified)
    const dayOfCycle = 1; // This would need proper cycle day calculation
    let phase = 'follicular';
    
    if (log.flow !== 'none') {
      phase = 'period';
    } else if (dayOfCycle >= 12 && dayOfCycle <= 16) {
      phase = 'ovulation';
    } else if (dayOfCycle > 16) {
      phase = 'luteal';
    }

    log.symptoms.forEach(symptom => {
      if (!symptomMap.has(symptom)) {
        symptomMap.set(symptom, { occurrences: 0, phases: [] });
      }
      const data = symptomMap.get(symptom)!;
      data.occurrences++;
      data.phases.push(phase);
    });
  });

  const patterns: SymptomPattern[] = [];

  symptomMap.forEach((data, symptom) => {
    const frequency = data.occurrences / logs.length;
    
    // Calculate phase correlations
    const phaseCount = { period: 0, follicular: 0, ovulation: 0, luteal: 0 };
    data.phases.forEach(phase => {
      phaseCount[phase as keyof typeof phaseCount]++;
    });

    const totalPhases = data.phases.length;
    const cyclePhaseCorrelation = {
      period: phaseCount.period / totalPhases,
      follicular: phaseCount.follicular / totalPhases,
      ovulation: phaseCount.ovulation / totalPhases,
      luteal: phaseCount.luteal / totalPhases
    };

    // Determine severity based on frequency and symptom type
    let severity: 'mild' | 'moderate' | 'severe' = 'mild';
    if (frequency > 0.5) {
      severity = 'moderate';
    }
    if (frequency > 0.7 && (
      symptom.toLowerCase().includes('severe') ||
      symptom.toLowerCase().includes('intense')
    )) {
      severity = 'severe';
    }

    patterns.push({
      symptom,
      frequency,
      cyclePhaseCorrelation,
      severity,
      trend: 'stable' // Would need historical comparison for trend analysis
    });
  });

  return patterns.sort((a, b) => b.frequency - a.frequency);
};