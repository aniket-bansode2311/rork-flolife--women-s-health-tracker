import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Platform } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '@/hooks/useTheme';
import { CycleData, PeriodLog } from '@/types/period';
import { formatDate } from '@/utils/dateUtils';

const screenWidth = Dimensions.get('window').width;

interface CycleChartProps {
  cycles: CycleData[];
  logs: PeriodLog[];
  type: 'cycle-length' | 'period-length' | 'symptoms' | 'mood';
}

export default function CycleChart({ cycles, logs, type }: CycleChartProps) {
  const { colors, isDark } = useTheme();

  // Chart configuration
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: colors.border,
      strokeWidth: 1,
    },
  };

  // Prepare data based on chart type
  const chartData = useMemo(() => {
    switch (type) {
      case 'cycle-length':
        return prepareCycleLengthData();
      case 'period-length':
        return preparePeriodLengthData();
      case 'symptoms':
        return prepareSymptomData();
      case 'mood':
        return prepareMoodData();
      default:
        return null;
    }
  }, [cycles, logs, type]);

  function prepareCycleLengthData() {
    if (cycles.length === 0) return null;

    const recentCycles = cycles.slice(-12); // Last 12 cycles
    const labels = recentCycles.map((_, index) => `C${index + 1}`);
    const data = recentCycles.map(cycle => cycle.length);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
      }],
    };
  }

  function preparePeriodLengthData() {
    if (cycles.length === 0) return null;

    const recentCycles = cycles.slice(-12);
    const labels = recentCycles.map((_, index) => `C${index + 1}`);
    const data = recentCycles.map(cycle => cycle.periodLength);

    return {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => colors.secondary,
        strokeWidth: 2,
      }],
    };
  }

  function prepareSymptomData() {
    if (logs.length === 0) return null;

    // Count symptom frequency over the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentLogs = logs.filter(log => 
      new Date(log.date) >= threeMonthsAgo
    );

    const symptomCounts: Record<string, number> = {};
    recentLogs.forEach(log => {
      log.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });

    // Get top 6 symptoms
    const sortedSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    if (sortedSymptoms.length === 0) return null;

    const colors = [
      '#FF6B8A', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
    ];

    return sortedSymptoms.map(([symptom, count], index) => ({
      name: symptom.replace('_', ' ').toUpperCase(),
      population: count,
      color: colors[index % colors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }

  function prepareMoodData() {
    if (logs.length === 0) return null;

    // Count mood frequency over the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentLogs = logs.filter(log => 
      new Date(log.date) >= oneMonthAgo && log.mood
    );

    const moodCounts: Record<string, number> = {};
    recentLogs.forEach(log => {
      if (log.mood) {
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      }
    });

    if (Object.keys(moodCounts).length === 0) return null;

    const moodColors: Record<string, string> = {
      happy: '#4ECDC4',
      neutral: '#95A5A6',
      sad: '#3498DB',
      irritated: '#E74C3C',
      anxious: '#9B59B6',
      energetic: '#F39C12',
      tired: '#34495E',
    };

    return Object.entries(moodCounts).map(([mood, count]) => ({
      name: mood.toUpperCase(),
      population: count,
      color: moodColors[mood] || '#BDC3C7',
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }

  const renderChart = () => {
    if (!chartData) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Not enough data to display chart
          </Text>
        </View>
      );
    }

    // Web fallback for charts
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webFallback}>
          <Text style={[styles.webFallbackText, { color: colors.text }]}>
            Charts are not available on web. Please use the mobile app for full chart functionality.
          </Text>
        </View>
      );
    }

    switch (type) {
      case 'cycle-length':
      case 'period-length':
        return (
          <LineChart
            data={chartData as any}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={false}
          />
        );

      case 'symptoms':
      case 'mood':
        return (
          <PieChart
            data={chartData as any}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            absolute
            style={styles.chart}
          />
        );

      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case 'cycle-length':
        return 'Cycle Length Trends';
      case 'period-length':
        return 'Period Length Trends';
      case 'symptoms':
        return 'Symptom Frequency (Last 3 Months)';
      case 'mood':
        return 'Mood Distribution (Last Month)';
      default:
        return 'Chart';
    }
  };

  const getChartDescription = () => {
    switch (type) {
      case 'cycle-length':
        return 'Track how your cycle length changes over time';
      case 'period-length':
        return 'Monitor your period duration patterns';
      case 'symptoms':
        return 'See which symptoms occur most frequently';
      case 'mood':
        return 'Understand your emotional patterns';
      default:
        return '';
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: colors.subtext,
    },
    chart: {
      borderRadius: 16,
    },
    emptyState: {
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
    },
    webFallback: {
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
    },
    webFallbackText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getChartTitle()}</Text>
        <Text style={styles.description}>{getChartDescription()}</Text>
      </View>
      {renderChart()}
    </View>
  );
}