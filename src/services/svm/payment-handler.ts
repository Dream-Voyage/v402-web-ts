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

    const x402Version: number = rawResponse.x402Version;
    const parsedPaymentRequirements: PaymentRequirements[] = rawResponse.accepts || [];

    // 3. Select suitable payment requirement for Solana
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

    // 4. Check amount against max value if specified
    if (maxPaymentAmount && maxPaymentAmount > BigInt(0)) {
        if (BigInt(selectedRequirements.maxAmountRequired) > maxPaymentAmount) {
            throw new Error(
                `Payment amount ${selectedRequirements.maxAmountRequired} exceeds maximum allowed ${maxPaymentAmount}`
            );
        }
    }

    // 5. Get RPC URL (use provided or default)
    const effectiveRpcUrl = rpcUrl || getDefaultSolanaRpcUrl(network);

    // 6. Create payment header
    const paymentHeader = await createSvmPaymentHeader({
        wallet,
        paymentRequirements: selectedRequirements,
        x402Version,
        rpcUrl: effectiveRpcUrl,
    });

    // 7. Retry with payment header
    const newInit = {
        ...requestInit,
        method: requestInit?.method || "POST",
        headers: {
            ...(requestInit?.headers || {}),
            "X-PAYMENT": paymentHeader,
            "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
        },
    };

    return await fetch(endpoint, newInit);
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

