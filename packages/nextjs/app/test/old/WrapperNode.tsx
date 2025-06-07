// "use client";
import { useEffect, useState } from "react";
import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, AssetTransfersResponse, SortingOrder } from "alchemy-sdk";
// import Wrapper  from "./Wrapper";
import { Address} from "~~/components/scaffold-eth"

const extractAddresses = (res: AssetTransfersResponse, baseAddress: string): string[] => {
  const set = new Set<string>();
  for (const transfer of res.transfers) {
    if (transfer.from && transfer.from !== baseAddress) set.add(transfer.from);
    if (transfer.to && transfer.to !== baseAddress) set.add(transfer.to);
  }
  return Array.from(set);
};

interface WrapperNodeProps {
  address: string;
  depth?: number;
  maxDepth?: number;
}

export const WrapperNode = ({ address, depth = 0, maxDepth = 2 }: WrapperNodeProps) => {
  const [relatedAddresses, setRelatedAddresses] = useState<string[]>([]);
  const [latestTransferDate, setLatestTransferDate] = useState<string | null>(null);
  const [latestTransferCategory, setLatestTransferCategory] = useState<string | null>(null);
  const [latestTxHash, setLatestTxHash] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      const res = await alchemy.core.getAssetTransfers({
        fromBlock: "0x0",
        toBlock: "latest",
        maxCount: 5,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
        ],
        fromAddress: address,
        // toAddress: address,
        order: SortingOrder.DESCENDING,
      });
      const uniqueAddrs = extractAddresses(res, address);
      setRelatedAddresses(uniqueAddrs);

      if (res.transfers.length > 0 && res.transfers[0].blockNum) {
        const block = await alchemy.core.getBlock(parseInt(res.transfers[0].blockNum, 16));
        const dateStr = new Date(block.timestamp * 1000).toLocaleString();
        setLatestTransferDate(dateStr);
        setLatestTransferCategory(res.transfers[0].category ?? null);
        setLatestTxHash(res.transfers[0].hash ?? null);
      }
    };

    if (depth < maxDepth) fetchTransfers();
  }, [address]);

  return (
    <div className="relative">
      <Wrapper
        address={address}
        transferDate={latestTransferDate}
        transferCategory={latestTransferCategory}
        txHash={latestTxHash}
      />
      {depth < maxDepth && (
        <div className="ml-4">
          {/* {relatedAddresses.map(childAddr => (
            <WrapperNode key={childAddr} address={childAddr} depth={depth + 1} />
          ))} */}
          {[...new Set(relatedAddresses.map(a => a.toLowerCase()))]
                .filter(childAddr => childAddr !== address.toLowerCase())
                .map(childAddr => (
                <WrapperNode key={childAddr} address={childAddr} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
};