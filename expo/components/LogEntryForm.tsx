import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { PeriodLog, FlowIntensity } from '@/types/period';
import symptoms from '@/constants/symptoms';
import moods from '@/constants/moods';
import { formatDate } from '@/utils/dateUtils';
import { Droplet, X } from 'lucide-react-native';

export default function LogEntryForm({ date, onSave }: { date: string; onSave?: () => void }) {
  const { colors } = useTheme();
  const { logs, addLog } = usePeriodStore();
  const [log, setLog] = useState<PeriodLog>({
    date,
    flow: 'none',
    symptoms: [],
    mood: 'neutral',
    notes: '',
  });
  
  // Load existing log if available
  useEffect(() => {
    const existingLog = logs.find(l => l.date === date);
    if (existingLog) {
      setLog(existingLog);
    } else {
      // Reset form for new date
      setLog({
        date,
        flow: 'none',
        symptoms: [],
        mood: 'neutral',
        notes: '',
      });
    }
  }, [date, logs]);
  
  const handleFlowChange = (flow: FlowIntensity) => {
    setLog(prev => ({ ...prev, flow }));
  };
  
  const handleSymptomToggle = (symptomId: string) => {
    setLog(prev => {
      const symptoms = [...prev.symptoms];
      const index = symptoms.indexOf(symptomId);
      
      if (index >= 0) {
        symptoms.splice(index, 1);
      } else {
        symptoms.push(symptomId);
      }
      
      return { ...prev, symptoms };
    });
  };
  
  const handleMoodChange = (moodId: string) => {
    setLog(prev => ({ ...prev, mood: moodId }));
  };
  
  const handleNotesChange = (notes: string) => {
    setLog(prev => ({ ...prev, notes }));
  };
  
  const handleSave = () => {
    addLog(log);
    if (onSave) onSave();
  };
  
  const getFlowColor = (flow: FlowIntensity) => {
    switch (flow) {
      case 'light':
        return 'rgba(255, 107, 139, 0.3)';
      case 'medium':
        return 'rgba(255, 107, 139, 0.6)';
      case 'heavy':
        return 'rgba(255, 107, 139, 1)';
      default:
        return 'transparent';
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    dateHeader: {
      fontSize: Platform.OS === 'android' ? 22 : 20,
      fontWeight: '600',
      marginBottom: 24,
      color: colors.text,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
      marginBottom: 12,
      color: colors.text,
    },
    flowOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Platform.OS === 'android' ? 8 : 4,
    },
    flowOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Platform.OS === 'android' ? 16 : 12,
      marginHorizontal: Platform.OS === 'android' ? 2 : 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      minHeight: Platform.OS === 'android' ? 80 : 70,
    },
    selectedOption: {
      borderColor: colors.primary,
    },
    flowText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.text,
      marginTop: 4,
      textAlign: 'center',
    },
    dropletRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    moodScroll: {
      marginBottom: 8,
    },
    moodOptions: {
      flexDirection: 'row',
      paddingVertical: 8,
    },
    moodOption: {
      paddingHorizontal: Platform.OS === 'android' ? 18 : 16,
      paddingVertical: Platform.OS === 'android' ? 12 : 8,
      marginRight: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: Platform.OS === 'android' ? 44 : 36,
      justifyContent: 'center',
    },
    selectedMood: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    moodText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.text,
      textAlign: 'center',
    },
    symptomsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Platform.OS === 'android' ? 8 : 4,
    },
    symptomOption: {
      paddingHorizontal: Platform.OS === 'android' ? 18 : 16,
      paddingVertical: Platform.OS === 'android' ? 12 : 8,
      margin: Platform.OS === 'android' ? 2 : 4,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: Platform.OS === 'android' ? 44 : 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedSymptom: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    symptomText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      color: colors.text,
      textAlign: 'center',
    },
    selectedSymptomText: {
      color: '#FFFFFF',
    },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: Platform.OS === 'android' ? 16 : 12,
      minHeight: Platform.OS === 'android' ? 120 : 100,
      textAlignVertical: 'top',
      color: colors.text,
      backgroundColor: colors.card,
      fontSize: Platform.OS === 'android' ? 16 : 14,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: Platform.OS === 'android' ? 18 : 16,
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 32,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: Platform.OS === 'android' ? 18 : 16,
      fontWeight: '600',
    },
  });
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.dateHeader}>{formatDate(new Date(date))}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flow</Text>
        <View style={styles.flowOptions}>
          <TouchableOpacity
            style={[
              styles.flowOption,
              log.flow === 'none' && styles.selectedOption,
            ]}
            onPress={() => handleFlowChange('none')}
          >
            <Text style={styles.flowText}>None</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.flowOption,
              log.flow === 'light' && styles.selectedOption,
              { backgroundColor: log.flow === 'light' ? getFlowColor('light') : colors.card }
            ]}
            onPress={() => handleFlowChange('light')}
          >
            <Droplet size={Platform.OS === 'android' ? 20 : 16} color={colors.primary} />
            <Text style={styles.flowText}>Light</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.flowOption,
              log.flow === 'medium' && styles.selectedOption,
              { backgroundColor: log.flow === 'medium' ? getFlowColor('medium') : colors.card }
            ]}
            onPress={() => handleFlowChange('medium')}
          >
            <View style={styles.dropletRow}>
              <Droplet size={Platform.OS === 'android' ? 18 : 16} color={colors.primary} />
              <Droplet size={Platform.OS === 'android' ? 18 : 16} color={colors.primary} />
            </View>
            <Text style={styles.flowText}>Medium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.flowOption,
              log.flow === 'heavy' && styles.selectedOption,
              { backgroundColor: log.flow === 'heavy' ? getFlowColor('heavy') : colors.card }
            ]}
            onPress={() => handleFlowChange('heavy')}
          >
            <View style={styles.dropletRow}>
              <Droplet size={Platform.OS === 'android' ? 16 : 16} color={colors.primary} />
              <Droplet size={Platform.OS === 'android' ? 16 : 16} color={colors.primary} />
              <Droplet size={Platform.OS === 'android' ? 16 : 16} color={colors.primary} />
            </View>
            <Text style={styles.flowText}>Heavy</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
          <View style={styles.moodOptions}>
            {moods.map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodOption,
                  log.mood === mood.id && styles.selectedMood,
                ]}
                onPress={() => handleMoodChange(mood.id)}
              >
                <Text style={[
                  styles.moodText,
                  log.mood === mood.id && { color: '#FFFFFF' }
                ]}>
                  {mood.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        <View style={styles.symptomsContainer}>
          {symptoms.map(symptom => (
            <TouchableOpacity
              key={symptom.id}
              style={[
                styles.symptomOption,
                log.symptoms.includes(symptom.id) && styles.selectedSymptom,
              ]}
              onPress={() => handleSymptomToggle(symptom.id)}
            >
              <Text style={[
                styles.symptomText,
                log.symptoms.includes(symptom.id) && styles.selectedSymptomText,
              ]}>
                {symptom.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="Add any notes about your day..."
          placeholderTextColor={colors.subtext}
          value={log.notes}
          onChangeText={handleNotesChange}
        />
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}