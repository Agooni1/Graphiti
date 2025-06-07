"use client";
import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { alchemy } from "~~/app/lib/alchemy";
import { AddressType } from "~~/types/abitype/abi";

type NFTListProps = {
  address: string;
};

export const NFTList = ({ address }: NFTListProps) => {
  const [nfts, setNfts] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const response = await alchemy.nft.getNftsForOwner(address);
        setNfts(response.ownedNfts);
      } catch (err) {
        console.error("Failed to fetch NFTs:", err);
        setNfts(null);
      }
    };

    if (address) {
      fetchNFTs();
    }
  }, [address]);

  return (
    <div>
      <p>NFTs owned by {address}:</p>
      {nfts ? (
        <ul>
          {nfts.map((nft, idx) => (
            <li key={idx}>
              <strong>Contract:</strong> {nft.contract.address} <br />
              <strong>Token ID:</strong> {nft.tokenId}
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};