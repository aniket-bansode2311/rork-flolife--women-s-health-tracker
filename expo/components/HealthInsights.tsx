import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { ChevronRight } from 'lucide-react-native';

export default function HealthInsights({ onViewDetails }: { onViewDetails: () => void }) {
  const { colors } = useTheme();
  const { logs } = usePeriodStore();
  
  // Calculate some basic insights
  const totalLogs = logs.length;
  const symptomsTracked = logs.reduce((count, log) => count + log.symptoms.length, 0);
  
  // Get most common symptoms
  const symptomCounts: Record<string, number> = {};
  logs.forEach(log => {
    log.symptoms.forEach(symptom => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    });
  });
  
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ id, count }));
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    viewAll: {
      fontSize: 14,
      color: colors.secondary,
    },
    emptyText: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      padding: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.subtext,
    },
    symptomsContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    symptomItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    symptomName: {
      fontSize: 14,
      color: colors.text,
      textTransform: 'capitalize',
    },
    symptomCount: {
      fontSize: 14,
      color: colors.subtext,
    },
    viewDetailsButton: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewDetailsText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginRight: 8,
    },
  });
  
  if (totalLogs === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Health Insights</Text>
        <Text style={styles.emptyText}>
          Start logging your period and symptoms to see health insights
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Insights</Text>
        <TouchableOpacity onPress={onViewDetails}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalLogs}</Text>
          <Text style={styles.statLabel}>Days Logged</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{symptomsTracked}</Text>
          <Text style={styles.statLabel}>Symptoms Tracked</Text>
        </View>
      </View>
      
      {topSymptoms.length > 0 && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.sectionTitle}>Top Symptoms</Text>
          
          {topSymptoms.map((symptom, index) => (
            <View key={symptom.id} style={styles.symptomItem}>
              <Text style={styles.symptomName}>{symptom.id.replace('_', ' ')}</Text>
              <Text style={styles.symptomCount}>{symptom.count} times</Text>
            </View>
          ))}
        </View>
      )}
      
      <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
        <Text style={styles.viewDetailsText}>View Detailed Analysis</Text>
        <ChevronRight size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}