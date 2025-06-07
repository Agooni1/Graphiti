"use client";
import { useEffect, useState } from "react";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import { AddressType } from "~~/types/abitype/abi";

type ETHBalanceProps = {
  address: string;
};

export const ETHBalance = ({ address }: ETHBalanceProps) => {
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const { getAlchemy } = await import("~~/app/lib/alchemy");
      const alchemy = getAlchemy();
      if (!alchemy) return;

      try {
        const rawBalance = await alchemy.core.getBalance(address);
        const eth = Number(rawBalance) / 1e18;
        setBalance(eth.toFixed(4));
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setBalance("Error");
      }
    };

    if (address) {
      fetchBalance();
    }
  }, [address]);

  return (
    <div>
      <p>ETH Balance for {address}:</p>
      <p>{balance !== null ? `${balance} ETH` : "Loading..."}</p>
    </div>
  );
};