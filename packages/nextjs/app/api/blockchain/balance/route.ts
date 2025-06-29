import { NextRequest, NextResponse } from "next/server";
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
  connectionInfoOverrides: {
    skipFetchSetup: true,
  },
};

const alchemy = new Alchemy(config);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: "Address parameter required" }, { status: 400 });
  }

  try {
    const rawBalance = await alchemy.core.getBalance(address);
    const eth = Number(rawBalance) / 1e18;
    return NextResponse.json({ balance: eth.toFixed(4) });
  } catch (err) {
    console.error("Balance fetch error:", err);
    return NextResponse.json({ balance: "..." });
  }
}