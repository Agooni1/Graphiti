import * as chains from "viem/chains";

export type SupportedChain = "ethereum" | "sepolia" | "arbitrum" | "base";

export const CHAIN_MAPPING: Record<SupportedChain, number> = {
  ethereum: chains.mainnet.id,     // 1
  sepolia: chains.sepolia.id,      // 11155111
  arbitrum: chains.arbitrum.id,    // 42161
  base: chains.base.id,            // 8453
};

export const CHAIN_CONFIGS: Record<SupportedChain, {
  id: number;
  name: string;
  nativeCurrency: string;
  blockExplorer: string;
  apiChain: string;
  contractDeployed: boolean;
  viemChain: chains.Chain;
}> = {
  ethereum: {
    id: chains.mainnet.id,
    name: "Ethereum Mainnet",
    nativeCurrency: "ETH",
    blockExplorer: "https://etherscan.io",
    apiChain: "eth",
    contractDeployed: false, // ❌ No contract (graph only)
    viemChain: chains.mainnet,
  },
  sepolia: {
    id: chains.sepolia.id,
    name: "Sepolia Testnet",
    nativeCurrency: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    apiChain: "sepolia",
    contractDeployed: true, // ✅ Contract deployed
    viemChain: chains.sepolia,
  },
  arbitrum: {
    id: chains.arbitrum.id,
    name: "Arbitrum One",
    nativeCurrency: "ETH",
    blockExplorer: "https://arbiscan.io",
    apiChain: "arbitrum",
    contractDeployed: true, // ✅ Contract deployed
    viemChain: chains.arbitrum,
  },
  base: {
    id: chains.base.id,
    name: "Base",
    nativeCurrency: "ETH",
    blockExplorer: "https://basescan.org",
    apiChain: "base",
    contractDeployed: false, // ❌ No contract (graph only)
    viemChain: chains.base,
  },
};

export function getChainId(chain: SupportedChain): number {
  return CHAIN_MAPPING[chain];
}

export function getApiChain(chain: SupportedChain): string {
  return CHAIN_CONFIGS[chain].apiChain;
}

export function isContractDeployedOnChain(chain: SupportedChain): boolean {
  return CHAIN_CONFIGS[chain].contractDeployed;
}

export function getChainFromId(chainId: number): SupportedChain | undefined {
  return Object.entries(CHAIN_MAPPING).find(([_, id]) => id === chainId)?.[0] as SupportedChain;
}

export function getViemChain(chain: SupportedChain) {
  return CHAIN_CONFIGS[chain].viemChain;
}