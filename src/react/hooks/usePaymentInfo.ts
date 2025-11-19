/**
 * usePaymentInfo Hook
 *
 * React hook for fetching payment information from endpoint
 */

import {useEffect, useState} from 'react';
import type {PaymentRequirements} from 'x402/types';
import {NetworkType} from '../../types';
import {getSupportedNetworkTypes, parsePaymentRequired} from '../../utils';
import {PROD_BACK_URL} from "../../types/common";

export interface UsePaymentInfoReturn {
    // State
    paymentInfo: PaymentRequirements[] | null;
    supportedNetworks: NetworkType[];
    isLoading: boolean;
    error: string | null;

    // Actions
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching payment information
 *
 * @param endpoint - API endpoint to fetch payment info from
 * @param merchantId - @see our website to apply
 *
 * @example
 * ```tsx
 * function PaymentInfo() {
 *   const { paymentInfo, supportedNetworks, isLoading } = usePaymentInfo('/api/protected');
 *
 *   if (isLoading) return <p>Loading...</p>;
 *
 *   return (
 *     <div>
 *       <p>Supported networks:</p>
 *       {supportedNetworks.map(net => <span key={net}>{net}</span>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePaymentInfo(merchantId: string, endpoint: string = PROD_BACK_URL): UsePaymentInfoReturn {
    const [paymentInfo, setPaymentInfo] = useState<PaymentRequirements[] | null>(null);
    const [supportedNetworks, setSupportedNetworks] = useState<NetworkType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPaymentInfo = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 使用新变量而不是修改参数
            const fullEndpoint = `${endpoint}/${merchantId}`;
            const response = await fetch(fullEndpoint, {method: 'POST'});

            if (response.status === 402) {
                const body = await response.json();
                const payment = parsePaymentRequired(body);

                if (payment) {
                    setPaymentInfo(payment);

                    const networks = getSupportedNetworkTypes(payment);
                    setSupportedNetworks(networks);
                }
            } else {
                // No payment required
                setPaymentInfo(null);
                setSupportedNetworks([]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch payment info');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentInfo();
    }, [endpoint, merchantId]);

    return {
        paymentInfo,
        supportedNetworks,
        isLoading,
        error,
        refetch: fetchPaymentInfo,
    };
}

