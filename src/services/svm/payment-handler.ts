/**
 * SVM (Solana) Payment Handler
 *
 * High-level API: Automatically handles the full payment flow
 * Use this for the simplest integration - just provide wallet and endpoint
 */

import type {SvmClientConfig} from "../../types";
import {SolanaNetworkSchema} from "../../types";
import type {PaymentRequirements, x402Response} from "x402/types";
import {createSvmPaymentHeader, getDefaultSolanaRpcUrl} from "./payment-header";
import {PaymentOperationError, wrapPaymentError} from "../../utils";

/**
 * Handle SVM payment with automatic x402 flow
 *
 * @param endpoint - API endpoint that requires x402 payment
 * @param config - SVM client configuration
 * @param requestInit - Optional fetch RequestInit options
 * @returns Response from the endpoint after successful payment
 *
 * @example
 * ```typescript
 * // Simple usage with Phantom wallet
 * const response = await handleSvmPayment(
 *   "https://api.example.com/protected",
 *   {
 *     wallet: window.solana,
 *     network: "solana-devnet"
 *   }
 * );
 * const data = await response.json();
 * ```
 */
export async function handleSvmPayment(
    endpoint: string,
    config: SvmClientConfig,
    requestInit?: RequestInit
): Promise<Response> {
    const {wallet, network, rpcUrl, maxPaymentAmount} = config;

    // 1. Make initial request
    const initialResponse = await fetch(endpoint, {
        ...requestInit,
        method: requestInit?.method || "POST",
    });

    // If not 402, return as-is
    if (initialResponse.status !== 402) {
        return initialResponse;
    }

    // 2. Parse payment requirements from 402 response
    const rawResponse = await initialResponse.json() as x402Response;

    // 3. Check if backend returned an error (e.g., insufficient_funds, verification_failed)
    // Skip errors that are part of normal 402 flow (initial request without X-PAYMENT)
    const IGNORED_ERRORS = [
        'X-PAYMENT header is required',
        'missing X-PAYMENT header',
        'payment_required',
    ];
    
    if (rawResponse.error && !IGNORED_ERRORS.includes(rawResponse.error)) {
        console.error(`❌ Payment verification failed: ${rawResponse.error}`);
        
        // Map backend error codes to user-friendly messages
        const ERROR_MESSAGES: Record<string, string> = {
            'insufficient_funds': 'Insufficient balance to complete this payment',
            'invalid_signature': 'Invalid payment signature',
            'expired': 'Payment authorization has expired',
            'already_used': 'This payment has already been used',
            'network_mismatch': 'Payment network does not match',
            'invalid_payment': 'Invalid payment data',
            'verification_failed': 'Payment verification failed',
            'invalid_exact_svm_payload_transaction_simulation_failed': 'Transaction simulation failed due to insufficient balance. Please check your wallet balance carefully and ensure you have enough funds to cover the payment and transaction fees.',
        };
        
        const errorMessage = ERROR_MESSAGES[rawResponse.error] || 
                            `Payment failed: ${rawResponse.error}`;
        
        const error = new Error(errorMessage);
        throw wrapPaymentError(error);
    }

    const x402Version: number = rawResponse.x402Version;
    const parsedPaymentRequirements: PaymentRequirements[] = rawResponse.accepts || [];

    // 4. Select suitable payment requirement for Solana
    const selectedRequirements = parsedPaymentRequirements.find(
        (req: PaymentRequirements) =>
            req.scheme === "exact" &&
            SolanaNetworkSchema.safeParse(req.network.toLowerCase()).success
    );

    if (!selectedRequirements) {
        console.error(
            "❌ No suitable Solana payment requirements found. Available networks:",
            parsedPaymentRequirements.map((req) => req.network)
        );
        throw new Error("No suitable Solana payment requirements found");
    }

    // 5. Check amount against max value if specified
    if (maxPaymentAmount && maxPaymentAmount > BigInt(0)) {
        if (BigInt(selectedRequirements.maxAmountRequired) > maxPaymentAmount) {
            throw new Error(
                `Payment amount ${selectedRequirements.maxAmountRequired} exceeds maximum allowed ${maxPaymentAmount}`
            );
        }
    }

    // 6. Get RPC URL (use provided or default from backend requirements)
    const effectiveRpcUrl = rpcUrl || getDefaultSolanaRpcUrl(selectedRequirements.network);
    console.log(`📍 Using Solana RPC: ${effectiveRpcUrl.substring(0, 40)}...`);
    console.log(`📍 Network from backend: ${selectedRequirements.network}`);

    // 7. Create payment header with error handling
    let paymentHeader: string;
    try {
        paymentHeader = await createSvmPaymentHeader({
            wallet,
            paymentRequirements: selectedRequirements,
            x402Version,
            rpcUrl: effectiveRpcUrl,
        });
        console.log('✅ Payment header created successfully');
    } catch (error: any) {
        console.error('❌ Failed to create payment header:', error);
        throw wrapPaymentError(error);
    }

    // 8. Retry with payment header
    const newInit = {
        ...requestInit,
        method: requestInit?.method || "POST",
        headers: {
            ...(requestInit?.headers || {}),
            "X-PAYMENT": paymentHeader,
            "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
        },
    };

    const retryResponse = await fetch(endpoint, newInit);
    
    // 9. Check if retry still returned 402 with error (e.g., verification failed)
    if (retryResponse.status === 402) {
        try {
            const retryData = await retryResponse.json();
            
            // Skip normal 402 errors (shouldn't happen at this point, but be safe)
            const IGNORED_ERRORS = [
                'X-PAYMENT header is required',
                'missing X-PAYMENT header',
                'payment_required',
            ];
            
            if (retryData.error && !IGNORED_ERRORS.includes(retryData.error)) {
                console.error(`❌ Payment verification failed: ${retryData.error}`);
                
                // Map backend error codes to user-friendly messages
                const ERROR_MESSAGES: Record<string, string> = {
                    'insufficient_funds': 'Insufficient balance to complete this payment',
                    'invalid_signature': 'Invalid payment signature',
                    'expired': 'Payment authorization has expired',
                    'already_used': 'This payment has already been used',
                    'network_mismatch': 'Payment network does not match',
                    'invalid_payment': 'Invalid payment data',
                    'verification_failed': 'Payment verification failed',
                    'invalid_exact_svm_payload_transaction_simulation_failed': 'Transaction simulation failed due to insufficient balance. Please check your wallet balance carefully and ensure you have enough funds to cover the payment and transaction fees.',
                };
                
                const errorMessage = ERROR_MESSAGES[retryData.error] || 
                                    `Payment failed: ${retryData.error}`;
                
                const error = new Error(errorMessage);
                throw wrapPaymentError(error);
            }
        } catch (error: any) {
            // If error is already wrapped, re-throw it
            if (error instanceof PaymentOperationError) {
                throw error;
            }
            // Otherwise it's a JSON parse error, just return the response
            console.warn('⚠️ Could not parse retry 402 response:', error);
        }
    }
    
    return retryResponse;
}

/**
 * Create a custom fetch function that automatically handles x402 payments for SVM
 *
 * @example
 * ```typescript
 * const paymentFetch = createSvmPaymentFetch({
 *   wallet: window.solana,
 *   network: "solana-devnet",
 *   maxPaymentAmount: BigInt(1_000_000) // 1 USDC max
 * });
 *
 * // Use like regular fetch
 * const response = await paymentFetch("https://api.example.com/protected");
 * ```
 */
export function createSvmPaymentFetch(
    config: SvmClientConfig
): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const endpoint = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        return handleSvmPayment(endpoint, config, init);
    };
}

