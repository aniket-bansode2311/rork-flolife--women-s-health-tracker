import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CyclixLogoProps {
  size?: number;
  showText?: boolean;
}

export default function CyclixLogo({ size = 32, showText = false }: CyclixLogoProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoIcon: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: showText ? 8 : 0,
    },
    logoText: {
      fontSize: size * 0.4,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    appName: {
      fontSize: size * 0.6,
      fontWeight: '600',
      color: colors.text,
    },
    cyclixContainer: {
      position: 'relative',
    },
    cyclixDot: {
      position: 'absolute',
      width: size * 0.15,
      height: size * 0.15,
      borderRadius: size * 0.075,
      backgroundColor: colors.secondary,
      top: size * 0.2,
      right: size * 0.2,
    },
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.cyclixContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <View style={styles.cyclixDot} />
      </View>
      {showText && (
        <Text style={styles.appName}>Cyclix</Text>
      )}
    </View>
  );
}