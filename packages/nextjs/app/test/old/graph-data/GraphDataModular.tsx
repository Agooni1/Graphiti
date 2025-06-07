"use client";
import { useEffect } from "react";
import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, SortingOrder } from "alchemy-sdk";
import { GraphNode, GraphLink } from "./types";
import { generateNodesFromTx, Transfer } from "./generateNodesFromTx";

interface GraphDataProps {
  address: string;
  depth?: number;
  maxDepth?: number;
  onGraphDataReady: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
}

export const GraphDatamodular = ({ address, depth = 0, maxDepth = 2, onGraphDataReady }: GraphDataProps) => {
  useEffect(() => {
    const buildGraph = async () => {
      const visited = new Set<string>();
      const transferList: Transfer[] = [];
      const metadataMap = new Map<string, { isContract: boolean; balance: string }>();

      const traverse = async (addr: string, currentDepth: number) => {
        addr = addr.toLowerCase();
        if (visited.has(addr) || currentDepth > maxDepth) return;
        visited.add(addr);
        if (currentDepth === maxDepth) return;

        const res = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          toBlock: "latest",
          maxCount: 15,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.INTERNAL,
            AssetTransfersCategory.ERC20,
            AssetTransfersCategory.ERC721,
            AssetTransfersCategory.ERC1155,
          ],
          fromAddress: addr,
          order: SortingOrder.DESCENDING,
        });

        const code = await alchemy.core.getCode(addr);
        const balance = await alchemy.core.getBalance(addr);
        metadataMap.set(addr, {
          isContract: code !== "0x",
          balance: (Number(balance) / 1e18).toFixed(4),
        });

        for (const tx of res.transfers) {
          if (tx.from && tx.to && tx.hash) {
            const from = tx.from.toLowerCase();
            const to = tx.to.toLowerCase();
            transferList.push({ from, to, hash: tx.hash });
            await traverse(to, currentDepth + 1);
          }
        }
      };

      await traverse(address, depth);

      const { nodes, links } = generateNodesFromTx(transferList);

      for (const node of nodes) {
        const meta = metadataMap.get(node.id);
        if (meta) {
          node.isContract = meta.isContract;
          node.balance = meta.balance;
        }
      }

      onGraphDataReady({ nodes, links });
    };

    buildGraph();
  }, [address]);

  return null;
};