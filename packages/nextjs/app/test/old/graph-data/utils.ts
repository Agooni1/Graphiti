//Purpose:
//Provides small utility functions to keep your logic clean and reusable

import { GraphNode } from "./types";

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