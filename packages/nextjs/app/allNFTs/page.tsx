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

  // Get contract address
  const { data: contractInfo } = useDeployedContractInfo("YourCollectible");

  const generatePreviewForAddress = async () => {
    if (!targetAddress) {
      notification.error("Please enter an address to generate preview");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Fetch cosmic data for the target address
      const cosmicData = await fetchCosmicData(targetAddress);
      
      // Generate visualization
      const { svg } = generateCosmicSVG(cosmicData);
      
      // Show preview
      setPreviewSVG(svg);
      
    } catch (error) {
      console.error("Error generating preview:", error);
      notification.error("Failed to generate cosmic preview");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMintCosmicNFT = async () => {
    if (!connectedAddress || !contractInfo?.address || !targetAddress) {
      notification.error("Please connect wallet and enter target address");
      return;
    }

    const notificationId = notification.loading("Checking affordability...");
    setIsGenerating(true);

    try {
      // Convert ETH to wei for gas estimation
      const mintPriceWei = parseEther(mintPrice).toString();
      
      const canAfford = await canAffordMinting({
        userAddress: connectedAddress,
        balance: 0n, // You'll need to get the actual balance
        contractAddress: contractInfo.address,
        mintPrice: mintPriceWei
      });

      notification.remove(notificationId);

      if (!canAfford) {
        notification.error("❌ Insufficient funds for minting + gas fees");
        setIsGenerating(false);
        return;
      }

      // Generate cosmic NFT for the target address
      const generatingNotificationId = notification.loading("Generating cosmic graph...");

      const cosmicData = await fetchCosmicData(targetAddress);
      
      const htmlResponse = await fetch("/orbit-graph.html");
      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch HTML: ${htmlResponse.status} ${htmlResponse.statusText}`);
      }
      
      const htmlContent = await htmlResponse.text();

      if (htmlContent.length === 0) {
        throw new Error("HTML file is empty");
      }

      notification.remove(generatingNotificationId);
      const uploadNotificationId = notification.loading("Uploading interactive graph to IPFS...");

      const htmlCid = await uploadHtmlToIPFS(htmlContent, "cosmic-graph-interactive.html");
      const { metadata } = generateMetadata(cosmicData, htmlCid, 'shell', 'html');
      const metadataCid = await uploadMetadataToIPFS(metadata);

      notification.remove(uploadNotificationId);
      notification.success("Interactive cosmic graph uploaded to IPFS!");

      const mintNotificationId = notification.loading("Minting cosmic NFT...");
      
      await writeContractAsync({
        functionName: "mintCosmicGraph",
        args: [targetAddress, metadataCid], // Mint for target address
        value: parseEther(mintPrice),
      });

      notification.remove(mintNotificationId);
      notification.success("🌌 Interactive Cosmic NFT minted successfully!");
      
      setPreviewSVG("");
      setTargetAddress("");

    } catch (error) {
      notification.error("Failed to mint cosmic NFT");
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsGenerating(false);
    }
  };

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