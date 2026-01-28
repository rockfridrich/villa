import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

const NICKNAME_RESOLVER_ADDRESSES = {
  [base.id]: "0x180ddE044F1627156Cac6b2d068706508902AE9C" as const,
  [baseSepolia.id]: "0x180ddE044F1627156Cac6b2d068706508902AE9C" as const,
} as const;

const getCurrentChain = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId === "84532") {
    return baseSepolia;
  }
  return base;
};

const NICKNAME_RESOLVER_ABI = [
  {
    name: "isNicknameAvailable",
    type: "function",
    inputs: [{ name: "nickname", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { nickname: string } },
) {
  try {
    const nickname = decodeURIComponent(params.nickname);

    if (!nickname || nickname.length < 3 || nickname.length > 30) {
      return NextResponse.json(
        { available: false, error: "Invalid nickname length" },
        { status: 400 },
      );
    }

    const chain = getCurrentChain();
    const resolverAddress = NICKNAME_RESOLVER_ADDRESSES[chain.id];

    if (!resolverAddress) {
      return NextResponse.json(
        { available: false, error: "Contracts not deployed on this network" },
        { status: 500 },
      );
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const isAvailable = await publicClient.readContract({
      address: resolverAddress,
      abi: NICKNAME_RESOLVER_ABI,
      functionName: "isNicknameAvailable",
      args: [nickname],
    });

    return NextResponse.json({
      available: isAvailable,
      nickname,
      chainId: chain.id,
    });
  } catch (error) {
    console.error("Error checking nickname availability:", error);
    return NextResponse.json(
      { available: false, error: "Failed to check availability" },
      { status: 500 },
    );
  }
}
