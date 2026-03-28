import { PeriodLog, CycleData, UserProfile } from '@/types/period';
import { ClinicalPrediction } from './clinicalPredictions';

// Telehealth integration interfaces
export interface HealthcareProvider {
  id: string;
  name: string;
  specialty: 'gynecology' | 'endocrinology' | 'reproductive_medicine' | 'primary_care';
  credentials: string[];
  rating: number;
  availableSlots: TimeSlot[];
  consultationTypes: ConsultationType[];
  languages: string[];
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  telemedicineEnabled: boolean;
  acceptedInsurance: string[];
}

export interface TimeSlot {
  id: string;
  startTime: string; // ISO string
  endTime: string;
  type: 'in_person' | 'video' | 'phone';
  available: boolean;
  price: number;
}

export interface ConsultationType {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  requiresInPerson: boolean;
  specialtyRequired?: string;
}

export interface Consultation {
  id: string;
  providerId: string;
  patientId: string;
  type: ConsultationType;
  scheduledTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  prescription?: Prescription[];
  followUpRequired: boolean;
  followUpDate?: string;
  medicalSummary?: MedicalSummary;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refills: number;
  prescribedDate: string;
  pharmacyInfo?: {
    name: string;
    address: string;
    phone: string;
  };
}

export interface MedicalSummary {
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string[];
  recommendations: string[];
  labOrdersRequested: string[];
  referrals: string[];
  nextAppointmentRecommended: boolean;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
}

export interface HealthDataShare {
  patientId: string;
  providerId: string;
  consultationId: string;
  sharedData: {
    cycleHistory: CycleData[];
    symptomLogs: PeriodLog[];
    clinicalPredictions: ClinicalPrediction;
    userProfile: Partial<UserProfile>;
  };
  consentGiven: boolean;
  consentDate: string;
  dataRetentionDays: number;
}

// Telehealth service class
export class TelehealthService {
  private static readonly API_BASE_URL = 'https://api.cyclix-telehealth.com';
  private static readonly CONSULTATION_TYPES: ConsultationType[] = [
    {
      id: 'routine_gyneco',
      name: 'Routine Gynecological Consultation',
      description: 'General reproductive health discussion and cycle evaluation',
      duration: 30,
      price: 150,
      requiresInPerson: false
    },
    {
      id: 'fertility_consult',
      name: 'Fertility Consultation',
      description: 'Fertility assessment and family planning guidance',
      duration: 45,
      price: 200,
      requiresInPerson: false
    },
    {
      id: 'pcos_evaluation',
      name: 'PCOS Evaluation',
      description: 'Comprehensive PCOS assessment and management planning',
      duration: 60,
      price: 250,
      requiresInPerson: false,
      specialtyRequired: 'endocrinology'
    },
    {
      id: 'endometriosis_consult',
      name: 'Endometriosis Consultation',
      description: 'Endometriosis evaluation and pain management',
      duration: 45,
      price: 225,
      requiresInPerson: false,
      specialtyRequired: 'gynecology'
    },
    {
      id: 'hormone_therapy',
      name: 'Hormone Therapy Consultation',
      description: 'Hormone replacement therapy and hormonal contraception',
      duration: 30,
      price: 175,
      requiresInPerson: false,
      specialtyRequired: 'gynecology'
    },
    {
      id: 'urgent_consult',
      name: 'Urgent Consultation',
      description: 'Same-day consultation for urgent reproductive health concerns',
      duration: 20,
      price: 100,
      requiresInPerson: false
    }
  ];

  // Find healthcare providers based on criteria
  static async findProviders(criteria: {
    specialty?: string;
    location?: { lat: number; lng: number; radius: number };
    insurance?: string;
    telemedicineOnly?: boolean;
    availableToday?: boolean;
  }): Promise<HealthcareProvider[]> {
    try {
      // In a real implementation, this would call an actual API
      const mockProviders: HealthcareProvider[] = [
        {
          id: 'provider_1',
          name: 'Dr. Sarah Johnson, MD',
          specialty: 'gynecology',
          credentials: ['MD', 'Board Certified Gynecologist', 'Reproductive Endocrinology Fellowship'],
          rating: 4.8,
          availableSlots: this.generateMockTimeSlots(),
          consultationTypes: this.CONSULTATION_TYPES.filter(t => 
            !t.specialtyRequired || t.specialtyRequired === 'gynecology'
          ),
          languages: ['English', 'Spanish'],
          location: {
            address: '123 Medical Center Dr',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
            coordinates: { lat: 37.7749, lng: -122.4194 }
          },
          telemedicineEnabled: true,
          acceptedInsurance: ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealth']
        },
        {
          id: 'provider_2',
          name: 'Dr. Michael Chen, MD',
          specialty: 'endocrinology',
          credentials: ['MD', 'Board Certified Endocrinologist', 'Reproductive Endocrinology Specialist'],
          rating: 4.9,
          availableSlots: this.generateMockTimeSlots(),
          consultationTypes: this.CONSULTATION_TYPES.filter(t => 
            !t.specialtyRequired || t.specialtyRequired === 'endocrinology'
          ),
          languages: ['English', 'Mandarin'],
          location: {
            address: '456 Health Plaza',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            coordinates: { lat: 37.7849, lng: -122.4094 }
          },
          telemedicineEnabled: true,
          acceptedInsurance: ['Blue Cross', 'Kaiser', 'Anthem']
        }
      ];

      // Filter based on criteria
      let filteredProviders = mockProviders;

      if (criteria.specialty) {
        filteredProviders = filteredProviders.filter(p => p.specialty === criteria.specialty);
      }

      if (criteria.telemedicineOnly) {
        filteredProviders = filteredProviders.filter(p => p.telemedicineEnabled);
      }

      if (criteria.insurance) {
        filteredProviders = filteredProviders.filter(p => 
          p.acceptedInsurance.includes(criteria.insurance!)
        );
      }

      return filteredProviders;
    } catch (error) {
      console.error('Error finding providers:', error);
      return [];
    }
  }

  // Generate consultation recommendations based on clinical data
  static generateConsultationRecommendations(
    clinicalPrediction: ClinicalPrediction,
    logs: PeriodLog[],
    cycles: CycleData[]
  ): {
    recommended: ConsultationType[];
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    reasons: string[];
  } {
    const recommended: ConsultationType[] = [];
    const reasons: string[] = [];
    let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'low';

    // Check for high-risk conditions
    if (clinicalPrediction.riskAssessment.pcos > 0.7) {
      const pcosConsult = this.CONSULTATION_TYPES.find(t => t.id === 'pcos_evaluation');
      if (pcosConsult) {
        recommended.push(pcosConsult);
        reasons.push('High PCOS risk indicators detected');
        urgency = 'high';
      }
    }

    if (clinicalPrediction.riskAssessment.endometriosis > 0.6) {
      const endoConsult = this.CONSULTATION_TYPES.find(t => t.id === 'endometriosis_consult');
      if (endoConsult) {
        recommended.push(endoConsult);
        reasons.push('Endometriosis symptoms pattern identified');
        urgency = urgency === 'low' ? 'medium' : urgency;
      }
    }

    if (clinicalPrediction.riskAssessment.thyroidIssues > 0.5) {
      const hormoneConsult = this.CONSULTATION_TYPES.find(t => t.id === 'hormone_therapy');
      if (hormoneConsult) {
        recommended.push(hormoneConsult);
        reasons.push('Thyroid dysfunction indicators present');
        urgency = urgency === 'low' ? 'medium' : urgency;
      }
    }

    // Check for cycle irregularities
    if (clinicalPrediction.cycleRegularity === 'highly_irregular') {
      const routineConsult = this.CONSULTATION_TYPES.find(t => t.id === 'routine_gyneco');
      if (routineConsult) {
        recommended.push(routineConsult);
        reasons.push('Significant cycle irregularity requires evaluation');
        urgency = urgency === 'low' ? 'medium' : urgency;
      }
    }

    // Check for fertility concerns
    if (clinicalPrediction.fertilityScore < 50) {
      const fertilityConsult = this.CONSULTATION_TYPES.find(t => t.id === 'fertility_consult');
      if (fertilityConsult) {
        recommended.push(fertilityConsult);
        reasons.push('Multiple fertility risk factors identified');
        urgency = urgency === 'low' ? 'medium' : urgency;
      }
    }

    // Check for urgent symptoms
    const recentLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return logDate >= oneWeekAgo;
    });

    const urgentSymptoms = recentLogs.filter(log =>
      log.symptoms.some(s => 
        s.toLowerCase().includes('severe pain') ||
        s.toLowerCase().includes('heavy bleeding') ||
        s.toLowerCase().includes('fever') ||
        s.toLowerCase().includes('nausea')
      )
    );

    if (urgentSymptoms.length > 0) {
      const urgentConsult = this.CONSULTATION_TYPES.find(t => t.id === 'urgent_consult');
      if (urgentConsult) {
        recommended.unshift(urgentConsult);
        reasons.unshift('Urgent symptoms require immediate medical attention');
        urgency = 'urgent';
      }
    }

    // Default recommendation for routine care
    if (recommended.length === 0) {
      const routineConsult = this.CONSULTATION_TYPES.find(t => t.id === 'routine_gyneco');
      if (routineConsult) {
        recommended.push(routineConsult);
        reasons.push('Regular reproductive health check-up recommended');
      }
    }

    return { recommended, urgency, reasons };
  }

  // Schedule a consultation
  static async scheduleConsultation(
    providerId: string,
    consultationType: ConsultationType,
    timeSlot: TimeSlot,
    patientData: {
      name: string;
      email: string;
      phone: string;
      insurance?: string;
      chiefComplaint: string;
    }
  ): Promise<Consultation> {
    try {
      // In a real implementation, this would call an actual API
      const consultation: Consultation = {
        id: `consult_${Date.now()}`,
        providerId,
        patientId: `patient_${Date.now()}`,
        type: consultationType,
        scheduledTime: timeSlot.startTime,
        status: 'scheduled',
        followUpRequired: false
      };

      if (timeSlot.type === 'video') {
        consultation.meetingLink = `https://meet.cyclix.com/room/${consultation.id}`;
      }

      return consultation;
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      throw new Error('Failed to schedule consultation');
    }
  }

  // Share health data with provider
  static async shareHealthData(
    consultation: Consultation,
    healthData: {
      cycles: CycleData[];
      logs: PeriodLog[];
      clinicalPrediction: ClinicalPrediction;
      profile: Partial<UserProfile>;
    },
    consentGiven: boolean
  ): Promise<HealthDataShare> {
    try {
      if (!consentGiven) {
        throw new Error('Patient consent required for data sharing');
      }

      const dataShare: HealthDataShare = {
        patientId: consultation.patientId,
        providerId: consultation.providerId,
        consultationId: consultation.id,
        sharedData: {
          cycleHistory: healthData.cycles,
          symptomLogs: healthData.logs,
          clinicalPredictions: healthData.clinicalPrediction,
          userProfile: healthData.profile
        },
        consentGiven: true,
        consentDate: new Date().toISOString(),
        dataRetentionDays: 365 // 1 year retention
      };

      // In a real implementation, this would securely transmit data to the provider
      console.log('Health data shared with provider:', dataShare.providerId);

      return dataShare;
    } catch (error) {
      console.error('Error sharing health data:', error);
      throw error;
    }
  }

  // Get consultation history
  static async getConsultationHistory(patientId: string): Promise<Consultation[]> {
    try {
      // In a real implementation, this would fetch from an API
      return [];
    } catch (error) {
      console.error('Error fetching consultation history:', error);
      return [];
    }
  }

  // Generate pre-consultation summary
  static generatePreConsultationSummary(
    logs: PeriodLog[],
    cycles: CycleData[],
    clinicalPrediction: ClinicalPrediction
  ): {
    summary: string;
    keyFindings: string[];
    questionsToAsk: string[];
    dataToDiscuss: string[];
  } {
    const keyFindings: string[] = [];
    const questionsToAsk: string[] = [];
    const dataToDiscuss: string[] = [];

    // Cycle regularity findings
    if (clinicalPrediction.cycleRegularity === 'highly_irregular') {
      keyFindings.push('Significant cycle irregularity detected');
      questionsToAsk.push('What factors might be contributing to irregular cycles?');
      dataToDiscuss.push('Cycle length variations and patterns');
    }

    // Risk assessment findings
    if (clinicalPrediction.riskAssessment.pcos > 0.6) {
      keyFindings.push('PCOS risk indicators present');
      questionsToAsk.push('Should I be tested for PCOS?');
      dataToDiscuss.push('Symptom patterns suggesting PCOS');
    }

    if (clinicalPrediction.riskAssessment.endometriosis > 0.5) {
      keyFindings.push('Endometriosis risk factors identified');
      questionsToAsk.push('Could my symptoms indicate endometriosis?');
      dataToDiscuss.push('Pain patterns and severity trends');
    }

    // Fertility findings
    if (clinicalPrediction.fertilityScore < 60) {
      keyFindings.push('Multiple fertility considerations identified');
      questionsToAsk.push('What can I do to optimize my fertility?');
      dataToDiscuss.push('Ovulation patterns and fertile window accuracy');
    }

    // Symptom patterns
    const recentLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return logDate >= threeMonthsAgo;
    });

    const commonSymptoms = this.getCommonSymptoms(recentLogs);
    if (commonSymptoms.length > 0) {
      keyFindings.push(`Frequent symptoms: ${commonSymptoms.join(', ')}`);
      dataToDiscuss.push('Symptom frequency and impact on daily life');
    }

    const summary = `
Based on ${cycles.length} tracked cycles and ${logs.length} symptom logs:
- Cycle regularity: ${clinicalPrediction.cycleRegularity}
- Fertility score: ${clinicalPrediction.fertilityScore}/100
- Key concerns: ${keyFindings.join('; ')}
    `.trim();

    return {
      summary,
      keyFindings,
      questionsToAsk,
      dataToDiscuss
    };
  }

  // Helper methods
  private static generateMockTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const today = new Date();
    
    for (let day = 1; day <= 14; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      
      // Generate morning and afternoon slots
      for (const hour of [9, 10, 11, 14, 15, 16]) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(30);
        
        slots.push({
          id: `slot_${day}_${hour}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: Math.random() > 0.5 ? 'video' : 'in_person',
          available: Math.random() > 0.3,
          price: 150
        });
      }
    }
    
    return slots;
  }

  private static getCommonSymptoms(logs: PeriodLog[]): string[] {
    const symptomCount = new Map<string, number>();
    
    logs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCount.set(symptom, (symptomCount.get(symptom) || 0) + 1);
      });
    });

    return Array.from(symptomCount.entries())
      .filter(([_, count]) => count >= logs.length * 0.3) // Appears in 30% of logs
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([symptom, _]) => symptom);
  }
}

// Integration with existing prediction system
export const generateTelehealthRecommendations = (
  logs: PeriodLog[],
  cycles: CycleData[],
  clinicalPrediction: ClinicalPrediction
): {
  shouldConsult: boolean;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  recommendedConsultations: ConsultationType[];
  reasons: string[];
  preConsultationSummary: ReturnType<typeof TelehealthService.generatePreConsultationSummary>;
} => {
  const recommendations = TelehealthService.generateConsultationRecommendations(
    clinicalPrediction,
    logs,
    cycles
  );

  const preConsultationSummary = TelehealthService.generatePreConsultationSummary(
    logs,
    cycles,
    clinicalPrediction
  );

  return {
    shouldConsult: recommendations.urgency !== 'low' || clinicalPrediction.clinicalFlags.length > 0,
    urgency: recommendations.urgency,
    recommendedConsultations: recommendations.recommended,
    reasons: recommendations.reasons,
    preConsultationSummary
  };
};