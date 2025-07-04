import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface StatItem {
  value: string | number;
  label: string;
}

interface StatRowProps {
  stats: StatItem[];
}

export const StatRow: React.FC<StatRowProps> = memo(({ stats }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 14,
      color: colors.subtext,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
});