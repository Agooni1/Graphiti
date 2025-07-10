"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();


  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">My NFTs</span>
          </h1>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        {!isConnected || isConnecting ? (
          <div className="transform scale-150 my-8">
            <RainbowKitCustomConnectButton />
          </div>
        ) : (
          <MyHoldings />
        )}
      </div>

      
    </>
  );
};

export default MyNFTs;