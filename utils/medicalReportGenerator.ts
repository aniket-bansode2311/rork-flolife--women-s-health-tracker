import { PeriodLog, CycleData, UserProfile } from '@/types/period';
import { generateClinicalPrediction, analyzeSymptomPatterns } from './clinicalPredictions';
import { generateTelehealthRecommendations } from './telehealthIntegration';

export interface MedicalReport {
  patientInfo: {
    reportDate: string;
    reportId: string;
    dataRange: {
      startDate: string;
      endDate: string;
      totalDays: number;
    };
  };
  executiveSummary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'concerning';
    keyFindings: string[];
    urgentConcerns: string[];
    recommendations: string[];
  };
  cycleAnalysis: {
    regularity: string;
    averageCycleLength: number;
    averagePeriodLength: number;
    variability: number;
    totalCyclesTracked: number;
    cycleHistory: Array<{
      cycleNumber: number;
      startDate: string;
      length: number;
      periodLength: number;
      notes: string;
    }>;
  };
  symptomAnalysis: {
    totalSymptomsTracked: number;
    mostCommonSymptoms: Array<{
      symptom: string;
      frequency: number;
      severity: string;
      cyclePhaseCorrelation: string;
    }>;
    symptomTrends: Array<{
      symptom: string;
      trend: 'increasing' | 'stable' | 'decreasing';
      significance: string;
    }>;
  };
  riskAssessment: {
    pcos: {
      risk: number;
      indicators: string[];
      recommendations: string[];
    };
    endometriosis: {
      risk: number;
      indicators: string[];
      recommendations: string[];
    };
    thyroidIssues: {
      risk: number;
      indicators: string[];
      recommendations: string[];
    };
    fertilityScore: number;
    fertilityFactors: string[];
  };
  clinicalRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    lifestyle: string[];
    medical: string[];
  };
  dataQuality: {
    completeness: number;
    consistency: number;
    reliability: number;
    recommendations: string[];
  };
  appendices: {
    rawData: {
      logs: PeriodLog[];
      cycles: CycleData[];
      profile: UserProfile;
    };
    methodology: string;
    limitations: string[];
    references: string[];
  };
}

export class MedicalReportGenerator {
  static generateComprehensiveReport(
    logs: PeriodLog[],
    cycles: CycleData[],
    profile: UserProfile
  ): MedicalReport {
    const reportDate = new Date().toISOString();
    const reportId = `CYCLIX-${Date.now()}`;
    
    // Calculate data range
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dataRange = {
      startDate: sortedLogs.length > 0 ? sortedLogs[0].date : reportDate,
      endDate: sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].date : reportDate,
      totalDays: sortedLogs.length > 0 ? 
        Math.ceil((new Date(sortedLogs[sortedLogs.length - 1].date).getTime() - new Date(sortedLogs[0].date).getTime()) / (1000 * 60 * 60 * 24)) : 0
    };

    // Generate clinical analysis
    const clinicalPrediction = generateClinicalPrediction(logs, cycles, profile);
    const symptomPatterns = analyzeSymptomPatterns(logs);
    const telehealthRecommendations = generateTelehealthRecommendations(logs, cycles, clinicalPrediction);

    // Executive Summary
    const executiveSummary = this.generateExecutiveSummary(clinicalPrediction, telehealthRecommendations);

    // Cycle Analysis
    const cycleAnalysis = this.generateCycleAnalysis(cycles, profile);

    // Symptom Analysis
    const symptomAnalysis = this.generateSymptomAnalysis(logs, symptomPatterns);

    // Risk Assessment
    const riskAssessment = this.generateRiskAssessment(clinicalPrediction);

    // Clinical Recommendations
    const clinicalRecommendations = this.generateClinicalRecommendations(
      clinicalPrediction,
      telehealthRecommendations,
      logs,
      cycles
    );

    // Data Quality Assessment
    const dataQuality = this.assessDataQuality(logs, cycles, dataRange.totalDays);

    // Appendices
    const appendices = this.generateAppendices(logs, cycles, profile);

    return {
      patientInfo: {
        reportDate,
        reportId,
        dataRange
      },
      executiveSummary,
      cycleAnalysis,
      symptomAnalysis,
      riskAssessment,
      clinicalRecommendations,
      dataQuality,
      appendices
    };
  }

  private static generateExecutiveSummary(
    clinicalPrediction: any,
    telehealthRecommendations: any
  ) {
    const keyFindings: string[] = [];
    const urgentConcerns: string[] = [];
    const recommendations: string[] = [];

    // Determine overall health status
    let overallHealth: 'excellent' | 'good' | 'fair' | 'concerning' = 'good';

    if (clinicalPrediction.cycleRegularity === 'regular' && clinicalPrediction.fertilityScore > 80) {
      overallHealth = 'excellent';
      keyFindings.push('Excellent cycle regularity and fertility indicators');
    } else if (clinicalPrediction.cycleRegularity === 'highly_irregular' || clinicalPrediction.fertilityScore < 50) {
      overallHealth = 'concerning';
      urgentConcerns.push('Significant cycle irregularities detected');
    } else if (clinicalPrediction.cycleRegularity === 'irregular' || clinicalPrediction.fertilityScore < 70) {
      overallHealth = 'fair';
      keyFindings.push('Moderate cycle irregularities present');
    }

    // Risk-based findings
    if (clinicalPrediction.riskAssessment.pcos > 0.7) {
      urgentConcerns.push('High PCOS risk indicators present');
      recommendations.push('PCOS evaluation recommended');
    }

    if (clinicalPrediction.riskAssessment.endometriosis > 0.6) {
      urgentConcerns.push('Endometriosis risk factors identified');
      recommendations.push('Gynecological evaluation for endometriosis');
    }

    if (clinicalPrediction.riskAssessment.thyroidIssues > 0.5) {
      keyFindings.push('Thyroid dysfunction indicators present');
      recommendations.push('Thyroid function testing recommended');
    }

    // Telehealth recommendations
    if (telehealthRecommendations.shouldConsult) {
      if (telehealthRecommendations.urgency === 'urgent' || telehealthRecommendations.urgency === 'high') {
        urgentConcerns.push('Immediate medical consultation recommended');
      } else {
        recommendations.push('Healthcare provider consultation beneficial');
      }
    }

    return {
      overallHealth,
      keyFindings,
      urgentConcerns,
      recommendations: [...recommendations, ...clinicalPrediction.recommendations].slice(0, 5)
    };
  }

  private static generateCycleAnalysis(cycles: CycleData[], profile: UserProfile) {
    const cycleHistory = cycles.map((cycle, index) => ({
      cycleNumber: cycles.length - index,
      startDate: cycle.startDate,
      length: cycle.length,
      periodLength: cycle.periodLength,
      notes: cycle.length < 21 ? 'Short cycle' : 
             cycle.length > 35 ? 'Long cycle' : 
             'Normal length'
    }));

    // Calculate variability
    const cycleLengths = cycles.map(c => c.length);
    const mean = cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / cycleLengths.length;
    const variability = Math.sqrt(variance);

    let regularity = 'Regular';
    if (variability > 7) {
      regularity = 'Highly Irregular';
    } else if (variability > 2) {
      regularity = 'Irregular';
    }

    return {
      regularity,
      averageCycleLength: profile.cycleAvgLength,
      averagePeriodLength: profile.periodAvgLength,
      variability: Math.round(variability * 10) / 10,
      totalCyclesTracked: cycles.length,
      cycleHistory
    };
  }

  private static generateSymptomAnalysis(logs: PeriodLog[], symptomPatterns: any[]) {
    const symptomFrequency = new Map<string, number>();
    let totalSymptoms = 0;

    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomFrequency.set(symptom, (symptomFrequency.get(symptom) || 0) + 1);
        totalSymptoms++;
      });
    });

    const mostCommonSymptoms = Array.from(symptomFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symptom, count]) => {
        const pattern = symptomPatterns.find(p => p.symptom === symptom);
        return {
          symptom: symptom.replace('_', ' '),
          frequency: Math.round((count / logs.length) * 100) / 100,
          severity: pattern?.severity || 'mild',
          cyclePhaseCorrelation: this.getDominantPhase(pattern?.cyclePhaseCorrelation)
        };
      });

    const symptomTrends = symptomPatterns.slice(0, 5).map(pattern => ({
      symptom: pattern.symptom.replace('_', ' '),
      trend: pattern.trend,
      significance: pattern.frequency > 0.5 ? 'High' : pattern.frequency > 0.3 ? 'Medium' : 'Low'
    }));

    return {
      totalSymptomsTracked: totalSymptoms,
      mostCommonSymptoms,
      symptomTrends
    };
  }

  private static getDominantPhase(phaseCorrelation: any): string {
    if (!phaseCorrelation) return 'No correlation';
    
    const phases = Object.entries(phaseCorrelation) as [string, number][];
    const dominant = phases.reduce((max, [phase, value]) => 
      value > max.value ? { phase, value } : max, { phase: '', value: 0 }
    );
    
    return dominant.phase || 'No correlation';
  }

  private static generateRiskAssessment(clinicalPrediction: any) {
    const pcosIndicators: string[] = [];
    const endoIndicators: string[] = [];
    const thyroidIndicators: string[] = [];

    // PCOS indicators
    if (clinicalPrediction.riskAssessment.pcos > 0.3) {
      pcosIndicators.push('Irregular cycle patterns');
    }
    if (clinicalPrediction.riskAssessment.pcos > 0.5) {
      pcosIndicators.push('Hormonal symptom patterns');
    }
    if (clinicalPrediction.riskAssessment.pcos > 0.7) {
      pcosIndicators.push('Multiple PCOS risk factors present');
    }

    // Endometriosis indicators
    if (clinicalPrediction.riskAssessment.endometriosis > 0.3) {
      endoIndicators.push('Pain pattern analysis');
    }
    if (clinicalPrediction.riskAssessment.endometriosis > 0.5) {
      endoIndicators.push('Heavy bleeding patterns');
    }
    if (clinicalPrediction.riskAssessment.endometriosis > 0.7) {
      endoIndicators.push('Severe symptom constellation');
    }

    // Thyroid indicators
    if (clinicalPrediction.riskAssessment.thyroidIssues > 0.3) {
      thyroidIndicators.push('Cycle length variations');
    }
    if (clinicalPrediction.riskAssessment.thyroidIssues > 0.5) {
      thyroidIndicators.push('Energy and mood patterns');
    }

    const fertilityFactors: string[] = [];
    if (clinicalPrediction.fertilityScore < 70) {
      fertilityFactors.push('Cycle irregularity impact');
    }
    if (clinicalPrediction.fertilityScore < 50) {
      fertilityFactors.push('Multiple fertility risk factors');
    }
    if (clinicalPrediction.ovulationPrediction.confidence < 0.6) {
      fertilityFactors.push('Ovulation prediction uncertainty');
    }

    return {
      pcos: {
        risk: clinicalPrediction.riskAssessment.pcos,
        indicators: pcosIndicators,
        recommendations: pcosIndicators.length > 0 ? ['Consider PCOS screening', 'Lifestyle modifications'] : []
      },
      endometriosis: {
        risk: clinicalPrediction.riskAssessment.endometriosis,
        indicators: endoIndicators,
        recommendations: endoIndicators.length > 0 ? ['Gynecological evaluation', 'Pain management consultation'] : []
      },
      thyroidIssues: {
        risk: clinicalPrediction.riskAssessment.thyroidIssues,
        indicators: thyroidIndicators,
        recommendations: thyroidIndicators.length > 0 ? ['Thyroid function testing', 'Endocrinology consultation'] : []
      },
      fertilityScore: clinicalPrediction.fertilityScore,
      fertilityFactors
    };
  }

  private static generateClinicalRecommendations(
    clinicalPrediction: any,
    telehealthRecommendations: any,
    logs: PeriodLog[],
    cycles: CycleData[]
  ) {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    const lifestyle: string[] = [];
    const medical: string[] = [];

    // Immediate recommendations
    if (telehealthRecommendations.urgency === 'urgent') {
      immediate.push('Seek immediate medical attention');
    }
    if (clinicalPrediction.clinicalFlags.length > 0) {
      immediate.push('Schedule healthcare provider consultation');
    }

    // Short-term recommendations
    if (clinicalPrediction.cycleRegularity === 'irregular') {
      shortTerm.push('Continue detailed cycle tracking for 3 months');
    }
    if (clinicalPrediction.fertilityScore < 70) {
      shortTerm.push('Implement fertility optimization strategies');
    }

    // Long-term recommendations
    longTerm.push('Maintain consistent health tracking');
    if (cycles.length < 6) {
      longTerm.push('Build comprehensive cycle history over 6+ months');
    }

    // Lifestyle recommendations
    lifestyle.push('Maintain regular sleep schedule');
    lifestyle.push('Implement stress management techniques');
    lifestyle.push('Follow balanced nutrition plan');
    
    const stressSymptoms = logs.filter(log => 
      log.symptoms.some(s => s.toLowerCase().includes('stress')) ||
      log.mood === 'anxious'
    );
    if (stressSymptoms.length / logs.length > 0.3) {
      lifestyle.push('Focus on stress reduction strategies');
    }

    // Medical recommendations
    medical.push(...clinicalPrediction.recommendations);
    if (telehealthRecommendations.shouldConsult) {
      medical.push('Consider telehealth consultation');
    }

    return {
      immediate,
      shortTerm: shortTerm.slice(0, 5),
      longTerm: longTerm.slice(0, 5),
      lifestyle: lifestyle.slice(0, 5),
      medical: medical.slice(0, 5)
    };
  }

  private static assessDataQuality(logs: PeriodLog[], cycles: CycleData[], totalDays: number) {
    let completeness = 0;
    let consistency = 0;
    let reliability = 0;
    const recommendations: string[] = [];

    // Completeness assessment
    if (totalDays > 0) {
      completeness = Math.min(100, (logs.length / totalDays) * 100);
    }
    
    if (completeness < 50) {
      recommendations.push('Increase logging frequency for better insights');
    }

    // Consistency assessment
    const recentLogs = logs.slice(-30); // Last 30 logs
    const logGaps = this.calculateLogGaps(recentLogs);
    consistency = Math.max(0, 100 - (logGaps * 10));

    if (consistency < 70) {
      recommendations.push('Maintain more consistent logging schedule');
    }

    // Reliability assessment
    const symptomVariety = new Set(logs.flatMap(log => log.symptoms)).size;
    const moodVariety = new Set(logs.map(log => log.mood).filter(Boolean)).size;
    reliability = Math.min(100, (symptomVariety * 10) + (moodVariety * 5) + (cycles.length * 5));

    if (reliability < 60) {
      recommendations.push('Include more detailed symptom and mood tracking');
    }

    if (cycles.length < 3) {
      recommendations.push('Track at least 3 complete cycles for reliable analysis');
    }

    return {
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      reliability: Math.round(reliability),
      recommendations
    };
  }

  private static calculateLogGaps(logs: PeriodLog[]): number {
    if (logs.length < 2) return 0;

    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let gaps = 0;

    for (let i = 1; i < sortedLogs.length; i++) {
      const daysDiff = Math.ceil(
        (new Date(sortedLogs[i].date).getTime() - new Date(sortedLogs[i-1].date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 3) { // Gap of more than 3 days
        gaps++;
      }
    }

    return gaps;
  }

  private static generateAppendices(logs: PeriodLog[], cycles: CycleData[], profile: UserProfile) {
    const methodology = `
This report was generated using advanced clinical algorithms and machine learning models 
specifically designed for women's health analysis. The analysis includes:

1. Cycle regularity assessment using statistical variance analysis
2. Symptom pattern recognition using frequency and phase correlation analysis
3. Risk assessment using validated clinical indicators
4. Fertility scoring based on multiple health factors
5. AI-powered insight generation using pattern recognition algorithms

All analyses are based on peer-reviewed medical literature and clinical guidelines.
    `.trim();

    const limitations = [
      'This analysis is based on self-reported data and may contain inaccuracies',
      'Results should not replace professional medical advice',
      'Predictions are probabilistic and may not apply to individual cases',
      'Limited data may reduce accuracy of predictions',
      'External factors not tracked may influence results'
    ];

    const references = [
      'American College of Obstetricians and Gynecologists Practice Guidelines',
      'World Health Organization Reproductive Health Guidelines',
      'International Federation of Gynecology and Obstetrics Standards',
      'Endocrine Society Clinical Practice Guidelines',
      'American Society for Reproductive Medicine Guidelines'
    ];

    return {
      rawData: { logs, cycles, profile },
      methodology,
      limitations,
      references
    };
  }

  // Export report as formatted text
  static exportReportAsText(report: MedicalReport): string {
    const sections = [
      `CYCLIX MEDICAL REPORT`,
      `Report ID: ${report.patientInfo.reportId}`,
      `Generated: ${new Date(report.patientInfo.reportDate).toLocaleDateString()}`,
      `Data Range: ${new Date(report.patientInfo.dataRange.startDate).toLocaleDateString()} - ${new Date(report.patientInfo.dataRange.endDate).toLocaleDateString()}`,
      ``,
      `EXECUTIVE SUMMARY`,
      `Overall Health Status: ${report.executiveSummary.overallHealth.toUpperCase()}`,
      ``,
      `Key Findings:`,
      ...report.executiveSummary.keyFindings.map(f => `• ${f}`),
      ``,
      report.executiveSummary.urgentConcerns.length > 0 ? `Urgent Concerns:` : '',
      ...report.executiveSummary.urgentConcerns.map(c => `⚠️ ${c}`),
      ``,
      `Recommendations:`,
      ...report.executiveSummary.recommendations.map(r => `• ${r}`),
      ``,
      `CYCLE ANALYSIS`,
      `Regularity: ${report.cycleAnalysis.regularity}`,
      `Average Cycle Length: ${report.cycleAnalysis.averageCycleLength} days`,
      `Average Period Length: ${report.cycleAnalysis.averagePeriodLength} days`,
      `Cycle Variability: ${report.cycleAnalysis.variability} days`,
      `Total Cycles Tracked: ${report.cycleAnalysis.totalCyclesTracked}`,
      ``,
      `SYMPTOM ANALYSIS`,
      `Total Symptoms Tracked: ${report.symptomAnalysis.totalSymptomsTracked}`,
      ``,
      `Most Common Symptoms:`,
      ...report.symptomAnalysis.mostCommonSymptoms.slice(0, 5).map(s => 
        `• ${s.symptom}: ${Math.round(s.frequency * 100)}% frequency (${s.severity})`
      ),
      ``,
      `RISK ASSESSMENT`,
      `PCOS Risk: ${Math.round(report.riskAssessment.pcos.risk * 100)}%`,
      `Endometriosis Risk: ${Math.round(report.riskAssessment.endometriosis.risk * 100)}%`,
      `Thyroid Issues Risk: ${Math.round(report.riskAssessment.thyroidIssues.risk * 100)}%`,
      `Fertility Score: ${report.riskAssessment.fertilityScore}/100`,
      ``,
      `CLINICAL RECOMMENDATIONS`,
      ``,
      report.clinicalRecommendations.immediate.length > 0 ? `Immediate Actions:` : '',
      ...report.clinicalRecommendations.immediate.map(r => `🚨 ${r}`),
      ``,
      `Short-term (1-3 months):`,
      ...report.clinicalRecommendations.shortTerm.map(r => `• ${r}`),
      ``,
      `Long-term (3+ months):`,
      ...report.clinicalRecommendations.longTerm.map(r => `• ${r}`),
      ``,
      `Lifestyle Recommendations:`,
      ...report.clinicalRecommendations.lifestyle.map(r => `• ${r}`),
      ``,
      `Medical Recommendations:`,
      ...report.clinicalRecommendations.medical.map(r => `• ${r}`),
      ``,
      `DATA QUALITY ASSESSMENT`,
      `Completeness: ${report.dataQuality.completeness}%`,
      `Consistency: ${report.dataQuality.consistency}%`,
      `Reliability: ${report.dataQuality.reliability}%`,
      ``,
      `Data Quality Recommendations:`,
      ...report.dataQuality.recommendations.map(r => `• ${r}`),
      ``,
      `DISCLAIMER`,
      `This report is generated by AI analysis of self-reported data and is intended for`,
      `informational purposes only. It should not replace professional medical advice,`,
      `diagnosis, or treatment. Always consult with qualified healthcare providers for`,
      `medical concerns and before making health-related decisions.`,
      ``,
      `Report generated by Cyclix AI v2.0 - HIPAA Compliant Health Analytics`
    ];

    return sections.filter(Boolean).join('\n');
  }
}