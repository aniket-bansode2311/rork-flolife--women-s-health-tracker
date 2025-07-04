import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { getMonthDates, getTodayISO, predictNextPeriod, isDateInFertileWindow } from '@/utils/dateUtils';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarDay } from './calendar/CalendarDay';
import { CalendarLegend } from './calendar/CalendarLegend';
import { CalendarDate } from '@/types/ui';
import { UI_CONSTANTS } from '@/constants/app';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarViewProps {
  onSelectDate: (date: string) => void;
}

export default function CalendarView({ onSelectDate }: CalendarViewProps) {
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  
  const { logs, profile } = usePeriodStore();
  
  // Memoized calculations for better performance
  const { nextPeriodStart } = useMemo(() => {
    const nextPeriod = profile.lastPeriodStart 
      ? predictNextPeriod(profile.lastPeriodStart, profile.cycleAvgLength)
      : null;
      
    return {
      nextPeriodStart: nextPeriod,
    };
  }, [profile.lastPeriodStart, profile.cycleAvgLength]);
  
  // Memoized calendar dates
  const calendarDates = useMemo(() => {
    const dates = getMonthDates(currentYear, currentMonth);
    
    return dates.map((date): CalendarDate => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      
      const log = logs.find(log => log.date === isoDate);
      const isPeriodDay = log && log.flow !== 'none';
      
      // Check predicted period
      let isPredictedPeriod = false;
      if (nextPeriodStart) {
        const nextPeriodDate = new Date(nextPeriodStart);
        for (let i = 0; i < profile.periodAvgLength; i++) {
          const periodDay = new Date(nextPeriodDate);
          periodDay.setDate(nextPeriodDate.getDate() + i);
          
          if (date.toDateString() === periodDay.toDateString()) {
            isPredictedPeriod = true;
            break;
          }
        }
      }
      
      // Check fertile day using enhanced calculation
      let isFertileDay = false;
      if (profile.lastPeriodStart) {
        isFertileDay = isDateInFertileWindow(date, profile.lastPeriodStart, profile.cycleAvgLength);
      }
      
      return {
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: isoDate === selectedDate,
        isPeriodDay: !!isPeriodDay,
        isPredictedPeriod,
        isFertileDay,
      };
    });
  }, [currentYear, currentMonth, logs, selectedDate, nextPeriodStart, profile.periodAvgLength, profile.lastPeriodStart, profile.cycleAvgLength]);
  
  const handlePreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }, [currentMonth, currentYear]);
  
  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }, [currentMonth, currentYear]);
  
  const handleDateSelect = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    
    setSelectedDate(isoDate);
    onSelectDate(isoDate);
  }, [onSelectDate]);
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    weekdays: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      color: colors.subtext,
      fontSize: 14,
      fontWeight: '500',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
  });
  
  return (
    <View style={styles.container}>
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
      />
      
      <View style={styles.weekdays}>
        {DAYS_OF_WEEK.map(day => (
          <Text key={day} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.daysGrid}>
        {calendarDates.map((calendarDate, index) => (
          <CalendarDay
            key={index}
            calendarDate={calendarDate}
            onPress={handleDateSelect}
          />
        ))}
      </View>
      
      <CalendarLegend />
    </View>
  );
}