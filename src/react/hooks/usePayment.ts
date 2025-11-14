/**
 * usePayment Hook
 *
 * React hook for payment state management
 * Provides state only - you control the payment flow
 */

import {useCallback, useState} from 'react';

export interface UsePaymentReturn {
  // State
  isProcessing: boolean;
  result: any;
  error: string | null;

  // State setters
  setIsProcessing: (value: boolean) => void;
  setResult: (value: any) => void;
  setError: (value: string | null) => void;

  // Helpers
  clearResult: () => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing payment state
 *
 * This hook only manages state - you control the payment logic.
 * Use SDK's handleSvmPayment/handleEvmPayment directly for full control.
 *
 * @example
 * ```tsx
 * import { usePayment, useWallet } from '../react';
 * import { handleSvmPayment } from '@/app/sdk';
 *
 * function PaymentButton() {
 *   const { networkType } = useWallet();
 *   const { isProcessing, setIsProcessing, result, setResult, error, setError } = usePayment();
 *
 *   const handlePay = async () => {
 *     if (!networkType) return;
 *
 *     setIsProcessing(true);
 *     setError(null);
 *
 *     try {
 *       const response = await handleSvmPayment('/api/endpoint', {
 *         wallet: window.solana,
 *         network: 'solana-devnet',
 *       });
 *
 *       const data = await response.json();
 *       setResult(data);
 *
 *       // Your custom logic here
 *       console.log('Payment success!');
 *     } catch (err: any) {
 *       setError(err.message);
 *     } finally {
 *       setIsProcessing(false);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handlePay} disabled={isProcessing}>
 *         {isProcessing ? 'Processing...' : 'Pay'}
 *       </button>
 *       {error && <p>Error: {error}</p>}
 *       {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePayment(): UsePaymentReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    result,
    error,
    setIsProcessing,
    setResult,
    setError,
    clearResult,
    clearError,
    reset,
  };
}

