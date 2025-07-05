import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PeriodLog, UserProfile, CycleData, FlowIntensity } from '@/types/period';
import { getTodayISO, calculateAvgCycleLength, calculateAvgPeriodLength } from '@/utils/dateUtils';
import { CYCLE_CONSTANTS } from '@/constants/app';

interface PeriodState {
  logs: PeriodLog[];
  cycles: CycleData[];
  profile: UserProfile;
  isFirstLaunch: boolean;
  
  // Actions
  addLog: (log: PeriodLog) => void;
  updateLog: (date: string, log: Partial<PeriodLog>) => void;
  deleteLog: (date: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setFirstLaunch: (value: boolean) => void;
  startPeriod: (date: string, flow: FlowIntensity) => void;
  endPeriod: (date: string) => void;
  calculateCycles: () => void;
  resetAllData: () => void;
  addHistoricalData: (periods: { startDate: string; endDate?: string; length: number }[]) => void;
}

const initialState = {
  logs: [],
  cycles: [],
  profile: {
    cycleAvgLength: CYCLE_CONSTANTS.DEFAULT_CYCLE_LENGTH,
    periodAvgLength: CYCLE_CONSTANTS.DEFAULT_PERIOD_LENGTH,
    lastPeriodStart: null,
  } as UserProfile,
  isFirstLaunch: true,
};

export const usePeriodStore = create<PeriodState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addLog: (log) => {
        try {
          set((state) => {
            const existingLogIndex = state.logs.findIndex(l => l.date === log.date);
            
            if (existingLogIndex >= 0) {
              const updatedLogs = [...state.logs];
              updatedLogs[existingLogIndex] = log;
              return { logs: updatedLogs };
            } else {
              const newLogs = [...state.logs, log];
              setTimeout(() => get().calculateCycles(), 0);
              return { logs: newLogs };
            }
          });
        } catch (error) {
          console.error('Error adding log:', error);
        }
      },
      
      updateLog: (date, partialLog) => {
        try {
          set((state) => {
            const logIndex = state.logs.findIndex(log => log.date === date);
            
            if (logIndex >= 0) {
              const updatedLogs = [...state.logs];
              updatedLogs[logIndex] = { ...updatedLogs[logIndex], ...partialLog };
              setTimeout(() => get().calculateCycles(), 0);
              return { logs: updatedLogs };
            }
            
            return state;
          });
        } catch (error) {
          console.error('Error updating log:', error);
        }
      },
      
      deleteLog: (date) => {
        try {
          set((state) => {
            const newLogs = state.logs.filter(log => log.date !== date);
            setTimeout(() => get().calculateCycles(), 0);
            return { logs: newLogs };
          });
        } catch (error) {
          console.error('Error deleting log:', error);
        }
      },
      
      updateProfile: (partialProfile) => {
        try {
          set((state) => ({
            profile: { ...state.profile, ...partialProfile }
          }));
        } catch (error) {
          console.error('Error updating profile:', error);
        }
      },
      
      setFirstLaunch: (value) => {
        try {
          set({ isFirstLaunch: value });
        } catch (error) {
          console.error('Error setting first launch:', error);
        }
      },
      
      startPeriod: (date, flow) => {
        try {
          set((state) => {
            const newLog: PeriodLog = {
              date,
              flow,
              symptoms: [],
              mood: 'neutral',
            };
            
            const updatedProfile = { ...state.profile, lastPeriodStart: date };
            
            const existingLogIndex = state.logs.findIndex(log => log.date === date);
            let updatedLogs = [...state.logs];
            
            if (existingLogIndex >= 0) {
              updatedLogs[existingLogIndex] = { ...updatedLogs[existingLogIndex], flow };
            } else {
              updatedLogs = [...updatedLogs, newLog];
            }
            
            setTimeout(() => get().calculateCycles(), 0);
            
            return {
              logs: updatedLogs,
              profile: updatedProfile
            };
          });
        } catch (error) {
          console.error('Error starting period:', error);
        }
      },
      
      endPeriod: (date) => {
        try {
          get().calculateCycles();
        } catch (error) {
          console.error('Error ending period:', error);
        }
      },
      
      addHistoricalData: (periods) => {
        try {
          set((state) => {
            const newLogs = [...state.logs];
            
            periods.forEach(period => {
              // Create logs for each day of the period - only for the exact length specified
              for (let i = 0; i < period.length; i++) {
                const logDate = new Date(period.startDate);
                logDate.setDate(logDate.getDate() + i);
                const dateStr = logDate.toISOString().split('T')[0];
                
                const existingLogIndex = newLogs.findIndex(log => log.date === dateStr);
                
                // Determine flow intensity based on day of period
                let flow: FlowIntensity = 'medium';
                if (i === 0) {
                  flow = 'light';
                } else if (i === 1 || i === 2) {
                  flow = 'medium';
                } else if (i === period.length - 1) {
                  flow = 'light';
                } else {
                  flow = 'heavy';
                }
                
                if (existingLogIndex >= 0) {
                  newLogs[existingLogIndex] = {
                    ...newLogs[existingLogIndex],
                    flow,
                  };
                } else {
                  newLogs.push({
                    date: dateStr,
                    flow,
                    symptoms: [],
                    mood: 'neutral',
                    notes: 'Historical data'
                  });
                }
              }
            });
            
            newLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const lastPeriodStart = periods.length > 0 
              ? periods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].startDate
              : state.profile.lastPeriodStart;
            
            const updatedProfile = {
              ...state.profile,
              lastPeriodStart
            };
            
            setTimeout(() => get().calculateCycles(), 100);
            
            return {
              logs: newLogs,
              profile: updatedProfile
            };
          });
        } catch (error) {
          console.error('Error adding historical data:', error);
        }
      },
      
      calculateCycles: () => {
        try {
          set((state) => {
            const { logs } = state;
            
            if (logs.length === 0) {
              return state;
            }
            
            const sortedLogs = [...logs].sort((a, b) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            
            const periodGroups: { start: string; end: string; logs: PeriodLog[] }[] = [];
            let currentGroup: { start: string; end: string; logs: PeriodLog[] } | null = null;
            
            for (let i = 0; i < sortedLogs.length; i++) {
              const log = sortedLogs[i];
              const currentDate = new Date(log.date);
              
              if (log.flow !== 'none') {
                if (!currentGroup) {
                  currentGroup = { 
                    start: log.date, 
                    end: log.date, 
                    logs: [log] 
                  };
                } else {
                  const lastDate = new Date(currentGroup.end);
                  const daysDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysDiff <= 2) {
                    currentGroup.end = log.date;
                    currentGroup.logs.push(log);
                  } else {
                    periodGroups.push(currentGroup);
                    currentGroup = { 
                      start: log.date, 
                      end: log.date, 
                      logs: [log] 
                    };
                  }
                }
              } else if (currentGroup) {
                const lastDate = new Date(currentGroup.end);
                const daysDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff > 2) {
                  periodGroups.push(currentGroup);
                  currentGroup = null;
                }
              }
            }
            
            if (currentGroup) {
              periodGroups.push(currentGroup);
            }
            
            const cycles: CycleData[] = [];
            
            // Create cycles from all consecutive period groups, with more lenient validation
            for (let i = 0; i < periodGroups.length - 1; i++) {
              const currentPeriod = periodGroups[i];
              const nextPeriod = periodGroups[i + 1];
              
              const periodLength = Math.round(
                (new Date(currentPeriod.end).getTime() - new Date(currentPeriod.start).getTime()) / 
                (1000 * 60 * 60 * 24)
              ) + 1;
              
              const cycleLength = Math.round(
                (new Date(nextPeriod.start).getTime() - new Date(currentPeriod.start).getTime()) / 
                (1000 * 60 * 60 * 24)
              );
              
              // More lenient validation - accept wider range of cycle lengths
              if (cycleLength >= 15 && cycleLength <= 60 && periodLength >= 1 && periodLength <= 15) {
                cycles.push({
                  startDate: currentPeriod.start,
                  endDate: nextPeriod.start,
                  length: cycleLength,
                  periodLength,
                });
              }
            }
            
            // Calculate averages from actual data, not defaults
            let cycleAvgLength = CYCLE_CONSTANTS.DEFAULT_CYCLE_LENGTH;
            let periodAvgLength = CYCLE_CONSTANTS.DEFAULT_PERIOD_LENGTH;
            
            // First priority: use calculated cycles
            if (cycles.length > 0) {
              const cycleLengths = cycles.map(c => c.length);
              cycleAvgLength = Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length);
              
              const periodLengths = cycles.map(c => c.periodLength);
              periodAvgLength = Math.round(periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length);
            } 
            // Second priority: calculate from period groups even if cycles are incomplete
            else if (periodGroups.length > 0) {
              // Calculate period lengths from all period groups
              const periodLengths = periodGroups.map(group => {
                return Math.round(
                  (new Date(group.end).getTime() - new Date(group.start).getTime()) / 
                  (1000 * 60 * 60 * 24)
                ) + 1;
              }).filter(len => len >= 1 && len <= 15);
              
              if (periodLengths.length > 0) {
                periodAvgLength = Math.round(periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length);
              }
              
              // Try to estimate cycle length from period spacing
              if (periodGroups.length >= 2) {
                const cycleLengths: number[] = [];
                for (let i = 0; i < periodGroups.length - 1; i++) {
                  const cycleLength = Math.round(
                    (new Date(periodGroups[i + 1].start).getTime() - new Date(periodGroups[i].start).getTime()) / 
                    (1000 * 60 * 60 * 24)
                  );
                  if (cycleLength >= 15 && cycleLength <= 60) {
                    cycleLengths.push(cycleLength);
                  }
                }
                
                if (cycleLengths.length > 0) {
                  cycleAvgLength = Math.round(cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length);
                }
              }
            }
            
            // Ensure calculated values are within reasonable bounds
            cycleAvgLength = Math.max(CYCLE_CONSTANTS.MIN_CYCLE_LENGTH, 
              Math.min(CYCLE_CONSTANTS.MAX_CYCLE_LENGTH, cycleAvgLength));
            periodAvgLength = Math.max(CYCLE_CONSTANTS.MIN_PERIOD_LENGTH, 
              Math.min(CYCLE_CONSTANTS.MAX_PERIOD_LENGTH, periodAvgLength));
            
            const updatedProfile: UserProfile = {
              ...state.profile,
              cycleAvgLength,
              periodAvgLength,
            };
            
            console.log('Calculated cycles:', cycles.length);
            console.log('Period groups found:', periodGroups.length);
            console.log('Average cycle length:', cycleAvgLength);
            console.log('Average period length:', periodAvgLength);
            
            return {
              cycles,
              profile: updatedProfile,
            };
          });
        } catch (error) {
          console.error('Error calculating cycles:', error);
        }
      },
      
      resetAllData: () => {
        try {
          set(initialState);
        } catch (error) {
          console.error('Error resetting data:', error);
        }
      },
    }),
    {
      name: 'period-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate cycles after rehydration
          setTimeout(() => state.calculateCycles(), 100);
        }
      },
    }
  )
);