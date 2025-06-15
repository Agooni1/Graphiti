// utils/ipfsUploader.ts
import { create } from 'ipfs-http-client';

export async function uploadCosmicVisualization(
  address: string,
  data: AddressCosmicData
): Promise<string> {
  const ipfs = create({ url: 'https://ipfs.infura.io:5001' });
  
  // Generate the visualization
  const cosmicHTML = generateCosmic3D(data);
  
  // Upload to IPFS
  const result = await ipfs.add(cosmicHTML);
  
  // Create metadata
  const metadata = {
    name: `Cosmic Graph: ${address.slice(0, 6)}...${address.slice(-4)}`,
    description: `A cosmic visualization of Ethereum address ${address} showing ${data.transactionCount} transactions and ${data.connectedAddresses.length} connections.`,
    image: `ipfs://${result.path}`,
    animation_url: `ipfs://${result.path}`, // For animated content
    attributes: [
      { trait_type: "Balance", value: Number(data.balance) / 1e18 },
      { trait_type: "Transaction Count", value: data.transactionCount },
      { trait_type: "Connected Addresses", value: data.connectedAddresses.length },
      { trait_type: "Token Holdings", value: data.tokenHoldings.length },
    ]
  };
  
  const metadataResult = await ipfs.add(JSON.stringify(metadata));
  return metadataResult.path;
}