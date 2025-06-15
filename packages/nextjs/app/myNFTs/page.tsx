"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// Import cosmic NFT functions
import { fetchCosmicData } from "~~/utils/cosmicNFT/fetchCosmicData";
import { generateCosmicSVG } from "~~/utils/cosmicNFT/cosmicVisualizer";
import { uploadToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [mintPrice, setMintPrice] = useState("0.01");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSVG, setPreviewSVG] = useState<string>("");

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  // Check if user already has a cosmic graph
  const { data: hasCosmicGraph } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "hasCosmicGraph",
    args: [connectedAddress],
    watch: true,
  });

  const generatePreview = async () => {
    if (!connectedAddress) return;
    
    setIsGenerating(true);
    try {
      // Fetch cosmic data for the connected address
      const cosmicData = await fetchCosmicData(connectedAddress);
      
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
    if (!connectedAddress) return;

    const notificationId = notification.loading("Generating your cosmic graph...");
    setIsGenerating(true);

    try {
      // Fetch cosmic data for the connected user's address
      const cosmicData = await fetchCosmicData(connectedAddress);
      
      // Generate cosmic visualization
      const { svg, metadata } = generateCosmicSVG(cosmicData);
      
      // Update notification
      notification.remove(notificationId);
      const uploadNotificationId = notification.loading("Uploading to IPFS via Pinata...");

      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(svg, metadata);

      // Update notification
      notification.remove(uploadNotificationId);
      notification.success("Cosmic graph uploaded to IPFS!");

      // Mint the NFT
      const mintNotificationId = notification.loading("Minting your cosmic NFT...");
      
      await writeContractAsync({
        functionName: "mintCosmicGraph",
        args: [connectedAddress, ipfsHash], // Target address is the connected user
        value: parseEther(mintPrice),
      });

      notification.remove(mintNotificationId);
      notification.success("🌌 Cosmic NFT minted successfully!");
      
      // Clear preview after successful mint
      setPreviewSVG("");

    } catch (error) {
      notification.error("Failed to mint cosmic NFT");
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if user already has a cosmic graph
  const userAlreadyHasGraph = hasCosmicGraph?.[0] === true;

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
          <RainbowKitCustomConnectButton />
        ) : (
          <div className="flex flex-col items-center gap-6 max-w-2xl">
            
            {/* Cosmic NFT Section */}
            <div className="bg-base-200 rounded-xl p-6 w-full">
              <h2 className="text-2xl font-bold text-center mb-4 text-purple-300">
                🌌 Your Cosmic Graph
              </h2>
              
              {userAlreadyHasGraph ? (
                <div className="text-center text-yellow-500">
                  ⭐ You already have a cosmic graph NFT for this address!
                </div>
              ) : (
                <>
                  {/* Preview Section */}
                  {!previewSVG ? (
                    <div className="text-center mb-4">
                      <p className="text-slate-400 mb-4">
                        Create a unique cosmic visualization of your Ethereum address showing your transaction history and connections.
                      </p>
                      <button 
                        className="btn btn-info" 
                        onClick={generatePreview}
                        disabled={isGenerating}
                      >
                        {isGenerating ? "Generating..." : "Preview Your Cosmic Graph"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <h3 className="text-lg font-semibold text-purple-300">Your Cosmic Preview:</h3>
                      <div 
                        className="border border-purple-500 rounded-lg p-4 bg-black max-w-full overflow-auto"
                        dangerouslySetInnerHTML={{ __html: previewSVG }}
                      />
                      <button 
                        className="btn btn-sm btn-ghost" 
                        onClick={() => setPreviewSVG("")}
                      >
                        Generate New Preview
                      </button>
                    </div>
                  )}

                  {/* Mint Controls */}
                  <div className="flex flex-col items-center gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <label htmlFor="mintPrice" className="text-sm font-medium">
                        Mint Price (ETH):
                      </label>
                      <input
                        id="mintPrice"
                        type="number"
                        step="0.001"
                        min="0"
                        value={mintPrice}
                        onChange={(e) => setMintPrice(e.target.value)}
                        className="input input-bordered w-32 text-center"
                        placeholder="0.01"
                      />
                    </div>

                    <button 
                      className="btn btn-primary btn-lg" 
                      onClick={handleMintCosmicNFT}
                      disabled={isGenerating || !connectedAddress}
                    >
                      {isGenerating ? "Creating Cosmic NFT..." : `🌌 Mint Cosmic NFT for ${mintPrice} ETH`}
                    </button>

                    <p className="text-xs text-slate-500 text-center max-w-md">
                      Your cosmic graph will visualize your address as a central star with orbiting connected addresses, 
                      showing your balance, transaction count, and blockchain connections.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <MyHoldings />
    </>
  );
};

export default MyNFTs;