import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { getCyclePhase, formatDate, predictNextPeriod, daysBetween } from '@/utils/dateUtils';
import { generateAIPredictions, getAIInsightsSummary } from '@/utils/aiPredictions';
import { InsightCard } from './insights/InsightCard';
import { StatRow } from './insights/StatRow';

export default function CycleInsights() {
  const { colors } = useTheme();
  const { profile, logs, cycles } = usePeriodStore();

  const insights = useMemo(() => {
    if (!profile.lastPeriodStart) {
      return null;
    }

    const today = new Date();
    const lastPeriodDate = new Date(profile.lastPeriodStart);
    const daysSinceLastPeriod = daysBetween(today, lastPeriodDate);

    const cyclePhase = getCyclePhase(
      profile.lastPeriodStart,
      profile.cycleAvgLength,
      profile.periodAvgLength
    );

    const nextPeriodDate = predictNextPeriod(
      profile.lastPeriodStart,
      profile.cycleAvgLength
    );

    const daysUntilNextPeriod = daysBetween(today, new Date(nextPeriodDate));

    const aiPredictions = generateAIPredictions(logs, cycles, profile);
    const aiSummary = getAIInsightsSummary(logs, cycles, profile);

    const cycleLengthPrediction = aiPredictions.find(p => p.type === 'cycle_length');
    const predictedCycleLength = cycleLengthPrediction?.prediction || profile.cycleAvgLength;

    return {
      cyclePhase,
      nextPeriodDate,
      daysUntilNextPeriod,
      daysSinceLastPeriod,
      aiPredictions,
      aiSummary,
      predictedCycleLength,
      cycleLengthPrediction,
    };
  }, [profile, logs, cycles]);

  if (!insights) {
    const styles = StyleSheet.create({
      emptyText: {
        fontSize: 16,
        color: colors.subtext,
        textAlign: 'center',
        padding: 16,
      },
    });

    return (
      <InsightCard title="Cycle Insights">
        <Text style={styles.emptyText}>
          Log your period to see cycle insights
        </Text>
      </InsightCard>
    );
  }

  const {
    cyclePhase,
    nextPeriodDate,
    daysUntilNextPeriod,
    daysSinceLastPeriod,
    aiSummary,
    predictedCycleLength,
    cycleLengthPrediction,
  } = insights;

  const getPhaseDescription = () => {
    switch (cyclePhase) {
      case 'period':
        return "You're on your period. Take care of yourself and rest if needed.";
      case 'follicular':
        return "Your body is preparing for ovulation. Energy levels are typically higher during this phase.";
      case 'ovulation':
        return "You're likely ovulating. This is your fertile window if you're trying to conceive.";
      case 'luteal':
        return "You're in the luteal phase. You might experience PMS symptoms as your period approaches.";
      default:
        return "";
    }
  };

  const getPhaseColor = () => {
    switch (cyclePhase) {
      case 'period':
        return colors.primary;
      case 'follicular':
        return colors.success;
      case 'ovulation':
        return colors.secondary;
      case 'luteal':
        return colors.warning;
      default:
        return colors.text;
    }
  };

  const getNextPeriodText = () => {
    if (daysUntilNextPeriod <= 0) {
      return 'Expected now';
    } else if (daysUntilNextPeriod === 1) {
      return 'Tomorrow';
    } else if (daysUntilNextPeriod <= 7) {
      return `In ${daysUntilNextPeriod} days`;
    } else {
      return formatDate(new Date(nextPeriodDate));
    }
  };

  const stats = [
    {
      value: cycleLengthPrediction && cycleLengthPrediction.confidence > 0.7 
        ? predictedCycleLength 
        : profile.cycleAvgLength,
      label: cycleLengthPrediction && cycleLengthPrediction.confidence > 0.7 
        ? 'Predicted Cycle' 
        : 'Avg Cycle Length'
    },
    {
      value: profile.periodAvgLength,
      label: 'Period Length'
    },
    {
      value: getNextPeriodText(),
      label: 'Next Period'
    },
    {
      value: cycles.length,
      label: 'Cycles Tracked'
    },
  ];

  const styles = StyleSheet.create({
    phaseContainer: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    phaseLabel: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 4,
    },
    phaseValue: {
      fontSize: 24,
      fontWeight: '600',
      marginBottom: 8,
      color: getPhaseColor(),
    },
    phaseDescription: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    daysSinceContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    daysSinceLabel: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 4,
    },
    daysSinceValue: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    aiInsightsContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
      marginTop: 16,
    },
    aiTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    aiSummary: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    predictionBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    predictionBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <InsightCard title="Cycle Insights">
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseLabel}>Current Phase</Text>
        <Text style={styles.phaseValue}>
          {cyclePhase.charAt(0).toUpperCase() + cyclePhase.slice(1)}
        </Text>
        <Text style={styles.phaseDescription}>{getPhaseDescription()}</Text>
      </View>

      <View style={styles.daysSinceContainer}>
        <Text style={styles.daysSinceLabel}>Days since last period</Text>
        <Text style={styles.daysSinceValue}>Day {daysSinceLastPeriod}</Text>
      </View>

      <StatRow stats={stats} />

      <View style={styles.aiInsightsContainer}>
        <Text style={styles.aiTitle}>AI Insights</Text>
        <Text style={styles.aiSummary}>{aiSummary}</Text>
        {cycleLengthPrediction && cycleLengthPrediction.confidence > 0.7 && (
          <View style={styles.predictionBadge}>
            <Text style={styles.predictionBadgeText}>
              {Math.round(cycleLengthPrediction.confidence * 100)}% confidence
            </Text>
          </View>
        )}
      </View>
    </InsightCard>
  );
}