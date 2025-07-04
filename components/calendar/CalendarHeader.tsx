import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

interface CalendarHeaderProps {
  currentMonth: number;
  currentYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = memo(({
  currentMonth,
  currentYear,
  onPreviousMonth,
  onNextMonth,
}) => {
  const { colors } = useTheme();

  const monthTitle = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
    },
    monthTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={onPreviousMonth}
        accessibilityLabel="Previous month"
        accessibilityRole="button"
      >
        <ChevronLeft size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.monthTitle}>{monthTitle}</Text>

      <TouchableOpacity
        style={styles.navButton}
        onPress={onNextMonth}
        accessibilityLabel="Next month"
        accessibilityRole="button"
      >
        <ChevronRight size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
});