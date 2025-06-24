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
import { generateMetadata, generateNFTMetadata } from "~~/utils/cosmicNFT/generateMetadata";
import { uploadFileToIPFS, uploadMetadataToIPFS, uploadHtmlToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";
import { canAffordMinting } from "./_components/gasEstimation";
import { fetchAllTransfersCached, FilterAndSortTx } from "~~/app/test/graph-data/utils";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress1, isConnected, isConnecting } = useAccount();
  const connectedAddress = "0xcC6eDeB501BbD8AD9E028BDe937B63Cdd64A1D91"; // Temporary fix, replace with connectedAddress1
  const [mintPrice, setMintPrice] = useState("0.01");
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Get contract address
  const { data: contractInfo } = useDeployedContractInfo("YourCollectible");

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
    console.log("🚀 Starting Cosmic NFT minting process...");
    console.log("Connected address:", connectedAddress);
    console.log("Contract info:", contractInfo);

    if (!connectedAddress || !contractInfo?.address) {
      console.error("❌ Missing required data:", { connectedAddress, contractInfo });
      return;
    }

    const notificationId = notification.loading("Checking affordability...");
    setIsGenerating(true);

    try {
      // Convert ETH to wei for gas estimation
      const mintPriceWei = parseEther(mintPrice).toString();
      console.log("💰 Mint price:", { mintPrice, mintPriceWei });
      console.log("💳 User balance:", { balanceValue: balanceValue.toString(), balanceFormatted });
      
      const canAfford = await canAffordMinting({
        userAddress: connectedAddress,
        balance: balanceValue,
        contractAddress: contractInfo.address,
        mintPrice: mintPriceWei
      });
      console.log("💸 Can afford minting:", canAfford);

      notification.remove(notificationId);

      if (!canAfford) {
        console.warn("❌ Insufficient funds for minting");
        notification.error("❌ Insufficient funds for minting + gas fees");
        setIsGenerating(false);
        return;
      }

      // STEP 1: Fetch transfer data
      console.log("📊 STEP 1: Starting transfer data fetch...");
      const generatingNotificationId = notification.loading("Fetching blockchain data...");
      
      const startTime = Date.now();
      const transfers = await fetchAllTransfersCached(connectedAddress);
      const fetchTime = Date.now() - startTime;
      
      console.log(`✅ STEP 1 Complete: Fetched ${transfers.length} transfers in ${fetchTime}ms`);
      console.log("Sample transfers:", transfers.slice(0, 3));

      // STEP 2: Process transfers into graph data
      console.log("🔄 STEP 2: Starting graph data processing...");
      notification.remove(generatingNotificationId);
      const processingNotificationId = notification.loading("Processing transaction graph...");

      const filterOptions = {
        maxCount: 200,
        direction: "both" as const,
        address: connectedAddress,
      };
      console.log("Filter options:", filterOptions);

      const filteredTransfers = FilterAndSortTx(transfers, filterOptions);
      console.log(`🔍 Filtered from ${transfers.length} to ${filteredTransfers.length} transfers`);

      // Generate graph data
      const graphStartTime = Date.now();
      const { FilterPair, pairData } = await import("~~/app/test/graph-data/utils");
      console.log("📈 Imported graph utilities");

      const pairs = FilterPair(filteredTransfers, connectedAddress);
      console.log(`🔗 Generated ${pairs.length} pairs from filtered transfers`);
      console.log("Sample pairs:", pairs.slice(0, 3));

      const graphData = await pairData({ pairsFromParent: pairs, transfers: filteredTransfers });
      const graphTime = Date.now() - graphStartTime;
      
      console.log(`✅ STEP 2 Complete: Generated graph in ${graphTime}ms`);
      console.log(`📊 Graph data: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);
      console.log("Sample nodes:", graphData.nodes.slice(0, 3));
      console.log("Sample links:", graphData.links.slice(0, 3));

      // STEP 3: Generate HTML using renderOrbitHTML
      console.log("🎨 STEP 3: Starting HTML template generation...");
      notification.remove(processingNotificationId);
      const templateNotificationId = notification.loading("Generating cosmic visualization...");

      const templateData = {
        address: connectedAddress,
        balance: parseFloat(balanceFormatted),
        graphData: graphData,
        timestamp: new Date().toISOString()
      };
      console.log("Template data:", {
        address: templateData.address,
        balance: templateData.balance,
        graphData: { nodeCount: graphData.nodes.length, linkCount: graphData.links.length },
        timestamp: templateData.timestamp
      });

      const templateStartTime = Date.now();
      const { renderOrbitHTML } = await import("~~/utils/templates/renderOrbitHtml");
      console.log("📋 Imported renderOrbitHTML function");
      
      const personalizedHTML = renderOrbitHTML(templateData);
      const templateTime = Date.now() - templateStartTime;
      
      console.log(`✅ STEP 3 Complete: Generated HTML template in ${templateTime}ms`);
      console.log(`📄 HTML size: ${personalizedHTML.length} characters`);

      // Validate the generated HTML
      if (personalizedHTML.includes(connectedAddress)) {
        console.log('✅ Address injection verified in HTML');
      } else {
        console.warn('❌ Address not found in generated HTML');
      }

      if (personalizedHTML.includes('"id"') && personalizedHTML.includes('"source"')) {
        console.log('✅ Graph data injection verified in HTML');
      } else {
        console.warn('❌ Graph data may not be properly injected');
      }

      // STEP 4: Upload HTML to IPFS
      console.log("☁️ STEP 4: Starting IPFS upload...");
      notification.remove(templateNotificationId);
      const uploadNotificationId = notification.loading("Uploading interactive graph to IPFS...");

      const fileName = `cosmic-graph-${connectedAddress.slice(0, 8)}.html`;
      console.log("Upload filename:", fileName);

      const uploadStartTime = Date.now();
      const htmlCid = await uploadHtmlToIPFS(personalizedHTML, fileName);
      const uploadTime = Date.now() - uploadStartTime;
      
      console.log(`✅ STEP 4 Complete: HTML uploaded to IPFS in ${uploadTime}ms`);
      console.log("HTML CID:", htmlCid);
      console.log("HTML URL:", `https://ipfs.io/ipfs/${htmlCid}`);

      // STEP 5: Generate metadata
      console.log("📝 STEP 5: Starting metadata generation...");
      const metadataParams = {
        address: connectedAddress,
        graphData,
        balance: balanceFormatted,
        htmlCid,
        layoutMode: 'shell' as const
      };
      console.log("Metadata parameters:", {
        ...metadataParams,
        graphData: { nodeCount: graphData.nodes.length, linkCount: graphData.links.length }
      });

      const cosmicMetadata = generateNFTMetadata(
        connectedAddress,
        graphData,
        balanceFormatted,
        htmlCid,
        'shell'
      );

      console.log("✅ STEP 5 Complete: Generated metadata");
      console.log("Metadata:", cosmicMetadata);

      // STEP 6: Upload metadata to IPFS
      console.log("☁️ STEP 6: Starting metadata upload...");
      const metadataStartTime = Date.now();
      const metadataCid = await uploadMetadataToIPFS(cosmicMetadata);
      const metadataUploadTime = Date.now() - metadataStartTime;
      
      console.log(`✅ STEP 6 Complete: Metadata uploaded in ${metadataUploadTime}ms`);
      console.log("Metadata CID:", metadataCid);
      console.log("Metadata URL:", `https://ipfs.io/ipfs/${metadataCid}`);

      notification.remove(uploadNotificationId);
      notification.success("🌌 Interactive cosmic graph created and uploaded!");

      // STEP 7: Mint the NFT
      console.log("⛏️ STEP 7: Starting NFT minting...");
      const mintNotificationId = notification.loading("Minting your cosmic NFT...");
      
      const mintParams: {
        functionName: "mintCosmicGraph";
        args: [string, string];
        value: bigint;
      } = {
        functionName: "mintCosmicGraph",
        args: [connectedAddress, metadataCid],
        value: parseEther(mintPrice),
      };
      console.log("Mint parameters:", mintParams);

      const mintStartTime = Date.now();
      const result = await writeContractAsync(mintParams);
      const mintTime = Date.now() - mintStartTime;
      
      console.log(`✅ STEP 7 Complete: NFT minted in ${mintTime}ms`);
      console.log("Mint transaction result:", result);

      notification.remove(mintNotificationId);
      notification.success("🌌 Interactive Cosmic NFT minted successfully!");

      // Final summary
      const totalTime = Date.now() - startTime;
      console.log("🎉 MINTING COMPLETE!");
      console.log("📊 Summary:", {
        totalTime: `${totalTime}ms`,
        fetchTime: `${fetchTime}ms`,
        graphTime: `${graphTime}ms`, 
        templateTime: `${templateTime}ms`,
        uploadTime: `${uploadTime}ms`,
        metadataUploadTime: `${metadataUploadTime}ms`,
        mintTime: `${mintTime}ms`,
        transferCount: transfers.length,
        filteredTransferCount: filteredTransfers.length,
        nodeCount: graphData.nodes.length,
        linkCount: graphData.links.length,
        htmlSize: personalizedHTML.length,
        htmlCid,
        metadataCid
      });

    } catch (error) {
      console.error("💥 MINTING FAILED!");
      console.error("Error details:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      
      notification.error("Failed to mint cosmic NFT");
    } finally {
      console.log("🏁 Minting process finished, cleaning up...");
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
                  <div className="text-center mb-4">
                    <p className="text-slate-400 mb-4">
                      Create a unique cosmic visualization of your Ethereum address showing your transaction history and connections.
                    </p>
                  </div>

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