import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { getTodayISO, formatDate } from '@/utils/dateUtils';
import OnboardingScreen from '@/components/OnboardingScreen';
import CalendarView from '@/components/CalendarView';
import CycleInsights from '@/components/CycleInsights';
import HealthInsights from '@/components/HealthInsights';
import IrregularityPredictions from '@/components/IrregularityPredictions';
import CyclixLogo from '@/components/CyclixLogo';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isFirstLaunch, profile, calculateCycles } = usePeriodStore();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  
  // Calculate cycles on component mount to ensure data is up to date
  useEffect(() => {
    if (!isFirstLaunch) {
      calculateCycles();
    }
  }, [isFirstLaunch, calculateCycles]);
  
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    router.push(`/log-entry?date=${date}`);
  };
  
  const handleViewInsights = () => {
    router.push('/insights');
  };
  
  const handleAddLog = () => {
    router.push(`/log-entry?date=${selectedDate}`);
  };
  
  const handleOnboardingComplete = () => {
    // Onboarding is complete, the store will update automatically
    // Force a re-render by calculating cycles
    setTimeout(() => {
      calculateCycles();
    }, 100);
  };
  
  if (isFirstLaunch) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 24,
    },
    greeting: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
    },
    date: {
      fontSize: 16,
      color: colors.subtext,
      marginTop: 4,
    },
    addButton: {
      padding: 8,
      marginRight: 8,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Cyclix',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerLeft: () => (
            <View style={styles.logoContainer}>
              <CyclixLogo size={24} />
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={handleAddLog}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>
        
        <CalendarView onSelectDate={handleSelectDate} />
        
        <CycleInsights />
        
        <IrregularityPredictions />
        
        <HealthInsights onViewDetails={handleViewInsights} />
      </ScrollView>
    </View>
  );
}