import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { isAddress } from "viem";

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
    name: "hasMinted",
    type: "function",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } },
) {
  try {
    const address = params.address.toLowerCase();

    if (!isAddress(address)) {
      return NextResponse.json(
        { claimed: false, error: "Invalid address format" },
        { status: 400 },
      );
    }

    const chain = getCurrentChain();
    const resolverAddress = NICKNAME_RESOLVER_ADDRESSES[chain.id];

    if (!resolverAddress) {
      return NextResponse.json(
        { claimed: false, error: "Contracts not deployed on this network" },
        { status: 500 },
      );
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const hasClaimed = await publicClient.readContract({
      address: resolverAddress,
      abi: NICKNAME_RESOLVER_ABI,
      functionName: "hasMinted",
      args: [address as `0x${string}`],
    });

    return NextResponse.json({
      claimed: hasClaimed,
      address,
      chainId: chain.id,
    });
  } catch (error) {
    console.error("Error checking if nickname claimed:", error);
    return NextResponse.json(
      { claimed: false, error: "Failed to check claim status" },
      { status: 500 },
    );
  }
}
