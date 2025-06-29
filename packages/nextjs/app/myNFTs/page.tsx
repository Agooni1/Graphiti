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
  const { address: connectedAddress1, isConnected, isConnecting } = useAccount();
  const connectedAddress = "0xcC6eDeB501BbD8AD9E028BDe937B63Cdd64A1D91"; // Temporary fix, replace with connectedAddress1
  const [mintPrice, setMintPrice] = useState("0.01");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSVG, setPreviewSVG] = useState<string>("");

  const { writeContractAsync } = useScaffoldWriteContract("CosmicGraph");

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

  const handleMintCosmicNFT = async () => {
    if (!connectedAddress || !contractInfo?.address) return;

    const notificationId = notification.loading("Checking affordability...");
    setIsGenerating(true);

    try {
      // Convert ETH to wei for gas estimation
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
        setIsGenerating(false);
        return;
      }

      // Only proceed with generation if they can afford it
      const generatingNotificationId = notification.loading("Generating your cosmic graph...");

      // Fetch cosmic data for the connected user's address
      const cosmicData = await fetchCosmicData(connectedAddress);
      
      // Fetch the HTML file instead of GIF
      const htmlResponse = await fetch("/orbit-graph.html");
      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch HTML: ${htmlResponse.status} ${htmlResponse.statusText}`);
      }
      
      // Add debugging to verify the HTML loads correctly
      console.log("HTML fetch response:", {
        ok: htmlResponse.ok,
        status: htmlResponse.status,
        contentType: htmlResponse.headers.get('content-type'),
        contentLength: htmlResponse.headers.get('content-length')
      });
      
      const htmlContent = await htmlResponse.text();
      console.log("HTML content details:", {
        length: htmlContent.length,
        hasTitle: htmlContent.includes('<title>'),
        hasCanvas: htmlContent.includes('<canvas>')
      });

      // Verify the HTML isn't empty
      if (htmlContent.length === 0) {
        throw new Error("HTML file is empty");
      }

      notification.remove(generatingNotificationId);
      const uploadNotificationId = notification.loading("Uploading interactive graph to IPFS...");

      // Upload HTML to IPFS
      const htmlCid = await uploadHtmlToIPFS(htmlContent, "cosmic-graph-interactive.html");
      console.log("HTML uploaded to IPFS:", htmlCid);

      // Generate metadata with the HTML CID
      const { metadata } = generateMetadata(cosmicData, htmlCid, 'shell', 'html');
      console.log("Generated metadata:", metadata);

      // Upload metadata to IPFS
      const metadataCid = await uploadMetadataToIPFS(metadata);
      console.log("Metadata uploaded to IPFS:", metadataCid);

      notification.remove(uploadNotificationId);
      notification.success("Interactive cosmic graph uploaded to IPFS!");

      // Mint the NFT with metadata CID
      const mintNotificationId = notification.loading("Minting your cosmic NFT...");
      
      await writeContractAsync({
        functionName: "mintGraph",
        args: [connectedAddress, metadataCid],
        value: parseEther(mintPrice),
      });

      notification.remove(mintNotificationId);
      notification.success("🌌 Interactive Cosmic NFT minted successfully!");
      
      setPreviewSVG("");

    } catch (error) {
      notification.error("Failed to mint cosmic NFT");
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsGenerating(false);
    }
  };

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