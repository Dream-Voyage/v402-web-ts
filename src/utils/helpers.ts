/**
 * General helper utilities
 *
 * Miscellaneous helper functions for the SDK
 */

/**
 * Convert human-readable amount to atomic units (smallest unit)
 *
 * @param amount - Human-readable amount (e.g., 2.5 for 2.5 USDC)
 * @param decimals - Token decimals (e.g., 6 for USDC, 18 for ETH)
 * @returns Amount in atomic units as bigint
 *
 * @example
 * ```typescript
 * // 2.5 USDC (6 decimals) = 2,500,000 micro-USDC
 * const atomicUnits = toAtomicUnits(2.5, 6); // 2500000n
 * ```
 */
export function toAtomicUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

/**
 * Convert atomic units to human-readable amount
 *
 * @param atomicUnits - Token amount in smallest units
 * @param decimals - Token decimals (e.g., 6 for USDC, 18 for ETH)
 * @returns Human-readable amount as number
 *
 * @example
 * ```typescript
 * // 2,500,000 micro-USDC = 2.5 USDC
 * const amount = fromAtomicUnits(2500000n, 6); // 2.5
 * ```
 */
export function fromAtomicUnits(atomicUnits: bigint | number, decimals: number): number {
  return Number(atomicUnits) / Math.pow(10, decimals);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Parse x402Response to check if it's a 402 payment required
 */
export function is402Response(response: any): boolean {
  return (
      response &&
      typeof response === 'object' &&
      'x402Version' in response &&
      'accepts' in response &&
      Array.isArray(response.accepts)
  );
}
