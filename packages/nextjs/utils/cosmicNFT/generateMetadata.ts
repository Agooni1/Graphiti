import { AddressCosmicData } from "./fetchCosmicData";

export interface CosmicVisualizationData {
  metadata: any;
}

/**
 * Generate metadata for cosmic graph NFT
 */
export function generateMetadata(
  data: AddressCosmicData, 
  contentCID: string, 
  layoutMode: 'shell' | 'force' | 'fibonacci' = 'shell',
  contentType: 'gif' | 'html' = 'html',
  chainId?: number, // Add chainId parameter
  nodeCount?: number, // 🔧 ADD: Optional node count parameter
): CosmicVisualizationData {
  
  // Validate address
  if (!data.address || data.address === "Unknown" || !data.address.startsWith('0x') || data.address.length !== 42) {
    throw new Error(`Invalid address in cosmic data: ${data.address}`);
  }

  const isInteractive = contentType === 'html';
  const ipfsUrl = `https://ipfs.io/ipfs/${contentCID}`;
  const connectionCount = data.connectedAddresses.length;
  const balanceETH = Number(data.balance) / 1e18;

  // 🔧 UPDATED: Use actual node count if provided, fallback to connected addresses
  const actualNodeCount = nodeCount;

  // 🔧 ADD: Get network name from chainId
  const getNetworkName = (chainId?: number) => {
    switch (chainId) {
      case 1: return "mainnet";
      case 11155111: return "sepolia";
      case 8453: return "base";        // 🔧 CHANGED: Polygon → Base
      case 42161: return "arbitrum";
      default: return "ethereum";
    }
  };

  // Simple rarity tiers based on actual node count
  const getNodeTier = (nodeCount: number) => {
    if (nodeCount >= 100) return "✦✦✦";  // Ultra rare
    if (nodeCount >= 50) return "✦✦";    // Rare  
    if (nodeCount >= 20) return "✦";     // Uncommon
    return "○";                          // Common
  };

  const getBalanceTier = (balance: number) => {
    if (balance >= 10) return "Whale";
    if (balance >= 1) return "Holder";
    if (balance >= 0.1) return "Active";
    return "Explorer";
  };

  const metadata = {
    name: `Cosmic Graph: ${data.address.slice(0, 6)}...${data.address.slice(-4)}`,
    description: `A ${layoutMode} constellation of ${data.address}.`,
    image: ipfsUrl,
    external_url: `https://graphiti.xyz`,
    
    // Add targetAddress for backend validation
    targetAddress: data.address,
    
    ...(isInteractive && {
      animation_url: ipfsUrl,
    }),
    
    attributes: [
      {
        trait_type: "Tier",
        value: getNodeTier(data.connectedAddresses.length)
      },
      {
        trait_type: "Type",
        value: getBalanceTier(balanceETH)
      },
      {
        trait_type: "Shape", 
        value: layoutMode.charAt(0).toUpperCase() + layoutMode.slice(1)
      },
      {
        trait_type: "Nodes",
        value: actualNodeCount
      },
      
      // 🔧 ADD: Network attribute
      {
        trait_type: "Network",
        value: getNetworkName(chainId)
      }
    ]
  };

  return { metadata };
}