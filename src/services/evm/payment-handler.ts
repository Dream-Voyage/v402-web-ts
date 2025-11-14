/**
 * EVM Payment Handler
 *
 * High-level API: Automatically handles the full payment flow
 * Use this for the simplest integration - just provide wallet and endpoint
 */

import type {EvmClientConfig} from "../../types";
import {EvmNetworkSchema} from "../../types";
import type {PaymentRequirements, x402Response} from "x402/types";
import {createEvmPaymentHeader, getChainIdFromNetwork} from "./payment-header";

/**
 * Handle EVM payment with automatic x402 flow
 *
 * @param endpoint - API endpoint that requires x402 payment
 * @param config - EVM client configuration
 * @param requestInit - Optional fetch RequestInit options
 * @returns Response from the endpoint after successful payment
 *
 * @example
 * ```typescript
 * // Simple usage with MetaMask
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 *
 * const response = await handleEvmPayment(
 *   "https://api.example.com/protected",
 *   {
 *     wallet: {
 *       address: await signer.getAddress(),
 *       signTypedData: (domain, types, message) =>
 *         signer.signTypedData(domain, types, message)
 *     },
 *     network: "base-sepolia"
 *   }
 * );
 * ```
 */
export async function handleEvmPayment(
    endpoint: string,
    config: EvmClientConfig,
    requestInit?: RequestInit
): Promise<Response> {
  const {wallet, network, maxPaymentAmount} = config;

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

  // 3. Select suitable payment requirement for EVM
  const selectedRequirements = parsedPaymentRequirements.find(
      (req: PaymentRequirements) =>
          req.scheme === "exact" &&
          EvmNetworkSchema.safeParse(req.network.toLowerCase()).success
  );


  if (!selectedRequirements) {
    console.error(
        "❌ No suitable EVM payment requirements found. Available networks:",
        parsedPaymentRequirements.map((req) => req.network)
    );
    throw new Error("No suitable EVM payment requirements found");
  }

  // 4. Check amount against max value if specified
  if (maxPaymentAmount && maxPaymentAmount > BigInt(0)) {
    if (BigInt(selectedRequirements.maxAmountRequired) > maxPaymentAmount) {
      throw new Error(
          `Payment amount ${selectedRequirements.maxAmountRequired} exceeds maximum allowed ${maxPaymentAmount}`
      );
    }
  }

  // 5. Switch chain if needed (if wallet supports it)
  const targetChainId = getChainIdFromNetwork(selectedRequirements.network);
  if (wallet.switchChain) {
    try {
      await wallet.switchChain(`0x${targetChainId.toString(16)}`);
    } catch (error) {
      console.warn("Failed to switch chain:", error);
      // Continue anyway - wallet might already be on correct chain
    }
  }

  // 6. Create payment header
  const paymentHeader = await createEvmPaymentHeader({
    wallet,
    paymentRequirements: selectedRequirements,
    x402Version,
    chainId: targetChainId,
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
 * Create a custom fetch function that automatically handles x402 payments for EVM
 *
 * @example
 * ```typescript
 * const paymentFetch = createEvmPaymentFetch({
 *   wallet: myWallet,
 *   network: "base-sepolia",
 *   maxPaymentAmount: BigInt(1_000_000) // 1 USDC max
 * });
 *
 * // Use like regular fetch
 * const response = await paymentFetch("https://api.example.com/protected");
 * ```
 */
export function createEvmPaymentFetch(
    config: EvmClientConfig
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const endpoint = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return handleEvmPayment(endpoint, config, init);
  };
}

