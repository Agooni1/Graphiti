import { GraphNode, GraphLink } from "./types";
import { filterTransfersByPair } from "./filterAndSort";
import { AssetTransfersResult } from "alchemy-sdk";
import { getETHBalance } from "./ETHBalance";
import { isContract } from "./IsContract";

interface PairDataProps {
  pairsFromParent: { from: string; to: string; direction: "inbound" | "outbound"; }[];
  transfers: AssetTransfersResult[];
}

export const pairData = async ({ pairsFromParent, transfers }: PairDataProps) => {
  const nodes = new Set<string>();
  const links: GraphLink[] = [];
  const linkCounts: Record<string, number> = {};

  for (const pair of pairsFromParent) {
    const pairTxs = filterTransfersByPair(transfers, pair);
    // console.log(pair);
    // console.log("pairTx:", pairTxs);
    // console.log("direction:",pair.direction);
    let index = 0;

    nodes.add(pair.from.toLowerCase());
    nodes.add(pair.to.toLowerCase());

    // links.push({
    //   source: pair.from.toLowerCase(),
    //   target: pair.to.toLowerCase(),
    //   //target: tx.to?.toLowerCase() ?? "CONTRACT_CREATION" //to implement later
    //   txs: pairTxs,
    // });
    // for (const tx of pairTxs) {
    //     links.push({
    //         source: pair.from.toLowerCase(),
    //         target: pair.to.toLowerCase(),
    //         txs: [tx], // each link now represents a single tx
    //     });
    
    for (const tx of pairTxs) {
        // console.log("pairData tx:",tx);
        const key = `${pair.from}->${pair.to}`; //for later maybe
        
        // console.log("key:",key);
        // console.log('tx:',tx);
        links.push({
            source: tx.from.toLowerCase(),
            target: tx.to?.toLowerCase() ?? "CONTRACT_CREATION", //contract crreation prob logic on like filterAndSort
            transactionHash: tx.hash,
            curvatureIndex: index++,
            // tx: tx as AssetTransfersResult,
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
//   console.log("graphNodes:", graphNodes)

//   console.log("Graph Data:", graphData);
  return graphData;

};