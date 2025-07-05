"use client";

import { AllHoldings } from "./_components";
import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";


const AllNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "tokenIdCounter",
    watch: true,
  });

  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "tokenURI",
    args: [1n],
    // watch: true,
  });

  // Get contract address
  const { data: contractInfo } = useDeployedContractInfo("CosmicGraph");


  
  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">All NFTs</span>
            <span className="block text-lg text-slate-400 mt-2">
              Browse all address's minted on the platform
            </span>
          </h1>
        </div>
      </div>

      <AllHoldings />
    </>
  );
};

export default AllNFTs;