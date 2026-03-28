import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface InsightCardProps {
  title: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  confidence?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const InsightCard: React.FC<InsightCardProps> = memo(({
  title,
  description,
  severity = 'medium',
  confidence,
  children,
  style,
}) => {
  const { colors } = useTheme();

  const getSeverityColor = () => {
    switch (severity) {
      case 'low':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: getSeverityColor(),
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: description ? 8 : 0,
    },
    description: {
      fontSize: 14,
      color: colors.subtext,
      lineHeight: 20,
      marginBottom: confidence ? 8 : 0,
    },
    confidence: {
      fontSize: 12,
      color: colors.subtext,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {confidence && (
        <Text style={styles.confidence}>
          Confidence: {Math.round(confidence * 100)}%
        </Text>
      )}
      {children}
    </View>
  );
});