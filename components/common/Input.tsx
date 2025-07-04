import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ValidationResult } from '@/types/ui';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  validate?: (value: string) => ValidationResult;
  onValidation?: (result: ValidationResult) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  validate,
  onValidation,
  onChangeText,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [localError, setLocalError] = useState<string>();

  const handleChangeText = (text: string) => {
    if (validate) {
      const result = validate(text);
      setLocalError(result.isValid ? undefined : result.error);
      onValidation?.(result);
    }
    onChangeText?.(text);
  };

  const displayError = error || localError;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: displayError ? colors.error : colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    error: {
      fontSize: 14,
      color: colors.error,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        onChangeText={handleChangeText}
        placeholderTextColor={colors.subtext}
        {...props}
      />
      {displayError && <Text style={styles.error}>{displayError}</Text>}
    </View>
  );
};