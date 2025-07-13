import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = {
  // 🔧 UPDATE: Include all desired networks
  targetNetworks: [
    chains.sepolia,     
    chains.arbitrum,      
    chains.base,       
    chains.mainnet,   
  ],

  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 4000)
  pollingInterval: 30000,

  // This is ours Alchemy's default API key.
  // You can get your own at https://dashboard.alchemyapi.io
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  alchemyApiKey: process.env.PRIVATE_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,
  
  // 🔧 UPDATE: Add RPC overrides for all networks
  rpcOverrides: {
    [chains.sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "",
    [chains.arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || "",
    [chains.base.id]: process.env.NEXT_PUBLIC_BASE_RPC_URL || "",
    [chains.mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "",
  },

  // This is ours WalletConnect's default project ID.
  // You can get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Only show the Burner Wallet when running on hardhat network
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
