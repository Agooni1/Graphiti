//Purpose:
//Provides small utility functions to keep your logic clean and reusable

import { GraphNode, FilterOptions, PairDataProps, GraphLink} from "./types";
import { AssetTransfersCategory, AssetTransfersResult, SortingOrder } from "alchemy-sdk";

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function sortNodesByBalance(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => {
    const aBal = parseFloat(a.balance || "0");
    const bBal = parseFloat(b.balance || "0");
    return bBal - aBal;
  });
}

export function dedupeNodes(nodes: GraphNode[]): GraphNode[] {
  const seen = new Set<string>();
  return nodes.filter(node => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

export const getETHBalance = async (address: string): Promise<string> => {
  try {
    const response = await fetch(`/api/blockchain/balance?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.balance || "...";
  } catch (err) {
    // Fail silently, cuz i dont wanna upgrade the API key
    return "...";
  }
};

export const isContract = async (address: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/blockchain/contract?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.isContract || false;
  } catch (err) {
    // Fail silently, return false (not a contract)
    return false;
  }
};

export const FilterAndSortTx = (
  transfers: AssetTransfersResult[],
  options: FilterOptions = {}
): AssetTransfersResult[] => {
  // Remove transfers with missing from/to addresses
  let validTransfers = transfers.filter(tx => tx.from && tx.to);

  // Direction filtering
  if (options.direction === "from") {
    // Sent: from the parent address
    validTransfers = validTransfers.filter(tx => tx.from?.toLowerCase() === options.address?.toLowerCase());
  } else if (options.direction === "to") {
    // Received: to the parent address
    validTransfers = validTransfers.filter(tx => tx.to?.toLowerCase() === options.address?.toLowerCase());
  }
  // "both" means no additional filtering

  const NewestFirst = [...validTransfers].sort((a, b) => {
    const blockA = Number(a.blockNum);
    const blockB = Number(b.blockNum);
    return blockB - blockA;
  });

  const OldestFirst = [...validTransfers].sort((a, b) => {
    const blockA = Number(a.blockNum);
    const blockB = Number(b.blockNum);
    return blockA - blockB;
  });

  const sorted = options.order === "oldest" ? OldestFirst : NewestFirst;
  const result = options.maxCount ? sorted.slice(0, options.maxCount) : sorted;

//   console.log("Filtered transfers:", result);
  return result;
};

export const FilterPair = (
  transfers: AssetTransfersResult[],
  parentAddress: string
): { from: string; to: string; direction: "inbound" | "outbound" }[] => {
  const pairs = new Map<string, "inbound" | "outbound">();
  const parent = parentAddress.toLowerCase();

  transfers.forEach(tx => {
    const from = tx.from?.toLowerCase();
    const to = tx.to?.toLowerCase();

    if (from === parent && to) {
      pairs.set(`${from}->${to}`, "outbound");
    } else if (to === parent && from) {
      pairs.set(`${from}->${to}`, "inbound");
    }
  });

  return Array.from(pairs.entries()).map(([pair, direction]) => {
    const [from, to] = pair.split("->");
    return { from, to, direction };
  });
};

export const filterTransfersByPair = (
  transfers: AssetTransfersResult[],
  pair: { from: string; to: string }
): AssetTransfersResult[] => {
  const fromLower = pair.from.toLowerCase();
  const toLower = pair.to.toLowerCase();

  return transfers.filter(tx =>
    tx.from?.toLowerCase() === fromLower &&
    tx.to?.toLowerCase() === toLower
  );
};

export const pairData = async ({ pairsFromParent, transfers }: PairDataProps): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> => {
  const nodes = new Set<string>();
  const links: GraphLink[] = [];
  const linkCounts: Record<string, number> = {};

  for (const pair of pairsFromParent) {
    const pairTxs = filterTransfersByPair(transfers, pair);
    let index = 0;

    nodes.add(pair.from.toLowerCase());
    nodes.add(pair.to.toLowerCase());

    for (const tx of pairTxs) {
      const key = `${pair.from}->${pair.to}`;
      links.push({
        source: tx.from.toLowerCase(),
        target: tx.to?.toLowerCase() ?? "CONTRACT_CREATION",
        transactionHash: tx.hash,
        curvatureIndex: index++,
        direction: pair.direction,
      });
    }
  }

  const graphNodes: GraphNode[] = await Promise.all(
    Array.from(nodes).map(async id => {
      const balance = await getETHBalance(id);
      const isCon = await isContract(id);
      return {
        id: id,
        balance: balance,
        isContract: isCon,
      };
    })
  );

  const graphData = { nodes: graphNodes, links: links };
  return graphData;
};

export async function fetchAllTransfers(address: string): Promise<AssetTransfersResult[]> {
  if (!address) return [];

  try {
    const response = await fetch(`/api/blockchain/transfers?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    console.log("Client received transfers:", data.transfers?.length || 0, "transfers");
    
    return data.transfers || [];
  } catch (err) {
    console.error("Failed to fetch transfers:", err);
    return [];
  }
}

const ethBalanceCache: Record<string, string> = {};
export async function getETHBalanceCached(address: string): Promise<string> {
  if (ethBalanceCache[address]) return ethBalanceCache[address];
  const balance = await getETHBalance(address);
  ethBalanceCache[address] = balance;
  return balance;
}

const contractCache: Record<string, boolean> = {};
export async function isContractCached(address: string): Promise<boolean> {
  if (address in contractCache) return contractCache[address];
  const result = await isContract(address);
  contractCache[address] = result;
  return result;
}

const transferCache: Record<string, AssetTransfersResult[]> = {};

export async function fetchAllTransfersCached(address: string): Promise<AssetTransfersResult[]> {
  if (transferCache[address] && transferCache[address].length > 0) {
    return transferCache[address];
  }
  const transfers = await fetchAllTransfers(address);
  if (transfers.length > 0) {
    transferCache[address] = transfers;
  }
  return transfers;
}

export async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<R[]> {
  const ret: R[] = [];
  const executing: Promise<void>[] = [];
  for (const item of array) {
    const p = Promise.resolve()
      .then(() => iteratorFn(item))
      .then(res => { ret.push(res); });
    executing.push(p);
    if (executing.length >= poolLimit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(e => e === p), 1);
    }
  }
  await Promise.all(executing);
  return ret;
}



