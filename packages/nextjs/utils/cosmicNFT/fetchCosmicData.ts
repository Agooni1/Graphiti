import { ethers } from "ethers";
import { Network } from "alchemy-sdk";

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

  // You'll need to add your Alchemy/Etherscan API key  
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

   if (!alchemyKey) {
    console.warn("Alchemy API key not found, using mock data");
    // return getMockCosmicData(address);
  }
  const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`);

  try {
    // Basic address data
    const balance = await provider.getBalance(address);
    // const transactionCount = await provider.getTransactionCount(address);
    const transactionCount = 37; // Mock transaction count for now

    // For now, we'll use mock data for connected addresses
    // In production, you'd fetch real transaction history
    const connectedAddresses = await getMockConnectedAddresses(address);
    const recentTransactions = await getMockTransactions(address);
    const tokenBalances = await getMockTokenBalances(address);

    return {
      address,
      balance,
      transactionCount,
      connectedAddresses,
      recentTransactions,
      tokenBalances,
      nftCount: Math.floor(Math.random() * 20), // Mock for now
    };
  } catch (error) {
    console.error("Error fetching cosmic data:", error);
    throw new Error("Failed to fetch address data");
  }
}

// Mock functions (replace with real API calls later)
async function getMockConnectedAddresses(address: string): Promise<string[]> {
  // Generate some mock addresses based on the input address
  const addresses = [];
  for (let i = 0; i < 8; i++) {
    const mockAddress = ethers.getAddress(
      "0x" + ethers.keccak256(ethers.toUtf8Bytes(address + i)).slice(2, 42)
    );
    addresses.push(mockAddress);
  }
  return addresses;
}

async function getMockTransactions(address: string): Promise<Transaction[]> {
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

async function getMockTokenBalances(address: string): Promise<TokenBalance[]> {
  return [
    { symbol: "USDC", balance: "1000.50", contractAddress: "0xA0b86a33E6410fCaA2df108ffB1De3b15b4c0c8A" },
    { symbol: "WETH", balance: "5.25", contractAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
    { symbol: "UNI", balance: "50.0", contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" },
  ];
}