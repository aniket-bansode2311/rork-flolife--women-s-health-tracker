import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface StatRowProps {
  label: string;
  value: string;
  icon?: string;
}

export const StatRow: React.FC<StatRowProps> = memo(({ label, value, icon }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    label: {
      fontSize: 14,
      color: colors.subtext,
      flex: 1,
    },
    value: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
});