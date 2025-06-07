import { GraphNode, GraphLink, PairDataProps } from "./types";
import { filterTransfersByPair } from "./filterAndSort";
import { AssetTransfersResult } from "alchemy-sdk";
import { getETHBalance, isContract } from "./utils";


export const pairData = async ({ pairsFromParent, transfers }: PairDataProps) => {
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