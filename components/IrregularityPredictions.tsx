import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { predictCycleIrregularities, getPredictionAccuracy } from '@/utils/mlPredictions';
import { AlertTriangle, Info } from 'lucide-react-native';

export default function IrregularityPredictions() {
  const { colors } = useTheme();
  const { logs, cycles } = usePeriodStore();
  
  // Get predictions and accuracy
  const predictions = predictCycleIrregularities(logs, cycles);
  const accuracy = getPredictionAccuracy(logs, cycles);
  const accuracyPercentage = Math.round(accuracy * 100);
  
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
    subtitle: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 12,
    },
    emptyState: {
      alignItems: 'center',
      padding: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      marginBottom: 16,
    },
    progressContainer: {
      width: '100%',
      marginTop: 8,
    },
    progressText: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.secondary,
    },
    regularCycle: {
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      alignItems: 'center',
    },
    regularText: {
      fontSize: 14,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    accuracyText: {
      fontSize: 12,
      color: colors.subtext,
    },
    accuracyBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    accuracyBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    predictionCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    predictionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    predictionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    confidenceBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    confidenceText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
    predictionReason: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    suggestedAction: {
      fontSize: 14,
      color: colors.subtext,
      fontStyle: 'italic',
    },
    disclaimer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      padding: 12,
      backgroundColor: 'rgba(0,0,0,0.03)',
      borderRadius: 8,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.subtext,
      marginLeft: 8,
      flex: 1,
    },
  });
  
  // If no predictions or not enough data, show appropriate message
  if (predictions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Cycle Analysis</Text>
          <Info size={18} color={colors.subtext} />
        </View>
        
        {logs.length < 10 || cycles.length < 3 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Keep logging your cycle data. Our ML model needs at least 3 cycles and 10 logs to provide accurate predictions.
            </Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Data collection: {Math.min(Math.round((logs.length / 10) * 100), 100)}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(Math.round((logs.length / 10) * 100), 100)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.regularCycle}>
            <Text style={styles.regularText}>
              No irregularities detected. Your cycle appears to be regular based on your logged data.
            </Text>
            <Text style={styles.accuracyText}>
              Prediction accuracy: {accuracyPercentage}%
            </Text>
          </View>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cycle Analysis</Text>
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyBadgeText}>{accuracyPercentage}% accuracy</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>
        Our ML model has detected potential irregularities:
      </Text>
      
      {predictions.map((prediction, index) => (
        <View key={index} style={styles.predictionCard}>
          <View style={styles.predictionHeader}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.predictionTitle}>
              Potential Irregularity Detected
            </Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(prediction.confidence * 100)}%
              </Text>
            </View>
          </View>
          
          <Text style={styles.predictionReason}>
            {prediction.reason}
          </Text>
          
          {prediction.suggestedAction && (
            <Text style={styles.suggestedAction}>
              Suggestion: {prediction.suggestedAction}
            </Text>
          )}
        </View>
      ))}
      
      <View style={styles.disclaimer}>
        <Info size={16} color={colors.subtext} />
        <Text style={styles.disclaimerText}>
          These predictions are based on your logged data and should not replace professional medical advice.
        </Text>
      </View>
    </View>
  );
}