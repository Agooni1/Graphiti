"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import { canAffordMinting } from "~~/app/myNFTs/_components/gasEstimation";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import {
  type SupportedChain,
  getApiChain,
  getChainId,
  isContractDeployedOnChain,
} from "~~/utils/cosmicNFT/chainHelpers";
import { notification } from "~~/utils/scaffold-eth";

interface ViewState {
  zoom: number;
  panOffset: { x: number; y: number };
  orbitRotation: { x: number; y: number };
}

interface GraphConfig {
  graphData: { nodes: any[]; links: any[] };
  targetNode: string;
  layoutMode: "shell" | "force" | "fibonacci";
  particleMode: "pulse" | "laser" | "off";
  isOrbiting: boolean;
  viewState?: ViewState;
  transferDirection?: "from" | "to" | "both";
}

interface MintCosmicNFTProps {
  graphConfig: GraphConfig;
  selectedChain: SupportedChain;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function MintCosmicNFT({
  graphConfig,
  selectedChain,
  disabled = false,
  className = "",
  title,
}: MintCosmicNFTProps) {
  const { address: connectedAddress } = useAccount();
  const [isMinting, setIsMinting] = useState(false);

  const { signMessageAsync } = useSignMessage();

  // Use chain-specific contract calls
  const selectedChainId = getChainId(selectedChain);

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "CosmicGraph",
  });

  const { data: contractInfo } = useDeployedContractInfo({
    contractName: "CosmicGraph",
  });

  // Chain-specific contract reads with chainId
  const { data: currentNonce } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "nonces",
    args: [connectedAddress],
    chainId: selectedChainId as 1 | 42161 | 11155111 | 8453 | undefined,
  });

  const { data: mintPriceWei } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "userPrice",
    args: [connectedAddress],
    chainId: selectedChainId as 1 | 42161 | 11155111 | 8453 | undefined,
  });

  const { data: balance } = useWatchBalance({
    address: connectedAddress,
  });

  const balanceValue = balance?.value ?? 0n;
  const mintPriceEth = mintPriceWei ? formatEther(mintPriceWei) : "0";

  // Check if contract is deployed on selected chain
  const isContractAvailable = isContractDeployedOnChain(selectedChain);

  const handleMint = async () => {
    if (!connectedAddress || !graphConfig.graphData.nodes.length || !contractInfo || !mintPriceWei) {
      notification.error("Missing required data for minting");
      return;
    }

    if (!isContractAvailable) {
      notification.error(`CosmicGraph contract is not deployed on ${selectedChain}`);
      return;
    }

    const notificationId = notification.loading("Checking affordability...");
    setIsMinting(true);

    try {
      const canAfford = await canAffordMinting({
        userAddress: connectedAddress,
        balance: balanceValue,
        contractAddress: contractInfo.address,
        mintPrice: mintPriceWei.toString(),
      });

      notification.remove(notificationId);

      if (!canAfford) {
        notification.error("❌ Insufficient funds for minting + gas fees");
        setIsMinting(false);
        return;
      }

      // Step 1: Authentication
      const authNotificationId = notification.loading("Signing authentication message...");
      const timestamp = Date.now();
      const authMessage = `Mint cosmic graph for ${connectedAddress} at ${timestamp}`;

      const authSignature = await signMessageAsync({ message: authMessage });
      notification.remove(authNotificationId);

      // Step 2: Backend preparation
      const mintNotificationId = notification.loading("Generating cosmic visualization...");

      const requestBody = {
        userAddress: connectedAddress,
        signature: authSignature,
        message: authMessage,
        nonce: currentNonce?.toString(),
        timestamp,
        layoutMode: graphConfig.layoutMode,
        particleMode: graphConfig.particleMode,
        chain: getApiChain(selectedChain), // 🔧 UPDATE: Use helper function
        transferDirection: graphConfig.transferDirection || "both",
        isOrbiting: graphConfig.isOrbiting,
        targetNode: graphConfig.targetNode,
        viewState: graphConfig.viewState,
        graphData: graphConfig.graphData,
      };

      const mintResponse = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!mintResponse.ok) {
        const error = await mintResponse.json();
        throw new Error(error.error || "Failed to prepare mint");
      }

      const { metadataCid, signature: mintingSignature } = await mintResponse.json();
      notification.remove(mintNotificationId);

      // Step 3: On-chain minting
      const txNotificationId = notification.loading("Minting NFT on blockchain...");

      await writeContractAsync({
        functionName: "mintGraph",
        args: [metadataCid, mintingSignature],
        value: mintPriceWei,
      });

      notification.remove(txNotificationId);
      notification.success("🌌 Interactive Cosmic NFT minted successfully!");
    } catch (error) {
      notification.remove(notificationId);
      notification.error(`Failed to mint cosmic NFT: ${error instanceof Error ? error.message : "Unknown error"}`);
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const isDisabled =
    disabled ||
    isMinting ||
    !graphConfig.graphData.nodes.length ||
    !connectedAddress ||
    !mintPriceWei ||
    !isContractAvailable;

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
            {isContractAvailable
              ? mintPriceWei
                ? `${parseFloat(mintPriceEth).toFixed(4)} ETH`
                : "Loading..."
              : "Not Available"}
          </span>
        </>
      )}
    </button>
  );
}
