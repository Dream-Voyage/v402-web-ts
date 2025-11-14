/**
 * PaymentButton Component
 *
 * Pre-built payment button component
 * Note: This is a simple wrapper. For complex payment flows,
 * use the SDK directly with usePayment hook for full control.
 */

'use client';

import React from 'react';
import {useWallet} from '../hooks/useWalletStore';
import {usePayment} from '../hooks/usePayment';
import {handlePayment} from '../../utils';

export interface PaymentButtonProps {
  endpoint: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onFinish?: () => void;
  children?: React.ReactNode;
}

/**
 * Simple pre-built payment button
 *
 * For complex payment flows, use the SDK directly:
 *
 * @example
 * ```tsx
 * import { useWallet, usePayment } from '../react';
 * import { handleSvmPayment } from '@/app/sdk';
 *
 * function CustomPayment() {
 *   const { networkType } = useWallet();
 *   const { isProcessing, setIsProcessing, setResult, setError } = usePayment();
 *
 *   const handlePay = async () => {
 *     setIsProcessing(true);
 *     try {
 *       // Your custom logic before payment
 *       const response = await handleSvmPayment(...);
 *       const data = await response.json();
 *
 *       // Your custom logic after payment
 *       setResult(data);
 *     } catch (err) {
 *       setError(err.message);
 *     } finally {
 *       setIsProcessing(false);
 *     }
 *   };
 * }
 * ```
 */
export function PaymentButton({
                                endpoint,
                                className = '',
                                disabled = false,
                                onSuccess,
                                onError,
                                onStart,
                                onFinish,
                                children = 'Pay Now',
                              }: PaymentButtonProps) {
  const {networkType} = useWallet();
  const {isProcessing, setIsProcessing, setResult, setError, error} = usePayment();

  const handleClick = async () => {
    if (!networkType) {
      const errorMsg = 'Please connect wallet first';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      onStart?.();
      setIsProcessing(true);
      setError(null);

      const result = await handlePayment(endpoint, networkType);

      setResult(result);
      onSuccess?.(result);
    } catch (err: any) {
      const errorMsg = err.message || 'Payment failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
      onFinish?.();
    }
  };

  return (
      <>
        <button
            className={`x402-pay-button ${className}`}
            onClick={handleClick}
            disabled={disabled || isProcessing || !networkType}
        >
          {isProcessing ? 'Processing...' : children}
        </button>
        {error && <p className="x402-error">{error}</p>}
      </>
  );
}

