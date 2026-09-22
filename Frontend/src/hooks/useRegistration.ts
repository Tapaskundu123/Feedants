import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { competitionApi } from '../api/client';

interface UseRegistrationResult {
  registering: boolean;
  error: string | null;
  register: (competitionId: string, referralCode?: string) => Promise<boolean>;
  clearError: () => void;
}

// In a real app this would call Razorpay SDK before registering
const mockPaymentFlow = async (_entryFee: number): Promise<string> => {
  // Simulate 1s payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return `pay_mock_${Date.now()}`;
};

export const useRegistration = (entryFee: number = 0): UseRegistrationResult => {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (competitionId: string, referralCode = ''): Promise<boolean> => {
      setRegistering(true);
      setError(null);
      try {
        // Step 1: Payment (if entry fee > 0)
        let paymentId = 'free_entry';
        if (entryFee > 0) {
          paymentId = await mockPaymentFlow(entryFee);
        }

        // Step 2: Register via API
        await competitionApi.register(competitionId, { paymentId, referralCode });
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        return false;
      } finally {
        setRegistering(false);
      }
    },
    [entryFee]
  );

  const clearError = useCallback(() => setError(null), []);

  return { registering, error, register, clearError };
};

// ─── Auth hook ────────────────────────────────────────────────
export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const t = await AsyncStorage.getItem('auth_token');
    setToken(t);
    return t;
  }, []);

  const saveToken = useCallback(async (t: string) => {
    await AsyncStorage.setItem('auth_token', t);
    setToken(t);
  }, []);

  const clearToken = useCallback(async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
  }, []);

  return { token, getToken, saveToken, clearToken };
};
