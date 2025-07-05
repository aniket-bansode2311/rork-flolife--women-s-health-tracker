import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePeriodStore } from '@/store/periodStore';
import { 
  TelehealthService, 
  HealthcareProvider, 
  ConsultationType, 
  TimeSlot 
} from '@/utils/telehealthIntegration';
import { generateClinicalPrediction } from '@/utils/clinicalPredictions';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  Star, 
  User,
  Shield,
  CheckCircle,
  X
} from 'lucide-react-native';

interface TelehealthBookingProps {
  visible: boolean;
  onClose: () => void;
  initialConsultationType?: string;
}

export default function TelehealthBooking({ 
  visible, 
  onClose, 
  initialConsultationType 
}: TelehealthBookingProps) {
  const { colors } = useTheme();
  const { profile, logs, cycles } = usePeriodStore();
  
  const [step, setStep] = useState<'consultation' | 'providers' | 'booking' | 'confirmation'>('consultation');
  const [selectedConsultationType, setSelectedConsultationType] = useState<ConsultationType | null>(null);
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    insurance: '',
    chiefComplaint: ''
  });

  const consultationTypes: ConsultationType[] = [
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
      requiresInPerson: false
    },
    {
      id: 'endometriosis_consult',
      name: 'Endometriosis Consultation',
      description: 'Endometriosis evaluation and pain management',
      duration: 45,
      price: 225,
      requiresInPerson: false
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

  useEffect(() => {
    if (initialConsultationType) {
      const consultationType = consultationTypes.find(ct => ct.id === initialConsultationType);
      if (consultationType) {
        setSelectedConsultationType(consultationType);
        setStep('providers');
        loadProviders();
      }
    }
  }, [initialConsultationType]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const foundProviders = await TelehealthService.findProviders({
        telemedicineOnly: true,
        specialty: 'gynecology'
      });
      setProviders(foundProviders);
    } catch (error) {
      Alert.alert('Error', 'Failed to load healthcare providers');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultationSelect = (consultationType: ConsultationType) => {
    setSelectedConsultationType(consultationType);
    setStep('providers');
    loadProviders();
  };

  const handleProviderSelect = (provider: HealthcareProvider) => {
    setSelectedProvider(provider);
    setStep('booking');
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleBooking = async () => {
    if (!selectedProvider || !selectedConsultationType || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select all required options');
      return;
    }

    if (!patientInfo.name || !patientInfo.email || !patientInfo.phone) {
      Alert.alert('Error', 'Please fill in all required patient information');
      return;
    }

    setLoading(true);
    try {
      const consultation = await TelehealthService.scheduleConsultation(
        selectedProvider.id,
        selectedConsultationType,
        selectedTimeSlot,
        patientInfo
      );

      // Share health data if consent is given
      if (profile.lastPeriodStart) {
        const clinicalPrediction = generateClinicalPrediction(logs, cycles, profile);
        await TelehealthService.shareHealthData(
          consultation,
          {
            cycles,
            logs,
            clinicalPrediction,
            profile
          },
          true // Consent given
        );
      }

      setStep('confirmation');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule consultation');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setStep('consultation');
    setSelectedConsultationType(null);
    setSelectedProvider(null);
    setSelectedTimeSlot(null);
    setPatientInfo({
      name: '',
      email: '',
      phone: '',
      insurance: '',
      chiefComplaint: ''
    });
  };

  const handleClose = () => {
    resetBooking();
    onClose();
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 24,
      gap: 8,
    },
    stepDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
    stepDotActive: {
      backgroundColor: colors.primary,
    },
    consultationCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    consultationCardSelected: {
      borderColor: colors.primary,
    },
    consultationName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    consultationDescription: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 8,
    },
    consultationDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    consultationDuration: {
      fontSize: 12,
      color: colors.subtext,
    },
    consultationPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    providerCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    providerCardSelected: {
      borderColor: colors.primary,
    },
    providerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    providerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    providerRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    providerSpecialty: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 4,
    },
    providerLocation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
    },
    locationText: {
      fontSize: 12,
      color: colors.subtext,
    },
    providerFeatures: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    featureBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    featureBadgeText: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    timeSlotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    timeSlot: {
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 100,
      alignItems: 'center',
    },
    timeSlotSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeSlotText: {
      fontSize: 12,
      color: colors.text,
    },
    timeSlotTextSelected: {
      color: '#FFFFFF',
    },
    timeSlotType: {
      fontSize: 10,
      color: colors.subtext,
      marginTop: 2,
    },
    timeSlotTypeSelected: {
      color: '#FFFFFF',
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    bookButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    bookButtonDisabled: {
      backgroundColor: colors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmationContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    confirmationIcon: {
      marginBottom: 24,
    },
    confirmationTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    confirmationText: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    confirmationDetails: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.subtext,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    doneButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 8,
    },
    doneButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderStepIndicator = () => {
    const steps = ['consultation', 'providers', 'booking', 'confirmation'];
    const currentIndex = steps.indexOf(step);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              index <= currentIndex && styles.stepDotActive
            ]}
          />
        ))}
      </View>
    );
  };

  const renderConsultationSelection = () => (
    <ScrollView>
      <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 24 }]}>
        Select Consultation Type
      </Text>
      {consultationTypes.map((consultation) => (
        <TouchableOpacity
          key={consultation.id}
          style={[
            styles.consultationCard,
            selectedConsultationType?.id === consultation.id && styles.consultationCardSelected
          ]}
          onPress={() => handleConsultationSelect(consultation)}
        >
          <Text style={styles.consultationName}>{consultation.name}</Text>
          <Text style={styles.consultationDescription}>{consultation.description}</Text>
          <View style={styles.consultationDetails}>
            <Text style={styles.consultationDuration}>{consultation.duration} minutes</Text>
            <Text style={styles.consultationPrice}>${consultation.price}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderProviderSelection = () => (
    <ScrollView>
      <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 24 }]}>
        Select Healthcare Provider
      </Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[
              styles.providerCard,
              selectedProvider?.id === provider.id && styles.providerCardSelected
            ]}
            onPress={() => handleProviderSelect(provider)}
          >
            <View style={styles.providerHeader}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <View style={styles.providerRating}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>{provider.rating}</Text>
              </View>
            </View>
            <Text style={styles.providerSpecialty}>
              {provider.specialty.replace('_', ' ').toUpperCase()}
            </Text>
            <View style={styles.providerLocation}>
              <MapPin size={12} color={colors.subtext} />
              <Text style={styles.locationText}>
                {provider.location.city}, {provider.location.state}
              </Text>
            </View>
            <View style={styles.providerFeatures}>
              {provider.telemedicineEnabled && (
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>TELEHEALTH</Text>
                </View>
              )}
              <View style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>
                  {provider.languages.join(', ')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  const renderBookingForm = () => (
    <ScrollView>
      <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 24 }]}>
        Book Your Consultation
      </Text>

      {/* Time Slot Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Select Time Slot</Text>
        <View style={styles.timeSlotGrid}>
          {selectedProvider?.availableSlots.filter(slot => slot.available).slice(0, 8).map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timeSlot,
                selectedTimeSlot?.id === slot.id && styles.timeSlotSelected
              ]}
              onPress={() => handleTimeSlotSelect(slot)}
            >
              <Text style={[
                styles.timeSlotText,
                selectedTimeSlot?.id === slot.id && styles.timeSlotTextSelected
              ]}>
                {new Date(slot.startTime).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              <Text style={[
                styles.timeSlotText,
                selectedTimeSlot?.id === slot.id && styles.timeSlotTextSelected
              ]}>
                {new Date(slot.startTime).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </Text>
              <Text style={[
                styles.timeSlotType,
                selectedTimeSlot?.id === slot.id && styles.timeSlotTypeSelected
              ]}>
                {slot.type === 'video' ? 'Video' : slot.type === 'phone' ? 'Phone' : 'In-Person'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Patient Information */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={patientInfo.name}
          onChangeText={(text) => setPatientInfo(prev => ({ ...prev, name: text }))}
          placeholder="Enter your full name"
          placeholderTextColor={colors.subtext}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={patientInfo.email}
          onChangeText={(text) => setPatientInfo(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          placeholderTextColor={colors.subtext}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={patientInfo.phone}
          onChangeText={(text) => setPatientInfo(prev => ({ ...prev, phone: text }))}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.subtext}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Insurance Provider</Text>
        <TextInput
          style={styles.input}
          value={patientInfo.insurance}
          onChangeText={(text) => setPatientInfo(prev => ({ ...prev, insurance: text }))}
          placeholder="Enter your insurance provider"
          placeholderTextColor={colors.subtext}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Chief Complaint</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={patientInfo.chiefComplaint}
          onChangeText={(text) => setPatientInfo(prev => ({ ...prev, chiefComplaint: text }))}
          placeholder="Briefly describe your main concern"
          placeholderTextColor={colors.subtext}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedTimeSlot || !patientInfo.name || !patientInfo.email || !patientInfo.phone) && 
          styles.bookButtonDisabled
        ]}
        onPress={handleBooking}
        disabled={!selectedTimeSlot || !patientInfo.name || !patientInfo.email || !patientInfo.phone || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.bookButtonText}>Book Consultation</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.confirmationIcon}>
        <CheckCircle size={64} color={colors.success} />
      </View>
      <Text style={styles.confirmationTitle}>Consultation Booked!</Text>
      <Text style={styles.confirmationText}>
        Your telehealth consultation has been successfully scheduled. 
        You will receive a confirmation email with meeting details.
      </Text>
      
      <View style={styles.confirmationDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Provider:</Text>
          <Text style={styles.detailValue}>{selectedProvider?.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Consultation:</Text>
          <Text style={styles.detailValue}>{selectedConsultationType?.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time:</Text>
          <Text style={styles.detailValue}>
            {selectedTimeSlot && new Date(selectedTimeSlot.startTime).toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>
            {selectedTimeSlot?.type === 'video' ? 'Video Call' : 
             selectedTimeSlot?.type === 'phone' ? 'Phone Call' : 'In-Person'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Telehealth Consultation</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {step !== 'confirmation' && renderStepIndicator()}

        <View style={styles.content}>
          {step === 'consultation' && renderConsultationSelection()}
          {step === 'providers' && renderProviderSelection()}
          {step === 'booking' && renderBookingForm()}
          {step === 'confirmation' && renderConfirmation()}
        </View>
      </View>
    </Modal>
  );
}