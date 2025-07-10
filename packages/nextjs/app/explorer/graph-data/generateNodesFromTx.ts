//Purpose:
// Converts raw Ethereum transaction data (usually from Alchemy or Etherscan) 
// into a format usable by your graph component: an array of GraphNodes and GraphLinks.

import { GraphNode, GraphLink } from "./types";
import { getETHBalanceCached, isContractCached, asyncPool } from "./utils";

export interface Transfer {
  from: string;
  to: string;
  hash: string;
  value?: string;
}

export async function generateNodesFromTx(
  transfers: Transfer[],
  chain: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const linkCounts: Record<string, number> = {};
  const linkIndices: Record<string, number> = {};

  // 1. Collect all unique addresses
  const addresses = Array.from(
    new Set(transfers.flatMap(tx => [tx.from, tx.to]))
  );
  const total = addresses.length;
  let loaded = 0;

  // 2. Batch fetch balances and contract statuses with limited concurrency
  const concurrency = 1; // Adjust as needed for your API limits

  const addressData = await asyncPool(
    concurrency,
    addresses,
    async (address) => {
      const [balance, isContract] = await Promise.all([
        getETHBalanceCached(address),
        isContractCached(address),
      ]);
      loaded++;
      if (onProgress) onProgress(loaded, total);
      return { address, balance, isContract };
    }
  );

  // 3. Build nodesMap from fetched data
  for (const { address, balance, isContract } of addressData) {
    nodesMap.set(address, {
      id: address,
      label: `${address.slice(0, 6)}...${address.slice(-4)}`,
      balance,
      isContract,
    });
  }

  // 4. Build links as before
  for (const tx of transfers) {
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
  console.log("nodedata:", nodes)
  return {
    nodes,
    links,
  };
}