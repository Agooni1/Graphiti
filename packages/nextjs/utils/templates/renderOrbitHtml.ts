import { orbitTemplate } from "./orbitTemplate";

interface GraphData {
  nodes: any[];
  links: any[];
}

export function renderOrbitHTML({
  address,
  balance,
  graphData,
  timestamp
}: {
  address: string;
  balance: number;
  graphData: GraphData;
  timestamp: string;
}) {
  const addressShort = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  console.log('🎨 Rendering orbit HTML template...');
  console.log(`Address: ${address} -> ${addressShort}`);
  console.log(`Balance: ${balance}`);
  console.log(`Nodes: ${graphData.nodes.length}, Links: ${graphData.links.length}`);
  console.log('Sample node data:', graphData.nodes.slice(0, 2));
  console.log('Sample link data:', graphData.links.slice(0, 2));
  
  // DEBUG: Log the actual JSON that will be injected
  const nodeDataJson = JSON.stringify(graphData.nodes);
  const linkDataJson = JSON.stringify(graphData.links);
  
  console.log('🔍 JSON data being injected:');
  console.log('Node JSON length:', nodeDataJson.length);
  console.log('Link JSON length:', linkDataJson.length);
  console.log('Node JSON preview:', nodeDataJson.substring(0, 200) + '...');
  console.log('Link JSON preview:', linkDataJson.substring(0, 200) + '...');
  
  try {
    let rendered = orbitTemplate
      .replace(/\{\{ADDRESS_SHORT\}\}/g, addressShort)
      .replace(/\{\{TARGET_ADDRESS\}\}/g, address)
      .replace(/\{\{TARGET_ADDRESS_SHORT\}\}/g, addressShort)
      .replace(/\{\{NODE_COUNT\}\}/g, String(graphData.nodes.length))
      .replace(/\{\{LINK_COUNT\}\}/g, String(graphData.links.length))
      .replace(/\{\{TARGET_BALANCE\}\}/g, balance.toFixed(4))
      .replace(/\{\{TARGET_BALANCE_RAW\}\}/g, balance.toString())
      .replace(/\{\{TIMESTAMP\}\}/g, new Date(timestamp).toLocaleString());

    // DEBUG: Check JSON injection carefully
    console.log('🔄 About to inject JSON data...');
    
    // Escape the JSON strings properly for HTML embedding
    const escapedNodeJson = nodeDataJson.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const escapedLinkJson = linkDataJson.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    
    console.log('Escaped node JSON preview:', escapedNodeJson.substring(0, 100));
    console.log('Escaped link JSON preview:', escapedLinkJson.substring(0, 100));
    
    rendered = rendered
      .replace(/\{\{NODE_DATA_JSON\}\}/g, nodeDataJson)
      .replace(/\{\{LINK_DATA_JSON\}\}/g, linkDataJson);

    console.log('✅ Template rendering complete');
    console.log(`HTML size: ${rendered.length} characters`);
    
    // Verify no placeholders remain
    const remainingPlaceholders = rendered.match(/\{\{[^}]+\}\}/g);
    if (remainingPlaceholders) {
      console.warn('⚠️ Remaining placeholders:', remainingPlaceholders);
    } else {
      console.log('✅ All placeholders replaced successfully');
    }
    
    // Verify JSON data was actually injected
    if (rendered.includes(address) && rendered.includes('"id"')) {
      console.log('✅ Data injection verified - found address and node data');
    } else {
      console.error('❌ Data injection failed - missing critical data');
    }
    
    return rendered;
    
  } catch (error) {
    console.error('💥 Error rendering orbit HTML:', error);
    throw new Error(`Failed to render orbit HTML: ${error instanceof Error ? error.message : String(error)}`);
  }
}
