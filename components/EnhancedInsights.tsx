import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { predictCycleIrregularities, getPredictionAccuracy } from '@/utils/mlPredictions';
import { generateEnhancedPrediction } from '@/utils/enhancedPredictions';
import { InsightCard } from './insights/InsightCard';
import { StatRow } from './insights/StatRow';
import CycleChart from './charts/CycleChart';
import { formatDate } from '@/utils/dateUtils';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

type ChartType = 'cycle-length' | 'period-length' | 'symptoms' | 'mood';

export default function EnhancedInsights() {
  const { colors } = useTheme();
  const { logs, cycles, profile } = usePeriodStore();
  const [selectedChart, setSelectedChart] = useState<ChartType>('cycle-length');
  const [showCharts, setShowCharts] = useState(true);
  
  const predictions = predictCycleIrregularities(logs, cycles);
  const accuracy = getPredictionAccuracy(logs, cycles);
  const enhancedPrediction = generateEnhancedPrediction(logs, cycles, profile);
  
  const chartOptions: { type: ChartType; label: string; icon: string }[] = [
    { type: 'cycle-length', label: 'Cycle Length', icon: 'calendar' },
    { type: 'period-length', label: 'Period Length', icon: 'droplet' },
    { type: 'symptoms', label: 'Symptoms', icon: 'activity' },
    { type: 'mood', label: 'Mood', icon: 'heart' },
  ];
  
  const styles = StyleSheet.create({
    container: {
      gap: 16,
    },
    header: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 16,
    },
    statsContainer: {
      gap: 8,
    },
    chartsSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    toggleText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    chartSelector: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 8,
    },
    chartOption: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    chartOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chartOptionText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    chartOptionTextActive: {
      color: colors.card,
    },
    predictionsContainer: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    noPredictions: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    noPredictionsText: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
    },
    enhancedStats: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    phaseIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    phaseText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    confidenceText: {
      fontSize: 12,
      color: colors.subtext,
    },
  });
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Cycle Insights</Text>
        <Text style={styles.subtitle}>
          AI-powered analysis of your menstrual health patterns
        </Text>
        
        <View style={styles.statsContainer}>
          <StatRow 
            label="Average Cycle Length" 
            value={`${profile.cycleAvgLength} days`}
            icon="calendar"
          />
          <StatRow 
            label="Average Period Length" 
            value={`${profile.periodAvgLength} days`}
            icon="droplet"
          />
          <StatRow 
            label="Total Cycles Tracked" 
            value={cycles.length.toString()}
            icon="trending-up"
          />
          <StatRow 
            label="Prediction Accuracy" 
            value={`${Math.round(accuracy * 100)}%`}
            icon="target"
          />
          {enhancedPrediction && (
            <StatRow 
              label="Next Period Expected" 
              value={formatDate(new Date(enhancedPrediction.nextPeriodDate))}
              icon="clock"
            />
          )}
        </View>
        
        {enhancedPrediction && (
          <View style={styles.enhancedStats}>
            <View style={styles.phaseIndicator}>
              <Text style={styles.phaseText}>
                Current Phase: {enhancedPrediction.cyclePhase.charAt(0).toUpperCase() + enhancedPrediction.cyclePhase.slice(1)}
              </Text>
              <Text style={styles.confidenceText}>
                {Math.round(enhancedPrediction.confidence * 100)}% confidence
              </Text>
            </View>
            <StatRow 
              label="Irregularity Score" 
              value={`${Math.round(enhancedPrediction.irregularityScore * 100)}%`}
              icon="activity"
            />
            <StatRow 
              label="Fertile Window" 
              value={`${formatDate(new Date(enhancedPrediction.fertileWindow.start))} - ${formatDate(new Date(enhancedPrediction.fertileWindow.end))}`}
              icon="heart"
            />
          </View>
        )}
      </View>
      
      {/* Charts Section */}
      <View style={styles.chartsSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Data Visualization</Text>
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowCharts(!showCharts)}
          >
            <Text style={styles.toggleText}>
              {showCharts ? 'Hide' : 'Show'}
            </Text>
            {showCharts ? (
              <ChevronUp size={16} color={colors.primary} />
            ) : (
              <ChevronDown size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        
        {showCharts && (
          <>
            <View style={styles.chartSelector}>
              {chartOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.chartOption,
                    selectedChart === option.type && styles.chartOptionActive,
                  ]}
                  onPress={() => setSelectedChart(option.type)}
                >
                  <Text style={[
                    styles.chartOptionText,
                    selectedChart === option.type && styles.chartOptionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <CycleChart 
              cycles={cycles}
              logs={logs}
              type={selectedChart}
            />
          </>
        )}
      </View>
      
      {/* Health Predictions */}
      <View>
        <Text style={styles.sectionTitle}>Health Predictions</Text>
        
        {predictions.length > 0 ? (
          <View style={styles.predictionsContainer}>
            {predictions.map((prediction, index) => (
              <InsightCard
                key={index}
                title={prediction.reason}
                description={prediction.suggestedAction || 'Continue monitoring your cycle'}
                severity={prediction.severity}
                confidence={prediction.confidence}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noPredictions}>
            <Text style={styles.noPredictionsText}>
              Your cycle appears regular! Keep tracking to maintain insights.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}