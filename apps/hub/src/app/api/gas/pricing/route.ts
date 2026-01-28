import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

const getCurrentChain = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (chainId === "84532") {
    return baseSepolia;
  }
  return base;
};

async function getEthPriceUsd(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 300 } },
    );
    const data = await response.json();
    return data.ethereum?.usd || null;
  } catch (error) {
    console.error("Failed to fetch ETH price:", error);
    return null;
  }
}

export async function GET() {
  try {
    const chain = getCurrentChain();

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const [gasPrice, ethPrice] = await Promise.all([
      publicClient.getGasPrice(),
      getEthPriceUsd(),
    ]);

    return NextResponse.json({
      gasPrice: gasPrice.toString(),
      ethPriceUsd: ethPrice,
      chainId: chain.id,
      chainName: chain.name,
    });
  } catch (error) {
    console.error("Error fetching gas pricing:", error);
    return NextResponse.json(
      {
        gasPrice: "1000000000",
        ethPriceUsd: null,
        error: "Failed to fetch gas pricing",
      },
      { status: 500 },
    );
  }
}
