//Purpose:
// Converts raw Ethereum transaction data (usually from Alchemy or Etherscan) 
// into a format usable by your graph component: an array of GraphNodes and GraphLinks.

import { GraphNode, GraphLink } from "./types";

export interface Transfer {
  from: string;
  to: string;
  hash: string;
  value?: string;
}

export function generateNodesFromTx(transfers: Transfer[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const linkCounts: Record<string, number> = {};
  const linkIndices: Record<string, number> = {};

  for (const tx of transfers) {
    if (!nodesMap.has(tx.from)) {
      nodesMap.set(tx.from, {
        id: tx.from,
        label: tx.from,
      });
    }

    if (!nodesMap.has(tx.to)) {
      nodesMap.set(tx.to, {
        id: tx.to,
        label: tx.to,
      });
    }

    const key = `${tx.from}->${tx.to}`;
    const count = (linkCounts[key] = (linkCounts[key] || 0) + 1);
    const index = (linkIndices[key] = count - 1);

    links.push({
      source: tx.from,
      target: tx.to,
      transactionHash: tx.hash,
      curvatureIndex: index,
    });
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
  };
}