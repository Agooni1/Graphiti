"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

// Import cosmic NFT functions
import { fetchCosmicData } from "~~/utils/cosmicNFT/fetchCosmicData";
import { generateCosmicSVG } from "~~/utils/cosmicNFT/cosmicVisualizer";
import { generateMetadata } from "~~/utils/cosmicNFT/generateMetadata";
import { uploadFileToIPFS, uploadMetadataToIPFS, uploadHtmlToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";
import { canAffordMinting } from "./_components/gasEstimation";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSVG, setPreviewSVG] = useState<string>("");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "tokenIdCounter",
    watch: true,
  });

  // Check if user already has a cosmic graph
  const { data: hasCosmicGraph } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "hasCosmicGraph",
    args: [connectedAddress],
    watch: true,
  });

  // Get contract address
  const { data: contractInfo } = useDeployedContractInfo("CosmicGraph");

  const {
    data: balance,
    isError,
    isLoading,
  } = useWatchBalance({
    address: connectedAddress,
  });

  // Extract the balance value for easier use
  const balanceValue = balance?.value ?? 0n;
  const balanceFormatted = balance?.formatted ?? "0";

  

  // Check if user already has a cosmic graph
  // const userAlreadyHasGraph = hasCosmicGraph?.[0] === true;
  const userAlreadyHasGraph = false; // Temporary fix, replace with actual logic

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">My NFTs</span>
            <span className="block text-lg text-slate-400 mt-2">
              Generate a cosmic visualization of your Ethereum address
            </span>
          </h1>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        {!isConnected || isConnecting ? (
          <div className="transform scale-300 my-8">
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