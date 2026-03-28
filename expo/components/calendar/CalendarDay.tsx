import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { CalendarDate } from '@/types/ui';

interface CalendarDayProps {
  calendarDate: CalendarDate;
  onPress: (date: Date) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = memo(({
  calendarDate,
  onPress,
}) => {
  const { colors } = useTheme();
  const { date, isCurrentMonth, isToday, isSelected, isPeriodDay, isPredictedPeriod, isFertileDay } = calendarDate;

  const getDayStyle = () => {
    const baseStyle = { ...styles.day };

    if (!isCurrentMonth) {
      return { ...baseStyle, ...styles.otherMonth };
    }

    if (isToday) {
      return { ...baseStyle, ...styles.today };
    }

    if (isSelected) {
      return { ...baseStyle, ...styles.selected };
    }

    return baseStyle;
  };

  const getDayContentStyle = () => {
    if (isPeriodDay) {
      return { ...styles.dayContent, backgroundColor: colors.primary };
    }

    if (isPredictedPeriod) {
      return { ...styles.dayContent, backgroundColor: colors.primary, opacity: 0.5 };
    }

    if (isFertileDay) {
      return { ...styles.dayContent, backgroundColor: colors.secondary, opacity: 0.5 };
    }

    return styles.dayContent;
  };

  const getDayTextStyle = () => {
    const baseStyle = { ...styles.dayText };

    if (!isCurrentMonth) {
      return { ...baseStyle, color: colors.subtext, opacity: 0.4 };
    }

    if (isToday) {
      return { ...baseStyle, color: colors.primary, fontWeight: '600' };
    }

    if (isSelected) {
      return { ...baseStyle, color: '#FFFFFF', fontWeight: '600' };
    }

    if (isPeriodDay || (isPredictedPeriod && isPredictedPeriod)) {
      return { ...baseStyle, color: '#FFFFFF', fontWeight: '600' };
    }

    return { ...baseStyle, color: colors.text };
  };

  const styles = StyleSheet.create({
    day: {
      width: '14.28%',
      height: Platform.OS === 'android' ? 48 : 44,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 2,
    },
    dayContent: {
      width: Platform.OS === 'android' ? 36 : 32,
      height: Platform.OS === 'android' ? 36 : 32,
      borderRadius: Platform.OS === 'android' ? 18 : 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayText: {
      fontSize: Platform.OS === 'android' ? 16 : 14,
      fontWeight: '500',
      textAlign: 'center',
    },
    today: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: Platform.OS === 'android' ? 18 : 16,
    },
    selected: {
      backgroundColor: colors.secondary,
      borderRadius: Platform.OS === 'android' ? 18 : 16,
    },
    otherMonth: {
      opacity: 0.4,
    },
  });

  return (
    <TouchableOpacity
      style={getDayStyle()}
      onPress={() => onPress(date)}
      accessibilityLabel={`${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })}`}
      accessibilityRole="button"
    >
      <View style={getDayContentStyle()}>
        <Text style={getDayTextStyle()}>
          {date.getDate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
});