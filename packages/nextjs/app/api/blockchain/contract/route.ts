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
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address parameter required" }, { status: 400 });
  }

  try {
    const bytecode = await alchemy.core.getCode(address);
    const isContract = bytecode !== "0x";
    return NextResponse.json({ isContract });
  } catch (err) {
    console.error("Contract check error:", err);
    return NextResponse.json({ isContract: false });
  }
}
