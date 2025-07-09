"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { generateGraphHTML } from "../graph/htmlGraphGenerator";
import { uploadHtmlToIPFS, uploadMetadataToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";
import { generateMetadata } from "~~/utils/cosmicNFT/generateMetadata";
import { canAffordMinting } from "~~/app/myNFTs/_components/gasEstimation";
import { AddressCosmicData } from "~~/utils/cosmicNFT/fetchCosmicData";
import { getSignature } from "./utils";

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
  isOrbiting: boolean;  // 🔧 Changed from isAutoOrbiting
  viewState?: ViewState;
  // txDisplayLimit?: number;
  transferDirection?: 'from' | 'to' | 'both';
}

interface MintCosmicNFTProps {
  graphConfig: GraphConfig;
  selectedChain: "ethereum" | "sepolia" | "arbitrum" | "base";  // 🔧 Add this
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function MintCosmicNFT({ 
  graphConfig, 
  selectedChain,  // 🔧 Add this parameter
  disabled = false, 
  className = "", 
  title 
}: MintCosmicNFTProps) {
  const { address: connectedAddress } = useAccount();
  const [isMinting, setIsMinting] = useState(false);

  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useScaffoldWriteContract("CosmicGraph");
  const { data: contractInfo } = useDeployedContractInfo("CosmicGraph");

  // Read the current nonce for the connected address
  const { data: currentNonce } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "nonces",
    args: [connectedAddress],
  });

  // 🎯 NEW: Get dynamic mint price from contract
  const { data: mintPriceWei } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "userPrice",
    args: [connectedAddress],
  });

  const { data: balance } = useWatchBalance({
    address: connectedAddress,
  });

  const balanceValue = balance?.value ?? 0n;

  // Convert wei to ETH for display
  const mintPriceEth = mintPriceWei ? formatEther(mintPriceWei) : "0";

  // 🔧 Create chain mapping function
  const getChainForAPI = (uiChain: string) => {
    const chainMapping = {
      'ethereum': 'eth',
      'sepolia': 'sepolia', 
      'arbitrum': 'arbitrum',
      'base': 'base'
    };
    return chainMapping[uiChain as keyof typeof chainMapping] || 'sepolia';
  };

  const handleMint = async () => {
    if (!connectedAddress || !graphConfig.graphData.nodes.length || !contractInfo || !mintPriceWei) {
      notification.error("Missing required data for minting");
      return;
    }

    console.log(`🔍 Debug: selectedChain = ${selectedChain}`);
    console.log(`🔍 Debug: getChainForAPI result = ${getChainForAPI(selectedChain)}`);
    console.log(`🔍 Debug: connectedAddress = ${connectedAddress}`);

    const notificationId = notification.loading("Checking affordability...");
    setIsMinting(true);

    try {
      // Use actual mint price from contract
      const canAfford = await canAffordMinting({
        userAddress: connectedAddress,
        balance: balanceValue,
        contractAddress: contractInfo.address,
        mintPrice: mintPriceWei.toString() // Use wei value directly
      });

      notification.remove(notificationId);

      if (!canAfford) {
        notification.error("❌ Insufficient funds for minting + gas fees");
        setIsMinting(false);
        return;
      }

      // Step 1: Create proof of address ownership
      const authNotificationId = notification.loading("Signing authentication message...");
      const timestamp = Date.now();
      const authMessage = `Mint cosmic graph for ${connectedAddress} at ${timestamp}`;
      
      const authSignature = await signMessageAsync({ message: authMessage });
      notification.remove(authNotificationId);

      // Step 2: Request mint preparation from backend
      const mintNotificationId = notification.loading("Generating cosmic visualization...");
      
      const requestBody = {
        userAddress: connectedAddress,
        signature: authSignature,
        message: authMessage,
        timestamp,
        layoutMode: graphConfig.layoutMode,
        particleMode: graphConfig.particleMode,
        chain: getChainForAPI(selectedChain),
        // 🔧 ADD: Current UI settings
        // txDisplayLimit: graphConfig.txDisplayLimit || 200,
        transferDirection: graphConfig.transferDirection || "both",
        isOrbiting: graphConfig.isOrbiting,  // 🔧 ADD: Pass the actual orbiting state
        targetNode: graphConfig.targetNode,  // 🔧 ADD: Pass the target node
        viewState: graphConfig.viewState     // 🔧 ADD: Pass the view state
      };

      console.log(`🔍 Debug: Request body =`, requestBody);

      const mintResponse = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!mintResponse.ok) {
        const error = await mintResponse.json();
        throw new Error(error.error || "Failed to prepare mint");
      }

      const { metadataCid, signature: mintingSignature } = await mintResponse.json();
      notification.remove(mintNotificationId);

      // Step 3: Execute the mint transaction with correct price
      const txNotificationId = notification.loading("Minting NFT on blockchain...");
      
      await writeContractAsync({
        functionName: "mintGraph",
        args: [metadataCid, mintingSignature],
        value: mintPriceWei, // Use wei value directly
      });

      notification.remove(txNotificationId);
      notification.success("🌌 Interactive Cosmic NFT minted successfully!");

    } catch (error) {
      notification.error(`Failed to mint cosmic NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const isDisabled = disabled || isMinting || !graphConfig.graphData.nodes.length || !connectedAddress || !mintPriceWei;

  return (
    <button
      onClick={handleMint}
      disabled={isDisabled}
      className={`btn bg-gradient-to-r from-purple-600 to-blue-600 border-none text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-sm flex items-center gap-2 ${className}`}
      title={title}
    >
      {isMinting ? (
        <>Minting...</>
      ) : (
        <>
          Mint NFT
          <span className="text-xs opacity-80">
            {mintPriceWei ? `${parseFloat(mintPriceEth).toFixed(4)} ETH` : "Loading..."}
          </span>
        </>
      )}
    </button>
  );
}