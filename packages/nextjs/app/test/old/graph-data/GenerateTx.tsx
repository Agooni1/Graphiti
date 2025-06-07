"use client";
import { useEffect } from "react";
import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, SortingOrder } from "alchemy-sdk";
import { GraphNode, GraphLink } from "./types";
import { generateNodesFromTx, Transfer } from "./generateNodesFromTx";
// import { filterAndSortTransfers } from "./filterAndSort";
import { FilterAndSortTx, FilterPair, filterTransfersByPair } from "./filterAndSort";
import { pairData } from "./pairData";


interface DataProps {
  address: string;
  NumNodes?: number;
  NumLayers?: number;
  txNum?: number;
  direction: "from" | "to" | "both"; // ← add this line
  onGraphDataReady: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
}

export const GenerateTx = ({ address, NumNodes = 0, txNum, NumLayers = 0, direction, onGraphDataReady }: DataProps) => {
// export const GenerateTx = ({ address, NumNodes = 0, NumLayers = 0 }: DataProps) => {

  useEffect(() => { 

    const fetchTransfers = async (addr: string, currentDepth: number) => {
  const commonParams = {
    fromBlock: "0x0",
    toBlock: "latest",
    maxCount: txNum,
    category: [
      AssetTransfersCategory.EXTERNAL,
      AssetTransfersCategory.INTERNAL,
      AssetTransfersCategory.ERC20,
      AssetTransfersCategory.ERC721,
      AssetTransfersCategory.ERC1155,
    ],
    order: SortingOrder.DESCENDING,
  };

  let allTransfers: any[] = [];
  if (direction === "from") {
    const resFrom = await alchemy.core.getAssetTransfers({ ...commonParams, fromAddress: addr });
    allTransfers = resFrom.transfers;
  } else if (direction === "to") {
    const resTo = await alchemy.core.getAssetTransfers({ ...commonParams, toAddress: addr });
    allTransfers = resTo.transfers;
  } else {
    const [resFrom, resTo] = await Promise.all([
      alchemy.core.getAssetTransfers({ ...commonParams, fromAddress: addr }),
      alchemy.core.getAssetTransfers({ ...commonParams, toAddress: addr }),
    ]);
    allTransfers = [...resFrom.transfers, ...resTo.transfers];

    // Sort by blockNumber (or timestamp if available), descending (most recent first)
    allTransfers.sort((a, b) => {
      // blockNumber is hex string, so parseInt
      return parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16);
    });

    // Take only the first txNum
    allTransfers = allTransfers.slice(0, (txNum ?? 1));
  }
  // console.log ('allTransfer:', allTransfers);

  const pairsFromParent = FilterPair(allTransfers, addr);
  // console.log("FilterPair:", pairsFromParent);
  const pairdata = await pairData({ pairsFromParent, transfers: allTransfers });
  console.log("GenerateTx pairdata:", pairdata);

  onGraphDataReady(pairdata);
};

    if (address) {
    fetchTransfers(address, 0); // <- You need this
    }
    
  }, [address, txNum, direction]);
  return null;
}











//OK THIS ONE WORKS (PRE ToAddress implementation)
    // const fetchTransfers = async (addr: string, currentDepth: number) => {
    //   const res = await alchemy.core.getAssetTransfers({
    //       fromBlock: "0x0",
    //       toBlock: "latest",
    //       maxCount: 15,
    //       category: [
    //         AssetTransfersCategory.EXTERNAL,
    //         AssetTransfersCategory.INTERNAL,
    //         AssetTransfersCategory.ERC20,
    //         AssetTransfersCategory.ERC721,
    //         AssetTransfersCategory.ERC1155,
    //       ],
    //       fromAddress: addr,
    //       // toAddress: addr,
    //       order: SortingOrder.DESCENDING,
    //     });
    //     // console.log("RES Transfers:", res.transfers);
    //     // const filtered = FilterAndSortTx(res.transfers, { order: "oldest", maxCount: 5 }); // or "newest"
    //     // console.log("back to top Filtered transfers:", filtered);

    //     const pairsFromParent = FilterPair(res.transfers, addr);
    //     console.log("PAIRSFROMPARENT:")
    //     console.log(pairsFromParent);
    //     // console.log("Pairs from parent:", pairsFromParent);

    //     // if (pairsFromParent.length > 0) {
    //     //   const samplePair = pairsFromParent[6];
    //     //   const pairTxs = filterTransfersByPair(res.transfers, samplePair);
    //     //   console.log(`Transactions from ${samplePair.from} → ${samplePair.to}:`, pairTxs);
    //     // }
    //     // for (const pair of pairsFromParent) {
    //     //     const pairTxs = filterTransfersByPair(res.transfers, pair);
    //     //     console.log(`Transactions from ${pair.from} → ${pair.to}:`, pairTxs);
    //     // }

    //     const pairdata = pairData({ pairsFromParent, transfers: res.transfers });
    //     console.log("PAIR DATA:", pairdata);

    //     onGraphDataReady(pairdata);

    // };