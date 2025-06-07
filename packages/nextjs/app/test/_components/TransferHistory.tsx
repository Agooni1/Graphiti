"use client";
import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { alchemy } from "~~/app/lib/alchemy";
import { AddressType } from "~~/types/abitype/abi";
import { AssetTransfersCategory } from "alchemy-sdk";

type TransferHistoryProps = {
  address: string;
};

export const TransferHistory = ({ address }: TransferHistoryProps) => {
  const [transfers, setTransfers] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          fromAddress: address,
        //   toAddress: address,
          category: [AssetTransfersCategory.ERC721,
                    AssetTransfersCategory.EXTERNAL,
                    AssetTransfersCategory.ERC20,
          ],
          maxCount: 3,
        });
        setTransfers(response.transfers);
      } catch (err) {
        console.error("Failed to fetch transfers:", err);
        setTransfers(null);
      }
    };

    if (address) {
      fetchTransfers();
    }
  }, [address]);

  return (
    <div>
      <p>Recent Transfers to {address}:</p>
      {transfers ? (
        <ul>
          {transfers.map((tx, idx) => (
            <li key={idx}>
              <strong>From:</strong> {tx.from} <br />
              <strong>To:</strong> {tx.to} <br />
              <strong>Hash:</strong> {tx.hash} <br />
              <strong>Category:</strong> {tx.category}
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};