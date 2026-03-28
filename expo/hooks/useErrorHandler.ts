import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ErrorState {
  error: string | null;
  isError: boolean;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  });

  const handleError = useCallback((error: Error | string, showAlert = true) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    setErrorState({
      error: errorMessage,
      isError: true,
    });

    if (showAlert) {
      Alert.alert('Error', errorMessage);
    }

    // Log error for debugging
    console.error('Error handled:', errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    });
  }, []);

  return {
    ...errorState,
    handleError,
    clearError,
  };
};