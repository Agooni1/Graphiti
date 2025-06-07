import React from "react";
import { AssetTransfersCategory, AssetTransfersResult } from "alchemy-sdk";
import { FilterOptions } from "./types";

// interface FilterOptions {
//   maxCount?: number;
//   maxChild?: number;
//   order?: "newest" | "oldest";
// }

interface Props {
  transfers: AssetTransfersResult[];
  options?: FilterOptions;
}

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

//below works for from only
// export const FilterPair = (
//   transfers: AssetTransfersResult[],
//   parentAddress: string
// ): { from: string; to: string }[] => {
//   const pairs = new Set<string>();
//   const parent = parentAddress.toLowerCase();

//   transfers.forEach(tx => {
//     if (tx.from?.toLowerCase() === parent && tx.to) {
//       const pairKey = `${tx.from.toLowerCase()}->${tx.to.toLowerCase()}`;
//       pairs.add(pairKey);
//     }
//   });

//   return Array.from(pairs).map(pair => {
//     const [from, to] = pair.split("->");
//     return { from, to };
//   });
// }

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