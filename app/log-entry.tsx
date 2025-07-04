import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import LogEntryForm from '@/components/LogEntryForm';
import { useTheme } from '@/hooks/useTheme';
import { getTodayISO } from '@/utils/dateUtils';

export default function LogEntryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const entryDate = date || getTodayISO();
  
  const handleSave = () => {
    router.back();
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Log Entry',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: '600',
            color: colors.text,
          },
        }} 
      />
      
      <LogEntryForm date={entryDate} onSave={handleSave} />
    </View>
  );
}