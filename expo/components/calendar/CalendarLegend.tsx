import React, { memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export const CalendarLegend: React.FC = memo(() => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    legend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexWrap: 'wrap',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Platform.OS === 'android' ? 8 : 4,
      minWidth: '30%',
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 6,
    },
    legendText: {
      fontSize: Platform.OS === 'android' ? 13 : 12,
      color: colors.subtext,
      flexShrink: 1,
    },
  });

  const legendItems = [
    { color: colors.primary, label: 'Period' },
    { color: colors.primary, label: 'Predicted', opacity: 0.5 },
    { color: colors.secondary, label: 'Fertile' },
  ];

  return (
    <View style={styles.legend}>
      {legendItems.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: item.color,
                opacity: item.opacity || 1,
              },
            ]}
          />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
});