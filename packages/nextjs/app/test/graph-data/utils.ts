//Purpose:
//Provides small utility functions to keep your logic clean and reusable

import { GraphNode, FilterOptions} from "./types";
import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, AssetTransfersResult } from "alchemy-sdk";

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
    const rawBalance = await alchemy.core.getBalance(address);
    const eth = Number(rawBalance) / 1e18;
    return eth.toFixed(4);
  } catch (err) {
    console.error("Failed to fetch ETH balance:", err);
    return "Error";
  }
};

export const isContract = async (address: string): Promise<boolean> => {
  try {
    const bytecode = await alchemy.core.getCode(address);
    return bytecode !== "0x";
  } catch (err) {
    console.error("Failed to check contract status:", err);
    return false;
  }
};

export const FilterAndSortTx = (
  transfers: AssetTransfersResult[],
  options: FilterOptions = {}
): AssetTransfersResult[] => {

  const NewestFirst = [...transfers].sort((a, b) => {
    const blockA = Number(a.blockNum);
    const blockB = Number(b.blockNum);
    return blockB - blockA;
  });

  const OldestFirst = [...transfers].sort((a, b) => {
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

