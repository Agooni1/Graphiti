import { AddressCosmicData } from "./fetchCosmicData";

export interface CosmicVisualizationData {
  svg: string;
  metadata: any;
}

/**
 * Generate a cosmic SVG visualization of an Ethereum address
 */
export function generateCosmicSVG(data: AddressCosmicData): CosmicVisualizationData {
  const width = 800;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate sizes based on data
  const balanceInEth = Number(data.balance) / 1e18;
  const centralStarSize = Math.max(15, Math.min(50, Math.log(balanceInEth + 1) * 8));
  
  // Create orbiting bodies from connected addresses
  const orbitingBodies = data.connectedAddresses.slice(0, 12).map((addr, i) => {
    const angle = (i / data.connectedAddresses.length) * 2 * Math.PI;
    const radius = 80 + (i * 25);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const bodySize = 3 + (Math.random() * 8);
    
    return {
      x,
      y,
      radius: bodySize,
      orbitRadius: radius,
      color: `hsl(${(i * 137.508) % 360}, 70%, ${50 + Math.random() * 30}%)`,
      address: addr,
    };
  });

  // Generate background stars
  const backgroundStars = Array.from({ length: 100 }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
  }));

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(45deg, #0a0a0a, #1a1a2e, #16213e);">
      <defs>
        <radialGradient id="centralStar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFD700" stop-opacity="1"/>
          <stop offset="70%" stop-color="#FF8C00" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#FF6B35" stop-opacity="0.4"/>
        </radialGradient>
        
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <filter id="smallGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background stars -->
      ${backgroundStars.map(star => 
        `<circle cx="${star.x}" cy="${star.y}" r="${star.size}" 
                 fill="white" opacity="${star.opacity}" filter="url(#smallGlow)"/>`
      ).join('')}
      
      <!-- Orbital paths -->
      ${orbitingBodies.map(body => 
        `<circle cx="${centerX}" cy="${centerY}" r="${body.orbitRadius}" 
                 fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="5,5"/>`
      ).join('')}
      
      <!-- Connection lines -->
      ${orbitingBodies.map(body => 
        `<line x1="${centerX}" y1="${centerY}" x2="${body.x}" y2="${body.y}" 
               stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`
      ).join('')}
      
      <!-- Orbiting addresses -->
      ${orbitingBodies.map((body, i) => `
        <g>
          <circle cx="${body.x}" cy="${body.y}" r="${body.radius}" 
                  fill="${body.color}" filter="url(#smallGlow)"/>
          <text x="${body.x}" y="${body.y + body.radius + 12}" 
                text-anchor="middle" fill="white" font-size="8" opacity="0.7">
            ${body.address.slice(0, 6)}...
          </text>
        </g>
      `).join('')}
      
      <!-- Central star (main address) -->
      <circle cx="${centerX}" cy="${centerY}" r="${centralStarSize}" 
              fill="url(#centralStar)" filter="url(#glow)"/>
      
      <!-- Address label -->
      <text x="${centerX}" y="${centerY + centralStarSize + 25}" 
            text-anchor="middle" fill="white" font-size="12" font-weight="bold">
        ${data.address.slice(0, 8)}...${data.address.slice(-6)}
      </text>
      
      <!-- Stats -->
      <text x="20" y="30" fill="white" font-size="14" opacity="0.8">
        Balance: ${balanceInEth.toFixed(4)} ETH
      </text>
      <text x="20" y="50" fill="white" font-size="14" opacity="0.8">
        Transactions: ${data.transactionCount}
      </text>
      <text x="20" y="70" fill="white" font-size="14" opacity="0.8">
        Connections: ${data.connectedAddresses.length}
      </text>
      
      <!-- Timestamp -->
      <text x="${width - 20}" y="${height - 20}" text-anchor="end" fill="white" 
            font-size="10" opacity="0.5">
        Generated: ${new Date().toISOString().split('T')[0]}
      </text>
    </svg>
  `;

  const truncatedAddress = `${data.address.slice(0, 8)}...${data.address.slice(-6)}`;

  const metadata = {
    name: `Cosmic Graph: ${truncatedAddress}`,
    description: `A cosmic visualization of Ethereum address ${data.address}...`,
    // Instead of uploading SVG separately, embed it as data URL
    image: `data:image/svg+xml;base64,${btoa(svg)}`,
    animation_url: `data:image/svg+xml;base64,${btoa(svg)}`,
    attributes: [
      { trait_type: "Target Address", value: data.address },
      { trait_type: "Balance (ETH)", value: balanceInEth.toFixed(4) },
      { trait_type: "Transaction Count", value: data.transactionCount },
      { trait_type: "Connected Addresses", value: data.connectedAddresses.length },
      { trait_type: "Token Holdings", value: data.tokenBalances.length },
      { trait_type: "NFT Count", value: data.nftCount },
      { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
    ],
    cosmic_data: {
      target_address: data.address,
      balance_wei: data.balance.toString(),
      connected_addresses: data.connectedAddresses,
      generation_timestamp: Date.now(),
    }
  };

  return { svg, metadata };
}