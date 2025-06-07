"use client";
import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { alchemy } from "~~/app/lib/alchemy";
import { AddressType } from "~~/types/abitype/abi";


type TokenBalancesProps = {
  // address: AddressType;
  address: string;
};


export const TokenBalances = ({ address }: TokenBalancesProps) => {
  const [tokenBalances, setTokenBalances] = useState<any[] | null>(null);

   useEffect(() => {
    const fetchBalance = async () => {
      try {
        const { tokenBalances } = await alchemy.core.getTokenBalances(address);
        setTokenBalances(tokenBalances);
      } catch (err) {
        console.error("Failed to fetch token balances:", err);
        setTokenBalances(null);
      }
    };

    if (address) {
      fetchBalance();
    }
  }, [address]);

  return (
    <div>
      <p>ERC-20 Token Balances for {address}:</p>
      {tokenBalances ? (
        <ul>
          {tokenBalances.map((token, idx) => (
            <li key={idx}>
              <strong>Contract:</strong> {token.contractAddress} <br />
              <strong>Token Balance:</strong> {token.tokenBalance}
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};