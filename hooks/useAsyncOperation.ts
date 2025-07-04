import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface AsyncOperationState {
  isLoading: boolean;
  data: any;
}

export const useAsyncOperation = <T = any>() => {
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    data: null,
  });
  
  const { handleError } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await operation();
      setState({ isLoading: false, data: result });
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      if (onError) {
        onError(error as Error);
      } else {
        handleError(error as Error);
      }
      
      throw error;
    }
  }, [handleError]);

  return {
    ...state,
    execute,
  };
};