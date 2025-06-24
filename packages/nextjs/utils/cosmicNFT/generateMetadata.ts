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
  contentType: 'gif' | 'html' = 'html'
): CosmicVisualizationData {
  
  // Validate address
  if (!data.address || data.address === "Unknown" || !data.address.startsWith('0x') || data.address.length !== 42) {
    console.error("Invalid address in generateMetadata:", data.address);
    throw new Error(`Invalid address in cosmic data: ${data.address}`);
  }

  const isInteractive = contentType === 'html';
  // Use a different gateway that supports HTML files
  const ipfsUrl = `https://ipfs.io/ipfs/${contentCID}`;

  const metadata = {
    name: `${isInteractive ? 'Interactive ' : ''}Cosmic Graph: ${data.address.slice(0, 8)}...${data.address.slice(-6)}`,
    description: `An ${isInteractive ? 'interactive ' : ''}${layoutMode} layout visualization of Ethereum address ${data.address} showing ${data.connectedAddresses.length} connections and ${data.transactionCount} transactions.${isInteractive ? ' Experience a fully interactive 3D cosmic graph with multiple viewing modes and real-time animations.' : ''}`,
    image: ipfsUrl,
    // For HTML NFTs, animation_url is crucial for marketplaces to display the interactive content
    ...(isInteractive && {
      animation_url: ipfsUrl,
    }),
    attributes: [
      { trait_type: "Target Address", value: data.address },
      { trait_type: "Layout Type", value: layoutMode },
      { trait_type: "Content Type", value: isInteractive ? "Interactive HTML" : "Static GIF" },
      { trait_type: "Transaction Count", value: data.transactionCount },
      { trait_type: "Connected Addresses", value: data.connectedAddresses.length },
      { trait_type: "Balance (ETH)", value: (Number(data.balance) / 1e18).toFixed(4) },
      { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
      ...(isInteractive ? [
        { trait_type: "Interactive", value: "Yes" },
        { trait_type: "Features", value: "3D Navigation, Multiple Layouts, Real-time Animation" },
        { trait_type: "Technology", value: "HTML5 Canvas" }
      ] : [
        { trait_type: "Interactive", value: "No" }
      ])
    ],
  };

  return { metadata };
}

/**
 * NEW: Generate metadata using Pinata gateway format (matches current page.tsx)
 */
export function generateNFTMetadata(
  address: string,
  graphData: { nodes: any[], links: any[] },
  balance: string,
  htmlCid: string,
  layoutMode: 'shell' | 'force' | 'fibonacci' = 'shell'
): any {
  
  // Validate address
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    console.error("Invalid address in generateNFTMetadata:", address);
    throw new Error(`Invalid address: ${address}`);
  }

  // Use ipfs.io gateway that supports HTML files
  const ipfsUrl = `https://ipfs.io/ipfs/${htmlCid}`;

  const metadata = {
    name: `Interactive Cosmic Graph: ${address.slice(0, 8)}...${address.slice(-6)}`, // Match original format
    description: `An interactive ${layoutMode} layout visualization of Ethereum address ${address} showing ${graphData.links.length} connections and ${graphData.nodes.length} transactions. Experience a fully interactive 3D cosmic graph with multiple viewing modes and real-time animations.`, // Match original format
    image: ipfsUrl,
    animation_url: ipfsUrl, // Include animation_url for HTML
    attributes: [
      { trait_type: "Target Address", value: address }, // Match original
      { trait_type: "Layout Type", value: layoutMode }, // Match original
      { trait_type: "Content Type", value: "Interactive HTML" }, // Match original
      { trait_type: "Transaction Count", value: graphData.nodes.length }, // Match original
      { trait_type: "Connected Addresses", value: graphData.links.length }, // Match original
      { trait_type: "Balance (ETH)", value: parseFloat(balance).toFixed(4) }, // Match original format
      { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] }, // Match original
      { trait_type: "Interactive", value: "Yes" }, // Match original
      { trait_type: "Features", value: "3D Navigation, Multiple Layouts, Real-time Animation" }, // Match original
      { trait_type: "Technology", value: "HTML5 Canvas" } // Match original
    ],
  };

  return metadata;
}