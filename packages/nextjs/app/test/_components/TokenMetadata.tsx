"use client";
import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { alchemy } from "~~/app/lib/alchemy";
import { AddressType } from "~~/types/abitype/abi";


type TokenMetadataProps = {
  // address: AddressType;
  address: string;
};



//@dev might need to add stuff to verify its a token contract otherwise pretty sure it'll break
export const TokenMetadata = ({ address }: TokenMetadataProps) => {
   const [metadata, setMetadata] = useState<any | null>(null);

   useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const result = await alchemy.core.getTokenMetadata(address);
        setMetadata(result);
      } catch (err) {
        console.error("Failed to fetch token metadata:", err);
        setMetadata(null);
      }
    };

    if (address) {
      fetchMetadata();
    }
  }, [address]);

  return (
    <div>
        <p>Token Metadata for {address}:</p>
      {metadata ? (
        <ul>
          <li><strong>Name:</strong> {metadata.name}</li>
          <li><strong>Symbol:</strong> {metadata.symbol}</li>
          <li><strong>Decimals:</strong> {metadata.decimals}</li>
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>

  );
};