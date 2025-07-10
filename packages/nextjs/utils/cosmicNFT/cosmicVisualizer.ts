import { AddressCosmicData } from "./fetchCosmicData";
import { generateLayout, LayoutConfig } from "../../app/explorer/graph/graphLayouts";
import { GraphNode } from "../../app/explorer/graph-data/types";

export interface CosmicVisualizationData {
  svg: string;
  metadata: any;
}

/**
 * Generate a cosmic SVG that matches the 3D graph visualization
 */
export function generateCosmicSVG(data: AddressCosmicData, layoutMode: 'shell' | 'force' | 'fibonacci' = 'shell'): CosmicVisualizationData {
  const width = 1000;
  const height = 1000;
  const centerX = width / 2;
  const centerY = height / 2;

  // Convert cosmic data to graph format
  const graphData = {
    nodes: [
      // Target node (center)
      {
        id: data.address,
        balance: (Number(data.balance) / 1e18).toString(),
        isContract: false,
        label: `${data.address.slice(0, 6)}...${data.address.slice(-4)}`
      },
      // Connected addresses
      ...data.connectedAddresses.slice(0, 20).map(addr => ({
        id: addr,
        balance: (Math.random() * 10).toString(), // Would need real balance data
        isContract: Math.random() > 0.8,
        label: `${addr.slice(0, 6)}...${addr.slice(-4)}`
      }))
    ] as GraphNode[],
    links: [] as { source: string; target: string; value: number }[]
  };

  // Generate links from target to all connected addresses
  data.connectedAddresses.slice(0, 20).forEach(addr => {
    graphData.links.push({
      source: data.address,
      target: addr,
      value: Math.random() * 100
    });
  });

  // Generate 3D layout
  const layoutConfig: LayoutConfig = {
    layoutMode,
    targetNodeId: data.address,
    graphData
  };

  const positionedNodes = generateLayout(layoutConfig);

  // Project 3D to 2D for SVG (fixed camera angle)
  const rotX = 0.2; // Slight tilt
  const rotY = 0.3; // Slight rotation
  const projectedNodes = positionedNodes.map(node => {
    const { screenX, screenY, depth } = project3DTo2D(node, rotX, rotY);
    return {
      ...node,
      screenX: screenX + centerX,
      screenY: screenY + centerY,
      depth,
      size: Math.max(2, 8 - depth * 0.01), // Size based on depth
      opacity: Math.max(0.3, 1 - Math.abs(depth) * 0.001) // Opacity based on depth
    };
  }).sort((a, b) => a.depth - b.depth); // Draw back to front

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" 
         style="background: linear-gradient(45deg, #0a0a0a, #1a1a2e, #16213e);">
      <defs>
        ${generateSVGFilters()}
        ${generateNodeGradients(positionedNodes)}
      </defs>
      
      <!-- Background stars -->
      ${generateBackgroundStars(width, height)}
      
      <!-- Connection lines (back to front) -->
      ${generateConnections(projectedNodes, graphData.links)}
      
      <!-- Nodes (back to front) -->
      ${generateNodes(projectedNodes, data.address)}
      
      <!-- Center glow effect -->
      <circle cx="${centerX}" cy="${centerY}" r="100" 
              fill="url(#centerGlow)" opacity="0.3"/>
      
      <!-- Stats overlay -->
      ${generateStatsOverlay(data, width, height)}
      
      <!-- Title -->
      <text x="${centerX}" y="50" text-anchor="middle" 
            fill="white" font-size="24" font-weight="bold" 
            filter="url(#textGlow)">
        Cosmic Graph: ${layoutMode.toUpperCase()}
      </text>
    </svg>
  `;

  const metadata = {
    name: `Cosmic Graph: ${data.address.slice(0, 8)}...${data.address.slice(-6)}`,
    description: `A ${layoutMode} layout visualization of Ethereum address ${data.address} showing ${data.connectedAddresses.length} connections and ${data.transactionCount} transactions.`,
    image: `data:image/svg+xml;base64,${btoa(svg)}`,
    attributes: [
      { trait_type: "Target Address", value: data.address },
      { trait_type: "Layout Type", value: layoutMode },
      { trait_type: "Transaction Count", value: data.transactionCount },
      { trait_type: "Connected Addresses", value: data.connectedAddresses.length },
      { trait_type: "Balance (ETH)", value: (Number(data.balance) / 1e18).toFixed(4) },
      { trait_type: "Generation Date", value: new Date().toISOString().split('T')[0] },
    ],
  };

  return { svg, metadata };
}

// Helper functions
function project3DTo2D(node: any, rotX: number, rotY: number) {
  const cosRotX = Math.cos(rotX);
  const sinRotX = Math.sin(rotX);
  const cosRotY = Math.cos(rotY);
  const sinRotY = Math.sin(rotY);

  let y1 = node.y * cosRotX - node.z * sinRotX;
  let z1 = node.y * sinRotX + node.z * cosRotX;
  let x2 = node.x * cosRotY + z1 * sinRotY;
  let z2 = -node.x * sinRotY + z1 * cosRotY;

  const distance = 600;
  const perspective = distance / (distance + z2);
  
  return {
    screenX: x2 * perspective * 0.5, // Scale down for SVG
    screenY: y1 * perspective * 0.5,
    depth: z2
  };
}

function generateSVGFilters() {
  return `
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="smallGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd93d" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#74b9ff" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  `;
}

function generateNodeGradients(nodes: any[]) {
  return nodes.map((node, i) => {
    const balance = parseFloat(node.balance || '0');
    let color1, color2;
    
    if (node.galaxyLayer === 'core') {
      color1 = node.isContract ? '#ff6b6b' : '#ffd93d';
      color2 = node.isContract ? '#ff4757' : '#ffa502';
    } else if (node.galaxyLayer === 'inner') {
      color1 = '#74b9ff';
      color2 = '#0984e3';
    } else {
      color1 = '#ffffff';
      color2 = '#ddd';
    }
    
    return `
      <radialGradient id="nodeGradient${i}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </radialGradient>
    `;
  }).join('');
}

function generateBackgroundStars(width: number, height: number) {
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
  }));

  return stars.map(star => 
    `<circle cx="${star.x}" cy="${star.y}" r="${star.size}" 
             fill="white" opacity="${star.opacity}" filter="url(#smallGlow)"/>`
  ).join('');
}

function generateConnections(projectedNodes: any[], links: any[]) {
  return links.map(link => {
    const sourceNode = projectedNodes.find(n => n.id === link.source);
    const targetNode = projectedNodes.find(n => n.id === link.target);
    
    if (!sourceNode || !targetNode) return '';
    
    const avgOpacity = (sourceNode.opacity + targetNode.opacity) / 2;
    
    return `
      <line x1="${sourceNode.screenX}" y1="${sourceNode.screenY}" 
            x2="${targetNode.screenX}" y2="${targetNode.screenY}" 
            stroke="rgba(97, 218, 251, ${avgOpacity * 0.6})" 
            stroke-width="1" filter="url(#smallGlow)"/>
      
      <!-- Animated particle -->
      <circle r="2" fill="rgba(97, 218, 251, ${avgOpacity})">
        <animateMotion dur="3s" repeatCount="indefinite">
          <mpath href="#path${link.source.slice(-6)}${link.target.slice(-6)}"/>
        </animateMotion>
      </circle>
      
      <path id="path${link.source.slice(-6)}${link.target.slice(-6)}" 
            d="M${sourceNode.screenX},${sourceNode.screenY} L${targetNode.screenX},${targetNode.screenY}" 
            fill="none" opacity="0"/>
    `;
  }).join('');
}

function generateNodes(projectedNodes: any[], targetAddress: string) {
  return projectedNodes.map((node, i) => {
    const isTarget = node.id === targetAddress;
    const size = isTarget ? node.size * 2 : node.size;
    
    return `
      <g opacity="${node.opacity}">
        <!-- Node glow -->
        <circle cx="${node.screenX}" cy="${node.screenY}" r="${size * 3}" 
                fill="url(#nodeGradient${i})" opacity="0.3" filter="url(#glow)"/>
        
        <!-- Main node -->
        <circle cx="${node.screenX}" cy="${node.screenY}" r="${size}" 
                fill="url(#nodeGradient${i})" filter="url(#smallGlow)"/>
        
        ${isTarget ? `
          <!-- Target indicator -->
          <circle cx="${node.screenX}" cy="${node.screenY}" r="${size + 5}" 
                  fill="none" stroke="#ffd93d" stroke-width="2" opacity="0.8">
            <animate attributeName="r" values="${size + 5};${size + 15};${size + 5}" 
                     dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" 
                     dur="2s" repeatCount="indefinite"/>
          </circle>
        ` : ''}
        
        <!-- Label -->
        ${size > 3 ? `
          <text x="${node.screenX}" y="${node.screenY + size + 15}" 
                text-anchor="middle" fill="white" font-size="8" opacity="${node.opacity}">
            ${node.label}
          </text>
        ` : ''}
      </g>
    `;
  }).join('');
}

function generateStatsOverlay(data: AddressCosmicData, width: number, height: number) {
  const balanceInEth = (Number(data.balance) / 1e18).toFixed(4);
  
  return `
    <g opacity="0.8">
      <rect x="20" y="20" width="250" height="120" fill="rgba(0,0,0,0.7)" 
            rx="10" stroke="rgba(97, 218, 251, 0.3)" stroke-width="1"/>
      
      <text x="30" y="45" fill="white" font-size="14" font-weight="bold">
        Cosmic Statistics
      </text>
      
      <text x="30" y="65" fill="#74b9ff" font-size="12">
        Balance: ${balanceInEth} ETH
      </text>
      
      <text x="30" y="85" fill="#74b9ff" font-size="12">
        Transactions: ${data.transactionCount}
      </text>
      
      <text x="30" y="105" fill="#74b9ff" font-size="12">
        Connections: ${data.connectedAddresses.length}
      </text>
      
      <text x="30" y="125" fill="#74b9ff" font-size="10">
        Generated: ${new Date().toISOString().split('T')[0]}
      </text>
    </g>
  `;
}

//For Testing:
//gasEstimate was set to return True
// page.tsx connected address set to main account

//Get the graph to look like exactly like the 3D graph
//might have to try canvas to image conversion
//but want seperat page for minting idk