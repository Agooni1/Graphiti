//Purpose:
// Converts raw Ethereum transaction data (usually from Alchemy or Etherscan) 
// into a format usable by your graph component: an array of GraphNodes and GraphLinks.

import { GraphNode, GraphLink } from "./types";
import { getETHBalanceCached, isContractCached } from "./utils"; // Import your balance fetcher

export interface Transfer {
  from: string;
  to: string;
  hash: string;
  value?: string;
}

export async function generateNodesFromTx(
  transfers: Transfer[]
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const linkCounts: Record<string, number> = {};
  const linkIndices: Record<string, number> = {};

  for (const tx of transfers) {
    if (!nodesMap.has(tx.from)) {
      nodesMap.set(tx.from, {
        id: tx.from,
        label: `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`,
        balance: await getETHBalanceCached(tx.from),
        isContract: await isContractCached(tx.from),
      });
    }
    if (!nodesMap.has(tx.to)) {
      nodesMap.set(tx.to, {
        id: tx.to,
        label: `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`,
        balance: await getETHBalanceCached(tx.to),
        isContract: await isContractCached(tx.to),
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



  const nodes = Array.from(nodesMap.values());
  return {
    nodes,
    links,
  };
}