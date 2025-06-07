// "use client";
import { useEffect, useState } from "react";
import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, AssetTransfersResponse, SortingOrder } from "alchemy-sdk";
import { WrapperChild } from "./WrapperChild";

interface WrapperNodeProps {
  address: string;
  depth?: number;
  maxDepth?: number;
}

export const WrapperNode = ({ address, depth = 0, maxDepth = 5 }: WrapperNodeProps) => {
  const [relatedAddresses, setRelatedAddresses] = useState<
    [string, { hash: string; date: string; category: string | null }[]][]
  >([]);

  useEffect(() => {
    const fetchTransfers = async () => {
      const res = await alchemy.core.getAssetTransfers({
         
        fromBlock: "0x0",
        toBlock: "latest",
        maxCount: 15,
        category: [
          AssetTransfersCategory.EXTERNAL,
          // AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          // AssetTransfersCategory.ERC1155
        ],
        fromAddress: address,
        // toAddress: address,
        order: SortingOrder.DESCENDING,
      });
      console.log("WRAPPERNODE Fetched transfers count:", res.transfers.length);
      console.log("Transfers:", res.transfers);    
      const addrWithDetails = new Map<
        string,
        { hash: string; date: string; category: string | null }[]
      >();
      for (const transfer of res.transfers) {
        const to = transfer.to?.toLowerCase();
        const from = transfer.from?.toLowerCase();
        const createdAddr = transfer.rawContract?.address?.toLowerCase();
        const blockNumHex = transfer.blockNum;
        const hash = transfer.hash;
        const category = transfer.category ?? null;

        if (blockNumHex && hash) {
          const block = await alchemy.core.getBlock(parseInt(blockNumHex, 16));
          const dateStr = new Date(block.timestamp * 1000).toLocaleString();

          const targets = new Set<string>();

          // Direct from/to if not self
          if (to && to !== address.toLowerCase()) targets.add(to);
          if (from && from !== address.toLowerCase()) targets.add(from);

          // Include contract creation address even if it's the same as the current address
          if (!to && createdAddr) {
            targets.add(createdAddr);
          } else if (!to && !createdAddr) {
            console.log("Unmapped contract creation tx:", transfer);
            
            targets.add(address.toLowerCase());
          }

          for (const target of targets) {
            if (!addrWithDetails.has(target)) {
              addrWithDetails.set(target, []);
            }
            addrWithDetails.get(target)?.push({ hash, date: dateStr, category });
          }
        }
      }
      setRelatedAddresses(Array.from(addrWithDetails.entries()));
    };

    if (depth < maxDepth) fetchTransfers();
  }, [address]);

  return (
    <div className="relative">
      <WrapperChild address={address} depth={depth} />
      {depth < maxDepth && (
        <div className="ml-4">
          {relatedAddresses
            .filter(([childAddr]) => childAddr !== address.toLowerCase())
            .map(([childAddr, txList]) => (
              <WrapperChild
                key={childAddr}
                address={childAddr}
                depth={depth + 1}
                transferList={txList}
              />
          ))}
        </div>
      )}
    </div>
  );
};