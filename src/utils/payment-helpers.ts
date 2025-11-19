/**
 * Payment helper utilities for demo/UI
 * Simplified payment handling with callbacks
 */

import {NetworkType} from "../types";
import type {PaymentRequirements} from "x402/types";
import {handleEvmPayment, handleSvmPayment} from "../services";
import {ethers} from "ethers";
import {PROD_BACK_URL} from "../types/common";

export interface PaymentCallbacks {
    onStart?: () => void;
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
    onFinish?: () => void;
}

/**
 * Parse payment requirements from 402 response
 */
export function parsePaymentRequired(response: any): PaymentRequirements[] | null {
    if (response && typeof response === 'object') {
        // Direct x402Response format
        if ('x402Version' in response && 'accepts' in response) {
            return response.accepts;
        }
    }
    return null;
}

/**
 * Get supported network types from payment requirements
 */
export function getSupportedNetworkTypes(paymentRequirements: PaymentRequirements[]): NetworkType[] {
    if (!paymentRequirements || paymentRequirements.length === 0) {
        return [];
    }

    const networkTypes = new Set<NetworkType>();

    paymentRequirements.forEach(req => {
        const network = req.network.toLowerCase();

        if (network.includes('solana') || network.includes('svm')) {
            networkTypes.add(NetworkType.SOLANA);
        } else if (
            network.includes('ethereum') ||
            network.includes('base') ||
            network.includes('polygon') ||
            network.includes('arbitrum') ||
            network.includes('optimism') ||
            network.includes('sepolia')
        ) {
            networkTypes.add(NetworkType.EVM);
        }
    });

    return Array.from(networkTypes);
}

/**
 * Make payment with automatic chain handling
 *
 * This function handles all the chain-specific logic internally.
 * Business logic should be handled via callbacks.
 *
 * @param endpoint - API endpoint
 * @param networkType - Network type (from useWallet)
 * @param merchantId - @see our website to apply
 * @returns Response from the payment
 *
 * @example
 * ```tsx
 * const response = await makePayment('/api/endpoint', networkType);
 * const data = await response.json();
 * ```
 */
export async function makePayment(
    networkType: NetworkType,
    merchantId: string,
    endpoint: string = PROD_BACK_URL,
): Promise<Response> {
    // 使用新变量而不是修改参数
    const fullEndpoint = `${endpoint}/${merchantId}`;
    let response: Response;

    if (networkType === NetworkType.SOLANA || networkType === NetworkType.SVM) {
        // Solana payment
        const solana = (window as any).solana;
        if (!solana) {
            throw new Error('请安装 Phantom 钱包');
        }

        if (!solana.isConnected) {
            await solana.connect();
        }

        response = await handleSvmPayment(fullEndpoint, {
            wallet: solana,
            network: 'solana', // Will use backend's network configuration
        });
    } else if (networkType === NetworkType.EVM) {
        // EVM payment
        if (!(window as any).ethereum) {
            throw new Error('请安装 MetaMask 钱包');
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const wallet = {
            address: await signer.getAddress(),
            signTypedData: async (domain: any, types: any, message: any) => {
                return await signer.signTypedData(domain, types, message);
            },
            // Get current chain ID from wallet
            getChainId: async () => {
                const network = await provider.getNetwork();
                return `0x${network.chainId.toString(16)}`;
            },
            // Switch to a different chain
            switchChain: async (chainId: string) => {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId }],
                });
            },
        };

        // Use a placeholder network - handler will use backend's network configuration
        response = await handleEvmPayment(fullEndpoint, {
            wallet,
            network: 'base', // Will use backend's network configuration
        });
    } else {
        throw new Error(`不支持的网络类型: ${networkType}`);
    }

    return response;
}

/**
 * Unified payment handler with callbacks (deprecated - use makePayment directly)
 * @deprecated Use makePayment() directly and handle callbacks in your component
 */
export async function handlePayment(
    endpoint: string,
    networkType: NetworkType,
    callbacks?: PaymentCallbacks
): Promise<any> {
    try {
        callbacks?.onStart?.();

        const response = await makePayment(networkType, '', endpoint);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`请求失败 (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        callbacks?.onSuccess?.(result);
        return result;

    } catch (err: any) {
        const errorMessage = err.message || '支付失败';
        callbacks?.onError?.(errorMessage);
        throw err;
    } finally {
        callbacks?.onFinish?.();
    }
}

