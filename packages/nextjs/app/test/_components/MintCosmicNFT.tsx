"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { generateGraphHTML } from "../graph/htmlGraphGenerator";
import { uploadHtmlToIPFS, uploadMetadataToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";
import { generateMetadata } from "~~/utils/cosmicNFT/generateMetadata";
import { canAffordMinting } from "~~/app/myNFTs/_components/gasEstimation";
import { AddressCosmicData } from "~~/utils/cosmicNFT/fetchCosmicData";

interface ViewState {
  zoom: number;
  panOffset: { x: number; y: number };
  orbitRotation: { x: number; y: number };
}

interface GraphConfig {
  graphData: { nodes: any[]; links: any[] };
  targetNode: string;
  layoutMode: 'shell' | 'force' | 'fibonacci';
  particleMode: 'pulse' | 'laser' | 'off';
  isAutoOrbiting: boolean;
  viewState?: ViewState;
}

interface MintCosmicNFTProps {
  graphConfig: GraphConfig;
  disabled?: boolean;
  className?: string;
  title?: string; // <-- add this
}

export function MintCosmicNFT({ graphConfig, disabled = false, className = "", title }: MintCosmicNFTProps) {
  const { address: connectedAddress } = useAccount();
  const [isMinting, setIsMinting] = useState(false);
  const mintPrice = "0.01";

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: contractInfo } = useDeployedContractInfo("YourCollectible");

  const { data: balance } = useWatchBalance({
    address: connectedAddress,
  });

  const balanceValue = balance?.value ?? 0n;

  const handleMint = async () => {
    if (!connectedAddress || !contractInfo?.address || !graphConfig.graphData.nodes.length) {
      notification.error("Missing required data for minting");
      return;
    }

    const notificationId = notification.loading("Checking affordability...");
    setIsMinting(true);

    try {
      // Check if user can afford minting
      const mintPriceWei = parseEther(mintPrice).toString();
      
      const canAfford = await canAffordMinting({
        userAddress: connectedAddress,
        balance: balanceValue,
        contractAddress: contractInfo.address,
        mintPrice: mintPriceWei
      });

      notification.remove(notificationId);

      if (!canAfford) {
        notification.error("❌ Insufficient funds for minting + gas fees");
        setIsMinting(false);
        return;
      }

      // Generate the custom HTML with current graph state
      const generatingNotificationId = notification.loading("Generating your cosmic graph...");
      
      const htmlContent = generateGraphHTML(graphConfig);
      console.log("Generated HTML length:", htmlContent.length);

      if (htmlContent.length === 0) {
        throw new Error("Generated HTML is empty");
      }

      notification.remove(generatingNotificationId);
      const uploadNotificationId = notification.loading("Uploading interactive graph to IPFS...");

      // Upload HTML to IPFS
      const htmlCid = await uploadHtmlToIPFS(htmlContent, `cosmic-graph-${graphConfig.targetNode.slice(0, 6)}.html`);
      console.log("HTML uploaded to IPFS:", htmlCid);

      // Create proper AddressCosmicData object for your existing generateMetadata function
      const cosmicData: AddressCosmicData = {
        address: graphConfig.targetNode,
        balance: BigInt(0),
        transactionCount: graphConfig.graphData.links.length, // Keep as link count for "connections"
        connectedAddresses: graphConfig.graphData.nodes.map(node => node.id), // This gives us node count
        recentTransactions: [],
        tokenBalances: [],
        nftCount: 0,
    };

      const { metadata } = generateMetadata(
        cosmicData, // Pass the whole object, not just the address
        htmlCid,
        graphConfig.layoutMode,
        'html' // Using HTML content type
      );

      console.log("Generated metadata:", metadata);

      // Upload metadata to IPFS
      const metadataCid = await uploadMetadataToIPFS(metadata);
      console.log("Metadata uploaded to IPFS:", metadataCid);

      notification.remove(uploadNotificationId);
      notification.success("Interactive cosmic graph uploaded to IPFS!");

      // Mint the NFT
      const mintNotificationId = notification.loading("Minting your cosmic NFT...");
      
      await writeContractAsync({
        functionName: "mintCosmicGraph",
        args: [connectedAddress, metadataCid],
        value: parseEther(mintPrice),
      });

      notification.remove(mintNotificationId);
      notification.success("🌌 Interactive Cosmic NFT minted successfully!");

    } catch (error) {
      notification.error("Failed to mint cosmic NFT");
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const isDisabled = disabled || isMinting || !graphConfig.graphData.nodes.length || !connectedAddress;

  return (
    <button
      onClick={handleMint}
      disabled={isDisabled}
      className={`btn bg-gradient-to-r from-purple-600 to-blue-600 border-none text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-sm flex items-center gap-2 ${className}`}
      title={title} // <-- add this
    >
      {isMinting ? (
        <>Minting...</>
      ) : (
        <>
          Mint NFT
          <span className="text-xs opacity-80">{mintPrice} ETH</span>
        </>
      )}
    </button>
  );
}