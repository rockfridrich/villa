/**
 * VillaNicknameResolverV3 contract interactions
 *
 * Handles ENS nickname claiming on Base network
 */

import { type Address, encodeFunctionData } from "viem";

const HUB_API_URL =
  process.env.NEXT_PUBLIC_HUB_API_URL || "https://construction.villa.cash";

/** VillaNicknameResolverV3 contract address on Base Sepolia */
const NICKNAME_RESOLVER_ADDRESS =
  "0x180ddE044F1627156Cac6b2d068706508902AE9C" as const;

/** VillaNicknameResolverV3 ABI (subset needed for claiming) */
const NICKNAME_RESOLVER_ABI = [
  {
    name: "mintNickname",
    type: "function",
    inputs: [
      { name: "user", type: "address" },
      { name: "nickname", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "getNickname",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    name: "getAddress",
    type: "function",
    inputs: [{ name: "nickname", type: "string" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    name: "isNicknameAvailable",
    type: "function",
    inputs: [{ name: "nickname", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "hasMinted",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export interface ClaimResult {
  success: true;
  txHash: string;
  nickname: string;
}

export interface ClaimError {
  success: false;
  error: string;
  code?:
    | "ALREADY_CLAIMED"
    | "NOT_AVAILABLE"
    | "INSUFFICIENT_GAS"
    | "USER_REJECTED"
    | "NETWORK_ERROR";
}

export type ClaimNicknameResult = ClaimResult | ClaimError;

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  gasCost: bigint;
  gasCostEth: string;
  gasCostUsd: string | null;
}

/**
 * Get encoded function data for nickname claiming
 * @param user - User address
 * @param nickname - Nickname to claim
 * @returns Encoded function data
 */
export function encodeMintNickname(
  user: Address,
  nickname: string,
): `0x${string}` {
  return encodeFunctionData({
    abi: NICKNAME_RESOLVER_ABI,
    functionName: "mintNickname",
    args: [user, nickname],
  });
}

/**
 * Check if a nickname is available on-chain
 * @param nickname - Nickname to check
 * @returns Promise<boolean> - true if available
 */
export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch(
      `${HUB_API_URL}/api/ens/available/${encodeURIComponent(nickname)}`,
    );
    const data = await response.json();
    return data.available === true;
  } catch (error) {
    console.error("Failed to check nickname availability:", error);
    return false;
  }
}

/**
 * Check if user has already claimed a nickname on-chain
 * @param address - User address
 * @returns Promise<boolean> - true if already claimed
 */
export async function hasClaimedNickname(address: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch(
      `${HUB_API_URL}/api/ens/claimed/${address.toLowerCase()}`,
    );
    const data = await response.json();
    return data.claimed === true;
  } catch (error) {
    console.error("Failed to check if nickname already claimed:", error);
    return false;
  }
}

/**
 * Get current Base network gas price and ETH price for cost estimation
 * @returns Promise<{gasPrice: bigint, ethPriceUsd: number | null}>
 */
export async function getGasPricing(): Promise<{
  gasPrice: bigint;
  ethPriceUsd: number | null;
}> {
  if (typeof window === "undefined") {
    return {
      gasPrice: BigInt("1000000000"),
      ethPriceUsd: null,
    };
  }

  try {
    const response = await fetch(`${HUB_API_URL}/api/gas/pricing`);
    const data = await response.json();

    return {
      gasPrice: BigInt(data.gasPrice || "1000000000"),
      ethPriceUsd: data.ethPriceUsd || null,
    };
  } catch (error) {
    console.error("Failed to get gas pricing:", error);
    return {
      gasPrice: BigInt("1000000000"),
      ethPriceUsd: null,
    };
  }
}

/**
 * Estimate gas cost for claiming a nickname
 * @param user - User address
 * @param nickname - Nickname to claim
 * @returns Promise<GasEstimate>
 */
export async function estimateClaimGas(
  user: Address,
  nickname: string,
): Promise<GasEstimate> {
  const data = encodeMintNickname(user, nickname);
  const { gasPrice, ethPriceUsd } = await getGasPricing();

  // Estimate gas limit (typical: ~80,000 gas for nickname minting)
  const gasLimit = BigInt(100000); // Conservative estimate with buffer
  const gasCost = gasLimit * gasPrice;
  const gasCostEth = (Number(gasCost) / 1e18).toFixed(6);

  let gasCostUsd: string | null = null;
  if (ethPriceUsd) {
    const costUsd = parseFloat(gasCostEth) * ethPriceUsd;
    gasCostUsd = costUsd.toFixed(2);
  }

  return {
    gasLimit,
    gasPrice,
    gasCost,
    gasCostEth,
    gasCostUsd,
  };
}

export const NICKNAME_RESOLVER_CONFIG = {
  address: NICKNAME_RESOLVER_ADDRESS,
  abi: NICKNAME_RESOLVER_ABI,
} as const;
