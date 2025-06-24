import fs from 'fs';
import path from 'path';

import { GraphNode, GraphLink } from '~~/app/test/graph-data/types';

interface CosmicGraphData {
  address: string;
  balance: number;
  graphData: { nodes: any[]; links: any[] };
  timestamp: string;
}

export const cosmicGraphTemplateEngine = {
  async generateCosmicGraphHTML(data: CosmicGraphData): Promise<string> {
    const { address, balance, graphData, timestamp } = data;
    
    try {
      const response = await fetch('/orbit-graph.html');
      if (!response.ok) {
        throw new Error(`Failed to fetch orbit-graph.html: ${response.status} ${response.statusText}`);
      }
      
      let htmlContent = await response.text();
      console.log('Successfully fetched orbit-graph.html, size:', htmlContent.length);
      
      const addressShort = `${address.slice(0, 6)}...${address.slice(-4)}`;
      
      console.log('🔄 Replacing template variables...');
      console.log(`Address: ${address} -> ${addressShort}`);
      console.log(`Nodes: ${graphData.nodes.length}, Links: ${graphData.links.length}`);
      
      // Replace simple text placeholders first
      htmlContent = htmlContent.replace(/\{\{ADDRESS_SHORT\}\}/g, addressShort);
      htmlContent = htmlContent.replace(/\{\{TARGET_ADDRESS\}\}/g, address);
      htmlContent = htmlContent.replace(/\{\{TARGET_ADDRESS_SHORT\}\}/g, addressShort);
      htmlContent = htmlContent.replace(/\{\{NODE_COUNT\}\}/g, graphData.nodes.length.toString());
      htmlContent = htmlContent.replace(/\{\{LINK_COUNT\}\}/g, graphData.links.length.toString());
      htmlContent = htmlContent.replace(/\{\{TARGET_BALANCE\}\}/g, balance.toFixed(4));
      htmlContent = htmlContent.replace(/\{\{TARGET_BALANCE_RAW\}\}/g, balance.toString());
      htmlContent = htmlContent.replace(/\{\{TIMESTAMP\}\}/g, new Date(timestamp).toLocaleString());
      
      // FIX: Replace the entire problematic JSON parsing blocks
      console.log('🔄 Fixing JSON data injection...');
      
      // Replace the entire nodes parsing line
      const nodeDataJson = JSON.stringify(graphData.nodes);
      htmlContent = htmlContent.replace(
        /nodes: JSON\.parse\('{{NODE_DATA_JSON}}'\.includes\('{{\) \? '\[\]' : '{{NODE_DATA_JSON}}'\)/g,
        `nodes: ${nodeDataJson}`
      );
      
      // Replace the entire links parsing line
      const linkDataJson = JSON.stringify(graphData.links);
      htmlContent = htmlContent.replace(
        /links: JSON\.parse\('{{LINK_DATA_JSON}}'\.includes\('{{\) \? '\[\]' : '{{LINK_DATA_JSON}}'\)/g,
        `links: ${linkDataJson}`
      );
      
      // Verify no placeholders remain
      const remainingPlaceholders = htmlContent.match(/\{\{[^}]+\}\}/g);
      if (remainingPlaceholders) {
        console.warn('⚠️ Remaining placeholders:', remainingPlaceholders);
      } else {
        console.log('✅ All placeholders replaced successfully');
      }
      
      // Verify JSON injection
      if (htmlContent.includes('"id"') && htmlContent.includes('"source"')) {
        console.log('✅ JSON data injection verified');
      } else {
        console.warn('❌ JSON data injection may have failed');
      }
      
      console.log('✅ Template processing complete');
      console.log(`Final HTML size: ${htmlContent.length} characters`);
      
      return htmlContent;
      
    } catch (error) {
      console.error('💥 Error generating cosmic graph HTML:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate cosmic graph HTML: ${error.message}`);
      } else {
        throw new Error('Failed to generate cosmic graph HTML: Unknown error');
      }
    }
  }
};