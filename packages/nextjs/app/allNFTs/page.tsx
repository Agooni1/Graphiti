"use client";

import { AllHoldings } from "./_components";
import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Import cosmic NFT functions
import { fetchCosmicData } from "~~/utils/cosmicNFT/fetchCosmicData";
import { generateCosmicSVG } from "~~/utils/cosmicNFT/cosmicVisualizer";
import { generateMetadata } from "~~/utils/cosmicNFT/generateMetadata";
import { uploadFileToIPFS, uploadMetadataToIPFS, uploadHtmlToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";
import { canAffordMinting } from "../myNFTs/_components/gasEstimation";

const AllNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [mintPrice, setMintPrice] = useState("0.01");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSVG, setPreviewSVG] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState("");

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenURI",
    args: [1n],
    // watch: true,
  });

  // Get contract address
  const { data: contractInfo } = useDeployedContractInfo("YourCollectible");


  
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