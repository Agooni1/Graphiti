import { NextRequest, NextResponse } from "next/server";
import { NETWORK_MAP } from "../utils";
import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const { address, chain } = await request.json();
    type ChainKey = keyof typeof NETWORK_MAP;
    const network = NETWORK_MAP[chain as ChainKey] || Network.ETH_SEPOLIA;

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ error: "Invalid Ethereum address" }, { status: 400 });
    }

    // console.log(`🔍 Server: Fetching blockchain data for ${address}`);

    // Initialize Alchemy directly inside the API route
    const alchemyConfig = {
      apiKey: process.env.ALCHEMY_API_KEY,
      network: network,
    };
    const alchemy = new Alchemy(alchemyConfig);

    // Use Alchemy to fetch real data
    const balance = await alchemy.core.getBalance(address);
    const transactionCount = await alchemy.core.getTransactionCount(address);

    // Mock data for other fields (you can expand this later)
    const cosmicData = {
      address,
      balance: balance.toString(),
      transactionCount,
      connectedAddresses: getMockConnectedAddresses(address),
      recentTransactions: getMockTransactions(address),
      tokenBalances: getMockTokenBalances(),
      nftCount: Math.floor(Math.random() * 20),
    };

    // console.log(`✅ Server: Blockchain data fetched for ${address}`);
    return NextResponse.json(cosmicData);
  } catch (error) {
    console.error("Blockchain data fetch error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch blockchain data",
      },
      { status: 500 },
    );
  }
}

// Helper functions for mock data
function getMockConnectedAddresses(address: string): string[] {
  const addresses = [];
  for (let i = 0; i < 8; i++) {
    const mockAddress = ethers.getAddress("0x" + ethers.keccak256(ethers.toUtf8Bytes(address + i)).slice(2, 42));
    addresses.push(mockAddress);
  }
  return addresses;
}

function getMockTransactions(address: string) {
  const transactions = [];
  for (let i = 0; i < 5; i++) {
    transactions.push({
      hash: ethers.keccak256(ethers.toUtf8Bytes(address + i)),
      from: address,
      to: ethers.getAddress("0x" + ethers.keccak256(ethers.toUtf8Bytes(address + i)).slice(2, 42)),
      value: ethers.parseEther((Math.random() * 10).toFixed(4)).toString(),
      timestamp: Date.now() - i * 86400000,
    });
  }
  return transactions;
}

function getMockTokenBalances() {
  return [
    { symbol: "USDC", balance: "1000.50", contractAddress: "0xA0b86a33E6410fCaA2df108ffB1De3b15b4c0c8A" },
    { symbol: "WETH", balance: "5.25", contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
    { symbol: "UNI", balance: "50.0", contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" },
  ];
}
