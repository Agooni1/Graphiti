import { AddressCosmicData } from "./fetchCosmicData";

export interface CosmicVisualizationData {
  metadata: any;
}

/**
 * Generate metadata for cosmic graph NFT
 */
export function generateMetadata(data: AddressCosmicData, gifCID: string, layoutMode: 'shell' | 'force' | 'fibonacci' = 'shell'): CosmicVisualizationData {
  
  // DEBUG: Validate input data
//   console.log("generateMetadata received data:", data);
  
  // Validate address
  if (!data.address || data.address === "Unknown" || !data.address.startsWith('0x') || data.address.length !== 42) {
    console.error("Invalid address in generateMetadata:", data.address);
    throw new Error(`Invalid address in cosmic data: ${data.address}`);
  }

  const metadata = {
    name: `Cosmic Graph: ${data.address.slice(0, 8)}...${data.address.slice(-6)}`,
    description: `A ${layoutMode} layout visualization of Ethereum address ${data.address} showing ${data.connectedAddresses.length} connections and ${data.transactionCount} transactions.`,
    image: `https://gateway.pinata.cloud/ipfs/${gifCID}`,
    attributes: [
      { trait_type: "Target Address", value: data.address },
      { trait_type: "Layout Type", value: layoutMode },
      { trait_type: "Transaction Count", value: data.transactionCount },
      { trait_type: "Connected Addresses", value: data.connectedAddresses.length },
      { trait_type: "Balance (ETH)", value: (Number(data.balance) / 1e18).toFixed(4) },
      { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
    ],
  };

  return { metadata };
}