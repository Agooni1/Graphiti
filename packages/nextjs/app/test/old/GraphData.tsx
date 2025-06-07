// "use client";
import { useEffect, useState } from "react";
import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, AssetTransfersResponse, SortingOrder } from "alchemy-sdk";
import { WrapperChild } from "./WrapperChild";

interface GraphDataProps {
  address: string;
  depth?: number;
  maxDepth?: number;
  onGraphDataReady: (data: { nodes: any[]; links: any[] }) => void;
}

export const GraphData = ({ address, depth = 0, maxDepth = 2, onGraphDataReady }: GraphDataProps) => {
  useEffect(() => {
    const buildGraph = async () => {
      const nodes: any[] = [];
      const links: any[] = [];
      const visited = new Set<string>();
      const linkGroups = new Map<string, any[]>();

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
            AssetTransfersCategory.ERC1155
          ],
          fromAddress: addr,
          order: SortingOrder.DESCENDING,
        });
        console.log("GRAPHDATA Fetched transfers count:", res.transfers.length);
        console.log("Transfers:", res.transfers);    
        const code = await alchemy.core.getCode(addr);
        const balance = await alchemy.core.getBalance(addr);

        if (!nodes.find(n => n.id === addr)) {
          nodes.push({
            id: addr,
            label: addr,
            isContract: code !== "0x",
            balance: balance ? (Number(balance) / 1e18).toFixed(4) : "0.0",
          });
        }

        const addrWithDetails = new Map<string, { from: string; hash: string; date: string; category: string | null }[]>();

        for (const transfer of res.transfers) {
          const to = transfer.to?.toLowerCase();
          const from = transfer.from?.toLowerCase();
          const blockNumHex = transfer.blockNum;
          const hash = transfer.hash;
          const category = transfer.category ?? null;

          if (blockNumHex && hash) {
            const block = await alchemy.core.getBlock(parseInt(blockNumHex, 16));
            const dateStr = new Date(block.timestamp * 1000).toLocaleString();

            if (to && from && to !== addr) {
              const arr = addrWithDetails.get(to) ?? [];
              arr.push({ from, hash, date: dateStr, category });
              addrWithDetails.set(to, arr);
            }
          }
        }

        for (const [otherAddr, metas] of addrWithDetails.entries()) {
          for (const meta of metas) {
            // Ensure otherAddr is in nodes, else add it
            if (!nodes.find(n => n.id === otherAddr)) {
              const code = await alchemy.core.getCode(otherAddr);
              const balance = await alchemy.core.getBalance(otherAddr);
              nodes.push({
                id: otherAddr,
                label: otherAddr,
                isContract: code !== "0x",
                balance: balance ? (Number(balance) / 1e18).toFixed(4) : "0.0",
              });
            }

            const key = `${meta.from.toLowerCase()}->${otherAddr.toLowerCase()}`;
            const group = linkGroups.get(key) ?? [];
            const curvatureIndex = group.length;

            if (group.length > 0) {
              console.log(`Existing group for ${meta.from} -> ${otherAddr}`, group.map(l => l.transactionHash));
            }

            const link = {
              source: meta.from,
              target: otherAddr,
              transactionHash: meta.hash,
              date: meta.date,
              category: meta.category,
              curvatureIndex,
            };

            group.push(link);
            linkGroups.set(key, group);
            links.push(link);
          }
          await traverse(otherAddr, currentDepth + 1);
        }
      };

      await traverse(address, depth);
      onGraphDataReady({ nodes, links });
    };

    buildGraph();
  }, [address]);

  return null;
};