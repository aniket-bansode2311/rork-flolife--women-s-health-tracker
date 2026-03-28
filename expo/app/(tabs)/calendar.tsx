import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import CalendarView from '@/components/CalendarView';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { getTodayISO, formatDate } from '@/utils/dateUtils';
import { Plus } from 'lucide-react-native';

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const { logs } = usePeriodStore();
  
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    // Always allow navigation to log entry for any date
    router.push(`/log-entry?date=${date}`);
  };
  
  const handleAddLog = () => {
    router.push(`/log-entry?date=${selectedDate}`);
  };
  
  // Find log for selected date
  const selectedLog = logs.find(log => log.date === selectedDate);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    addButton: {
      padding: 8,
      marginRight: 8,
    },
    selectedDateContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      flex: 1,
    },
    selectedDateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    logSummary: {
      flex: 1,
    },
    flowIndicator: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    flowText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    symptomsContainer: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    symptomsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    symptomTag: {
      backgroundColor: colors.background,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      margin: 4,
    },
    symptomText: {
      color: colors.text,
      fontSize: 14,
      textTransform: 'capitalize',
    },
    moodContainer: {
      marginBottom: 16,
    },
    moodTag: {
      backgroundColor: colors.secondary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignSelf: 'flex-start',
    },
    moodText: {
      color: '#FFFFFF',
      fontSize: 14,
    },
    notesContainer: {
      marginBottom: 16,
    },
    notesText: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
    },
    editButton: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      marginTop: 'auto',
    },
    editButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyLogContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyLogText: {
      fontSize: 16,
      color: colors.subtext,
      marginBottom: 16,
      textAlign: 'center',
    },
    addLogButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    addLogButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Calendar',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerRight: () => (
            <TouchableOpacity style={styles.addButton} onPress={handleAddLog}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <CalendarView onSelectDate={setSelectedDate} />
      
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateTitle}>
          {formatDate(new Date(selectedDate))}
        </Text>
        
        {selectedLog ? (
          <View style={styles.logSummary}>
            {selectedLog.flow !== 'none' && (
              <View style={styles.flowIndicator}>
                <Text style={styles.flowText}>
                  {selectedLog.flow.charAt(0).toUpperCase() + selectedLog.flow.slice(1)} Flow
                </Text>
              </View>
            )}
            
            {selectedLog.symptoms.length > 0 && (
              <View style={styles.symptomsContainer}>
                <Text style={styles.sectionTitle}>Symptoms</Text>
                <View style={styles.symptomsRow}>
                  {selectedLog.symptoms.map(symptom => (
                    <View key={symptom} style={styles.symptomTag}>
                      <Text style={styles.symptomText}>
                        {symptom.replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {selectedLog.mood && (
              <View style={styles.moodContainer}>
                <Text style={styles.sectionTitle}>Mood</Text>
                <View style={styles.moodTag}>
                  <Text style={styles.moodText}>
                    {selectedLog.mood.charAt(0).toUpperCase() + selectedLog.mood.slice(1)}
                  </Text>
                </View>
              </View>
            )}
            
            {selectedLog.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{selectedLog.notes}</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push(`/log-entry?date=${selectedDate}`)}
            >
              <Text style={styles.editButtonText}>Edit Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyLogContainer}>
            <Text style={styles.emptyLogText}>
              No data for this day.{'\n'}Tap to add your period log, symptoms, and mood.
            </Text>
            <TouchableOpacity 
              style={styles.addLogButton}
              onPress={() => router.push(`/log-entry?date=${selectedDate}`)}
            >
              <Text style={styles.addLogButtonText}>Add Log</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}