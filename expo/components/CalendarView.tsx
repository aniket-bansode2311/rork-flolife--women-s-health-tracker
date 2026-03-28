import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePeriodStore } from '@/store/periodStore';
import { useTheme } from '@/hooks/useTheme';
import { getMonthDates, getTodayISO, predictNextPeriod, isDateInFertileWindow } from '@/utils/dateUtils';
import { generateEnhancedPrediction, predictFutureCycles } from '@/utils/enhancedPredictions';
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
  
  const { logs, cycles, profile } = usePeriodStore();
  
  // Enhanced predictions for better accuracy
  const { nextPeriodStart, futurePredictions, enhancedPrediction } = useMemo(() => {
    const enhanced = generateEnhancedPrediction(logs, cycles, profile);
    const nextPeriod = enhanced?.nextPeriodDate || (
      profile.lastPeriodStart 
        ? predictNextPeriod(profile.lastPeriodStart, profile.cycleAvgLength)
        : null
    );
    
    const future = profile.lastPeriodStart 
      ? predictFutureCycles(cycles, profile, 3)
      : [];
      
    return {
      nextPeriodStart: nextPeriod,
      futurePredictions: future,
      enhancedPrediction: enhanced,
    };
  }, [profile.lastPeriodStart, profile.cycleAvgLength, logs, cycles]);
  
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
      
      // Check predicted periods (including future cycles)
      let isPredictedPeriod = false;
      let predictionConfidence = 0;
      
      // Check current prediction
      if (nextPeriodStart) {
        const nextPeriodDate = new Date(nextPeriodStart);
        for (let i = 0; i < profile.periodAvgLength; i++) {
          const periodDay = new Date(nextPeriodDate);
          periodDay.setDate(nextPeriodDate.getDate() + i);
          
          if (date.toDateString() === periodDay.toDateString()) {
            isPredictedPeriod = true;
            predictionConfidence = enhancedPrediction?.confidence || 0.7;
            break;
          }
        }
      }
      
      // Check future predictions
      if (!isPredictedPeriod && futurePredictions.length > 0) {
        for (const prediction of futurePredictions) {
          const startDate = new Date(prediction.startDate);
          const endDate = new Date(prediction.endDate);
          
          if (date >= startDate && date <= endDate) {
            isPredictedPeriod = true;
            predictionConfidence = prediction.confidence;
            break;
          }
        }
      }
      
      // Check fertile day using enhanced calculation
      let isFertileDay = false;
      let isOvulationDay = false;
      
      if (enhancedPrediction) {
        const dateStr = date.toISOString().split('T')[0];
        const fertileWindow = enhancedPrediction.fertileWindow;
        
        isFertileDay = dateStr >= fertileWindow.start && dateStr <= fertileWindow.end;
        isOvulationDay = dateStr === fertileWindow.ovulationDate;
      } else if (profile.lastPeriodStart) {
        isFertileDay = isDateInFertileWindow(date, profile.lastPeriodStart, profile.cycleAvgLength);
      }
      
      // Check future fertile windows
      if (!isFertileDay && futurePredictions.length > 0) {
        const dateStr = date.toISOString().split('T')[0];
        for (const prediction of futurePredictions) {
          const fertileWindow = prediction.fertileWindow;
          if (dateStr >= fertileWindow.start && dateStr <= fertileWindow.end) {
            isFertileDay = true;
            if (dateStr === fertileWindow.ovulationDate) {
              isOvulationDay = true;
            }
            break;
          }
        }
      }
      
      return {
        date,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: isoDate === selectedDate,
        isPeriodDay: !!isPeriodDay,
        isPredictedPeriod,
        isFertileDay,
        isOvulationDay,
        predictionConfidence,
      };
    });
  }, [currentYear, currentMonth, logs, selectedDate, nextPeriodStart, profile.periodAvgLength, profile.lastPeriodStart, profile.cycleAvgLength, futurePredictions, enhancedPrediction]);
  
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