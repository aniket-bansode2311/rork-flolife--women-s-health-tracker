import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { getTodayISO, subtractDays, getMonthDates, addDays } from '@/utils/dateUtils';
import CyclixLogo from './CyclixLogo';
import { GDPRConsent, ConsentSettings } from './GDPRConsent';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HistoricalPeriod {
  startDate: string;
  endDate: string;
  length: number;
}

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { colors } = useTheme();
  const { updateProfile, setFirstLaunch, addHistoricalData } = usePeriodStore();
  const [step, setStep] = useState(1);
  const [cycleLength, setCycleLength] = useState('');
  const [periodLength, setPeriodLength] = useState('');
  const [historicalPeriods, setHistoricalPeriods] = useState<HistoricalPeriod[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() - 1); // Start from last month
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [consents, setConsents] = useState<ConsentSettings | null>(null);
  
  const handleNext = () => {
    if (step < 5) {
      if (step === 3 && selectedDates.length === 0 && historicalPeriods.length === 0) {
        Alert.alert('Add Historical Data', 'Please select your period dates from the calendar, or skip to continue with default settings.');
        return;
      }
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSkip = () => {
    if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      // Skip GDPR consent with default settings
      setConsents({
        analyticsConsent: false,
        healthSyncConsent: false,
        marketingConsent: false,
        researchConsent: false,
      });
      setStep(5);
    }
  };
  
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    // Don't allow going beyond current month
    if (nextYear > today.getFullYear() || 
        (nextYear === today.getFullYear() && nextMonth > today.getMonth())) {
      return;
    }
    
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleDateSelect = (date: Date) => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    
    const today = new Date();
    
    // Don't allow selecting future dates
    if (date > today) return;
    
    setSelectedDates(prev => {
      if (prev.includes(isoDate)) {
        return prev.filter(d => d !== isoDate);
      } else {
        return [...prev, isoDate].sort();
      }
    });
  };
  
  // Group consecutive selected dates into periods - FIXED VERSION
  const groupConsecutiveDates = (dates: string[]): HistoricalPeriod[] => {
    if (dates.length === 0) return [];
    
    const sortedDates = [...dates].sort();
    const periods: HistoricalPeriod[] = [];
    let currentPeriod: string[] = [sortedDates[0]];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const previousDate = new Date(sortedDates[i - 1]);
      const daysDiff = Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        currentPeriod.push(sortedDates[i]);
      } else {
        // Gap found, create period from current group
        if (currentPeriod.length > 0) {
          periods.push({
            startDate: currentPeriod[0],
            endDate: currentPeriod[currentPeriod.length - 1],
            length: currentPeriod.length // Use actual length of selected dates
          });
        }
        currentPeriod = [sortedDates[i]];
      }
    }
    
    // Add the last period
    if (currentPeriod.length > 0) {
      periods.push({
        startDate: currentPeriod[0],
        endDate: currentPeriod[currentPeriod.length - 1],
        length: currentPeriod.length // Use actual length of selected dates
      });
    }
    
    return periods;
  };
  
  const addSelectedPeriods = () => {
    if (selectedDates.length === 0) return;
    
    const newPeriods = groupConsecutiveDates(selectedDates);
    setHistoricalPeriods(prev => [...prev, ...newPeriods]);
    setSelectedDates([]);
  };
  
  const removePeriod = (index: number) => {
    setHistoricalPeriods(prev => prev.filter((_, i) => i !== index));
  };
  
  const completeOnboarding = async () => {
    // Save consent settings
    if (consents) {
      try {
        await AsyncStorage.setItem('user_consents', JSON.stringify(consents));
      } catch (error) {
        console.error('Error saving consents:', error);
      }
    }
    
    // Add selected periods to historical data
    let allPeriods = [...historicalPeriods];
    
    if (selectedDates.length > 0) {
      const newPeriods = groupConsecutiveDates(selectedDates);
      allPeriods = [...allPeriods, ...newPeriods];
    }
    
    // Sort periods by date (oldest first)
    allPeriods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    // Calculate initial values from historical data if available
    let initialCycleLength = 28; // Default
    let initialPeriodLength = 5; // Default
    
    // Use user input if provided
    if (cycleLength && parseInt(cycleLength, 10) > 0) {
      initialCycleLength = parseInt(cycleLength, 10);
    }
    if (periodLength && parseInt(periodLength, 10) > 0) {
      initialPeriodLength = parseInt(periodLength, 10);
    }
    
    // If we have historical data, calculate averages from it
    if (allPeriods.length > 0) {
      // Calculate average period length from historical data
      const periodLengths = allPeriods.map(p => p.length);
      const avgPeriodLength = Math.round(periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length);
      
      // Only override user input if they didn't provide any
      if (!periodLength || parseInt(periodLength, 10) <= 0) {
        initialPeriodLength = avgPeriodLength;
      }
      
      // Calculate cycle lengths if we have multiple periods
      if (allPeriods.length >= 2) {
        const cycleLengths: number[] = [];
        for (let i = 0; i < allPeriods.length - 1; i++) {
          const cycleLength = Math.round(
            (new Date(allPeriods[i + 1].startDate).getTime() - new Date(allPeriods[i].startDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          if (cycleLength >= 15 && cycleLength <= 60) {
            cycleLengths.push(cycleLength);
          }
        }
        
        if (cycleLengths.length > 0) {
          const avgCycleLength = Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length);
          // Only override user input if they didn't provide any
          if (!cycleLength || parseInt(cycleLength, 10) <= 0) {
            initialCycleLength = avgCycleLength;
          }
        }
      }
    }
    
    let lastPeriodStart = null;
    if (allPeriods.length > 0) {
      lastPeriodStart = allPeriods[allPeriods.length - 1].startDate;
    }
    
    // Update profile with calculated values
    updateProfile({
      cycleAvgLength: initialCycleLength,
      periodAvgLength: initialPeriodLength,
      lastPeriodStart,
    });
    
    // Add historical data if available
    if (allPeriods.length > 0) {
      addHistoricalData(allPeriods);
    }
    
    // Mark first launch as complete
    setFirstLaunch(false);
    
    // Notify parent component
    onComplete();
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };
  
  const isSelected = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    
    return selectedDates.includes(isoDate);
  };
  
  const isFutureDate = (date: Date) => {
    const today = new Date();
    return date > today;
  };
  
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.logoContainer}>
        <CyclixLogo size={64} showText={true} />
      </View>
      <Text style={styles.stepTitle}>Welcome to Cyclix</Text>
      <Text style={styles.stepDescription}>
        Your intelligent period tracking companion. Track your cycle, symptoms, and get AI-powered insights to better understand your body.
      </Text>
      <Text style={styles.stepDescription}>
        Let's set up your profile with a few quick questions to provide you with the most accurate predictions.
      </Text>
    </View>
  );
  
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Cycle Details</Text>
      <Text style={styles.stepDescription}>
        If you know your typical cycle details, enter them below. Otherwise, leave blank and our AI will calculate them from your historical data.
      </Text>
      
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Average cycle length:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Auto-calculate"
            placeholderTextColor={colors.subtext}
            value={cycleLength}
            onChangeText={setCycleLength}
          />
          <Text style={styles.inputLabel}>days</Text>
        </View>
      </View>
      
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Average period length:</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Auto-calculate"
            placeholderTextColor={colors.subtext}
            value={periodLength}
            onChangeText={setPeriodLength}
          />
          <Text style={styles.inputLabel}>days</Text>
        </View>
      </View>
      
      <Text style={styles.helpText}>
        💡 Tip: If you provide historical period data in the next step, we'll automatically calculate these values for you!
      </Text>
    </View>
  );
  
  const renderStep3 = () => {
    const calendarDates = getMonthDates(currentYear, currentMonth);
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Historical Period Data</Text>
        <Text style={styles.stepDescription}>
          Select your period dates from the past 3-6 months. Select all consecutive days of each period for accurate tracking.
        </Text>
        
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekdays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekday}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.daysGrid}>
            {calendarDates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !isCurrentMonth(date) && styles.otherMonth,
                  isSelected(date) && styles.selectedDay,
                  isFutureDate(date) && styles.futureDay,
                ]}
                onPress={() => handleDateSelect(date)}
                disabled={isFutureDate(date)}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth(date) && styles.otherMonthText,
                  isSelected(date) && styles.selectedDayText,
                  isFutureDate(date) && styles.futureDayText,
                ]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {selectedDates.length > 0 && (
          <View style={styles.selectedDatesContainer}>
            <Text style={styles.selectedDatesTitle}>
              Selected dates ({selectedDates.length}):
            </Text>
            <View style={styles.selectedDatesList}>
              {selectedDates.map(date => (
                <View key={date} style={styles.selectedDateChip}>
                  <Text style={styles.selectedDateText}>
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity style={styles.addPeriodsButton} onPress={addSelectedPeriods}>
              <Text style={styles.addPeriodsButtonText}>Add These Period Days</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {historicalPeriods.length > 0 && (
          <View style={styles.addedPeriodsContainer}>
            <Text style={styles.addedPeriodsTitle}>Added Periods ({historicalPeriods.length}):</Text>
            {historicalPeriods.map((period, index) => (
              <View key={index} style={styles.addedPeriodItem}>
                <Text style={styles.addedPeriodText}>
                  {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {period.length} days
                </Text>
                <TouchableOpacity onPress={() => removePeriod(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  const handleConsentComplete = (consentSettings: ConsentSettings) => {
    setConsents(consentSettings);
    setStep(5);
  };

  const renderStep4 = () => (
    <GDPRConsent 
      onComplete={handleConsentComplete}
      onSkip={() => handleSkip()}
    />
  );

  const renderStep5 = () => {
    // Calculate what the final values will be
    let finalCycleLength = 28;
    let finalPeriodLength = 5;
    
    // Use user input if provided
    if (cycleLength && parseInt(cycleLength, 10) > 0) {
      finalCycleLength = parseInt(cycleLength, 10);
    }
    if (periodLength && parseInt(periodLength, 10) > 0) {
      finalPeriodLength = parseInt(periodLength, 10);
    }
    
    // Calculate from historical data if available
    let allPeriods = [...historicalPeriods];
    if (selectedDates.length > 0) {
      const newPeriods = groupConsecutiveDates(selectedDates);
      allPeriods = [...allPeriods, ...newPeriods];
    }
    
    if (allPeriods.length > 0) {
      // Calculate average period length from historical data
      const periodLengths = allPeriods.map(p => p.length);
      const avgPeriodLength = Math.round(periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length);
      
      // Only override user input if they didn't provide any
      if (!periodLength || parseInt(periodLength, 10) <= 0) {
        finalPeriodLength = avgPeriodLength;
      }
      
      // Calculate cycle lengths if we have multiple periods
      if (allPeriods.length >= 2) {
        const cycleLengths: number[] = [];
        for (let i = 0; i < allPeriods.length - 1; i++) {
          const cycleLength = Math.round(
            (new Date(allPeriods[i + 1].startDate).getTime() - new Date(allPeriods[i].startDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          if (cycleLength >= 15 && cycleLength <= 60) {
            cycleLengths.push(cycleLength);
          }
        }
        
        if (cycleLengths.length > 0) {
          const avgCycleLength = Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length);
          // Only override user input if they didn't provide any
          if (!cycleLength || parseInt(cycleLength, 10) <= 0) {
            finalCycleLength = avgCycleLength;
          }
        }
      }
    }
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review Your Data</Text>
        <Text style={styles.stepDescription}>
          Here's what we've collected. You can always add more data later in the app.
        </Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Cycle Length:</Text>
            <Text style={styles.summaryValue}>
              {finalCycleLength} days {(!cycleLength || parseInt(cycleLength, 10) <= 0) && allPeriods.length >= 2 ? '(calculated)' : ''}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Period Length:</Text>
            <Text style={styles.summaryValue}>
              {finalPeriodLength} days {(!periodLength || parseInt(periodLength, 10) <= 0) && allPeriods.length > 0 ? '(calculated)' : ''}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Historical Periods:</Text>
            <Text style={styles.summaryValue}>
              {allPeriods.length} periods
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Privacy Preferences:</Text>
            <Text style={styles.summaryValue}>Configured</Text>
          </View>
        </View>
        
        <Text style={styles.aiNote}>
          🤖 Our AI will use this data to provide personalized cycle predictions and health insights. The more historical data you provide, the more accurate our predictions will be.
        </Text>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    progressContainer: {
      padding: 16,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    progressText: {
      marginTop: 8,
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.subtext,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    stepContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 32,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    stepTitle: {
      fontSize: Platform.OS === 'android' ? 26 : 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    stepDescription: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.subtext,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: Platform.OS === 'android' ? 26 : 24,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: Platform.OS === 'android' ? 16 : 12,
      fontSize: Platform.OS === 'android' ? 18 : 16,
      width: Platform.OS === 'android' ? 120 : 100,
      textAlign: 'center',
      marginRight: 8,
      color: colors.text,
      backgroundColor: colors.card,
    },
    inputLabel: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.text,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 16,
      paddingHorizontal: Platform.OS === 'android' ? 8 : 0,
    },
    helpText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.secondary,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
    },
    calendarContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    navButton: {
      padding: 8,
    },
    monthTitle: {
      fontSize: Platform.OS === 'android' ? 20 : 18,
      fontWeight: '600',
      color: colors.text,
    },
    weekdays: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      color: colors.subtext,
      fontSize: Platform.OS === 'android' ? 16 : 14,
      fontWeight: '500',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calendarDay: {
      width: '14.28%',
      height: Platform.OS === 'android' ? 48 : 44,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 2,
    },
    dayText: {
      fontSize: Platform.OS === 'android' ? 18 : 14,
      color: colors.text,
      fontWeight: '500',
      textAlign: 'center',
    },
    otherMonth: {
      opacity: 0.3,
    },
    otherMonthText: {
      color: colors.subtext,
    },
    selectedDay: {
      backgroundColor: colors.primary,
      borderRadius: Platform.OS === 'android' ? 24 : 100,
    },
    selectedDayText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    futureDay: {
      opacity: 0.3,
    },
    futureDayText: {
      color: colors.subtext,
    },
    selectedDatesContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    selectedDatesTitle: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    selectedDatesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    selectedDateChip: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: Platform.OS === 'android' ? 16 : 12,
      paddingVertical: Platform.OS === 'android' ? 10 : 6,
      margin: 4,
    },
    selectedDateText: {
      color: '#FFFFFF',
      fontSize: Platform.OS === 'android' ? 16 : 14,
      fontWeight: '500',
    },
    addPeriodsButton: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: Platform.OS === 'android' ? 16 : 12,
      alignItems: 'center',
    },
    addPeriodsButtonText: {
      color: '#FFFFFF',
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
    },
    addedPeriodsContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    addedPeriodsTitle: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    addedPeriodItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Platform.OS === 'android' ? 12 : 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    addedPeriodText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.text,
      flex: 1,
    },
    removeButton: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.error,
      fontWeight: '500',
    },
    summaryContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: Platform.OS === 'android' ? 16 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryLabel: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.text,
    },
    summaryValue: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
      color: colors.primary,
    },
    aiNote: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.subtext,
      textAlign: 'center',
      fontStyle: 'italic',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      lineHeight: Platform.OS === 'android' ? 24 : 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    backButton: {
      flex: 1,
      padding: Platform.OS === 'android' ? 18 : 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    backButtonText: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.subtext,
    },
    skipButton: {
      flex: 1,
      padding: Platform.OS === 'android' ? 18 : 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    skipButtonText: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      color: colors.secondary,
    },
    nextButton: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: Platform.OS === 'android' ? 18 : 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButtonText: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 5) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 5</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {(step === 3 || step === 4) && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        {step !== 4 && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {step < 5 ? 'Next' : 'Get Started'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}