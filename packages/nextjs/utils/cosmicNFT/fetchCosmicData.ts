import { ethers } from "ethers";

export interface AddressCosmicData {
  address: string;
  balance: bigint;
  transactionCount: number;
  connectedAddresses: string[];
  recentTransactions: Transaction[];
  tokenBalances: TokenBalance[];
  nftCount: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  contractAddress: string;
}

/**
 * Fetch cosmic data for an Ethereum address
 */
export async function fetchCosmicData(address: string): Promise<AddressCosmicData> {
  if (!ethers.isAddress(address)) {
    throw new Error("Invalid Ethereum address");
  }

  console.log("🔍 Fetching cosmic data for:", address);

  try {
    // Use server-side API route to fetch blockchain data securely
    const response = await fetch('/api/blockchain/address-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      console.warn("Failed to fetch from server, using mock data");
      return getMockCosmicData(address);
    }

    const data = await response.json();
    console.log("✅ Cosmic data fetched successfully");
    return data;
    
  } catch (error) {
    console.error("Error fetching cosmic data:", error);
    console.warn("Falling back to mock data");
    return getMockCosmicData(address);
  }
}

// Mock data function for development/fallback
function getMockCosmicData(address: string): AddressCosmicData {
  return {
    address,
    balance: BigInt(ethers.parseEther((Math.random() * 10).toFixed(4)).toString()),
    transactionCount: Math.floor(Math.random() * 100) + 10,
    connectedAddresses: getMockConnectedAddresses(address),
    recentTransactions: getMockTransactions(address),
    tokenBalances: getMockTokenBalances(address),
    nftCount: Math.floor(Math.random() * 20),
  };
}

// Mock functions (replace with real API calls later)
function getMockConnectedAddresses(address: string): string[] {
  const addresses = [];
  for (let i = 0; i < 8; i++) {
    const mockAddress = ethers.getAddress(
      "0x" + ethers.keccak256(ethers.toUtf8Bytes(address + i)).slice(2, 42)
    );
    addresses.push(mockAddress);
  }
  return addresses;
}

function getMockTransactions(address: string): Transaction[] {
  const transactions = [];
  for (let i = 0; i < 5; i++) {
    transactions.push({
      hash: ethers.keccak256(ethers.toUtf8Bytes(address + i)),
      from: address,
      to: ethers.getAddress("0x" + ethers.keccak256(ethers.toUtf8Bytes(address + i)).slice(2, 42)),
      value: ethers.parseEther((Math.random() * 10).toFixed(4)).toString(),
      timestamp: Date.now() - i * 86400000, // i days ago
    });
  }
  return transactions;
}

function getMockTokenBalances(address: string): TokenBalance[] {
  return [
    { symbol: "USDC", balance: "1000.50", contractAddress: "0xA0b86a33E6410fCaA2df108ffB1De3b15b4c0c8A" },
    { symbol: "WETH", balance: "5.25", contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
    { symbol: "UNI", balance: "50.0", contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" },
  ];
}