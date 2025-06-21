"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { fetchCosmicData } from "~~/utils/cosmicNFT/fetchCosmicData";
import { generateCosmicSVG } from "~~/utils/cosmicNFT/cosmicVisualizer";
import { uploadToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";  
import { NextPage } from "next";

// This is now the page component, not a separate component
const CosmicMinterPage: NextPage = () => {
  const { address } = useAccount();
  const [targetAddress, setTargetAddress] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSVG, setPreviewSVG] = useState<string>("");

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const generatePreview = async () => {
    if (!targetAddress) return;
    
    setIsGenerating(true);
    try {
      // Fetch cosmic data
      const cosmicData = await fetchCosmicData(targetAddress);
      
      // Generate visualization
      const {  metadata } = generateCosmicSVG(cosmicData, "shell");
      
      // Show preview
      setPreviewSVG(svg);
      
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const mintCosmicNFT = async () => {
    if (!targetAddress || !previewSVG) return;
    
    setIsGenerating(true);
    try {
      // Fetch cosmic data
      const cosmicData = await fetchCosmicData(targetAddress);
      
      // Generate visualization
      const { svg, metadata } = generateCosmicSVG(cosmicData);
      
      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(metadata);
      console.log("IPFS Hash:", ipfsHash);
      
      // Mint NFT
      await writeContractAsync({
        functionName: "mintCosmicGraph",
        args: [targetAddress, ipfsHash],
        value: BigInt("10000000000000000"), // 0.01 ETH
      });
      
    } catch (error) {
      console.error("Error minting cosmic NFT:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-7">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold text-purple-300">🌌 Cosmic Graph Minter</span>
          <span className="block text-lg text-slate-400 mt-2">
            Generate and mint cosmic visualizations of Ethereum addresses
          </span>
        </h1>
        
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
          <div className="flex flex-col items-center space-y-6">
            
            {/* Address Input */}
            <div className="flex flex-col space-y-2 w-full max-w-md">
              <label className="text-white font-medium">Target Ethereum Address:</label>
              <input
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                className="px-4 py-3 rounded-lg bg-slate-800 text-white border border-purple-500 focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Generate Preview Button */}
            <button
              onClick={generatePreview}
              disabled={!targetAddress || isGenerating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isGenerating ? "Generating..." : "Generate Preview"}
            </button>

            {/* Preview */}
            {previewSVG && (
              <div className="flex flex-col items-center space-y-4 w-full">
                <h3 className="text-lg text-purple-300 font-semibold">Preview:</h3>
                <div 
                  className="border border-purple-500 rounded-lg p-4 bg-black max-w-full overflow-auto"
                  dangerouslySetInnerHTML={{ __html: previewSVG }}
                />
                
                {/* Mint Button */}
                <button
                  onClick={mintCosmicNFT}
                  disabled={isGenerating}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold"
                >
                  {isGenerating ? "Minting..." : "Mint Cosmic NFT (0.01 ETH)"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export as default - this is required for Next.js pages
export default CosmicMinterPage;