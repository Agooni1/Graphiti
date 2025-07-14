"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const MyNFTs: NextPage = () => {
  const { isConnected, isConnecting } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="twinkling"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center py-6">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            My NFTs
          </h1>
        </div>

        {/* Content Area - Removed container background */}
        <div className="w-full max-w-7xl">
          {!isConnected || isConnecting ? (
            <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-8 text-center relative z-10">
              <div className="text-6xl mb-4 opacity-50">🎨</div>
              <div className="text-slate-300 text-xl mb-4 font-medium">Connect your wallet to view your NFTs</div>
              <div className="text-slate-400 mb-6">Connect your wallet to browse your NFT collection</div>
              <div className="transform scale-150">
                <RainbowKitCustomConnectButton />
              </div>
            </div>
          ) : (
            <MyHoldings />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNFTs;
