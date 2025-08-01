"use client";

import { useEffect, useRef, useState } from "react";
import { MenuActions } from "./_components/MenuActions";
import { generateNodesFromTx } from "./graph-data/generateNodesFromTx";
import { GraphLink, GraphNode } from "./graph-data/types";
import { FilterAndSortTx, fetchAllTransfersCached } from "./graph-data/utils";
import SimpleCosmicGraph from "./graph/SimpleCosmicGraph";
import { AssetTransfersResult } from "alchemy-sdk";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { type SupportedChain } from "~~/utils/cosmicNFT/chainHelpers";

const Explorer: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [inputValue, setInputValue] = useState("");
  const [address, setAddress] = useState("");
  const [transferDirection, setTransferDirection] = useState<"from" | "to" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [allTransfers, setAllTransfers] = useState<AssetTransfersResult[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });

  const txDisplayLimit = 200;

  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  const graphWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [progress, setProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  const [layoutMode, setLayoutMode] = useState<"shell" | "force" | "fibonacci">("shell");
  const [particleMode, setParticleMode] = useState<"pulse" | "laser" | "off">("pulse");
  const [isOrbiting, setIsOrbiting] = useState(true);
  const [showNodeLabels, setShowNodeLabels] = useState(true);

  const resetViewRef = useRef<(() => void) | null>(null);

  const [selectedChain, setSelectedChain] = useState<SupportedChain>("sepolia");

  const [currentViewState, setCurrentViewState] = useState<{
    zoom: number;
    panOffset: { x: number; y: number };
    orbitRotation: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    if (isConnected && connectedAddress && !hasAutoLoaded && !address) {
      setAddress(connectedAddress);
      setInputValue("");
      setHasAutoLoaded(true);
      handleParamsChange();
    }
  }, [isConnected, connectedAddress, hasAutoLoaded, address]);

  useEffect(() => {
    if (!isConnected) {
      setHasAutoLoaded(false);
    }
  }, [isConnected]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleParamsChange = () => {
    setLoading(true);
  };

  useEffect(() => {
    if (!address) return;
    fetchAllTransfersCached(address, selectedChain).then(transfers => {
      setAllTransfers(transfers);
    });
  }, [address, selectedChain]);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!allTransfers.length) {
        setGraphData({ nodes: [], links: [] });
        setLoading(false);
        setProgress({ loaded: 0, total: 0 });
        return;
      }

      const filtered: any[] = FilterAndSortTx(allTransfers, {
        maxCount: txDisplayLimit,
        direction: transferDirection,
        address: address,
      });

      setProgress({ loaded: 0, total: filtered.length });

      const graph = await generateNodesFromTx(filtered, selectedChain, (loaded: number, total: number) => {
        setProgress({ loaded, total });
      });
      setGraphData(graph);
      setLoading(false);
    };

    fetchGraphData();
    // you know what I didn't want to do this but this project is taking way too long and
    // the proper address dependancy breaks the loading spinner. Sue me
    // eslint-disable-next-line
  }, [allTransfers, txDisplayLimit, transferDirection]);

  const handleSetTarget = (newAddress: string) => {
    setAddress(newAddress.toLowerCase());
    setInputValue("");
    handleParamsChange();
  };

  const handleFullscreenToggle = () => {
    const el = graphWrapperRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => {
        console.error("Failed to enter fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error("Failed to exit fullscreen:", err);
      });
    }
  };

  const handleResetView = () => {
    if (resetViewRef.current) {
      resetViewRef.current();
    }
  };

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
        {!isFullscreen && (
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Explorer
            </h1>
          </div>
        )}

        {/* Unified Controls Card */}
        {!isFullscreen && (
          <div className="w-full max-w-4xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-6 mb-6 relative z-10">
            <MenuActions
              inputValue={inputValue}
              setInputValue={setInputValue}
              address={address}
              setAddress={setAddress}
              connectedAddress={connectedAddress ?? ""}
              isConnected={isConnected}
              loading={loading}
              handleParamsChange={handleParamsChange}
              graphData={graphData}
              layoutMode={layoutMode}
              particleMode={particleMode}
              isOrbiting={isOrbiting} // 🔧 Changed from isAutoOrbiting
              currentViewState={currentViewState}
              transferDirection={transferDirection}
              setTransferDirection={setTransferDirection}
              setLayoutMode={setLayoutMode}
              setParticleMode={setParticleMode}
              setIsOrbiting={setIsOrbiting} // 🔧 Changed from setIsAutoOrbiting
              handleResetView={handleResetView}
              showNodeLabels={showNodeLabels} // Add this prop
              setShowNodeLabels={setShowNodeLabels} // Add this prop
              selectedChain={selectedChain}
              setSelectedChain={setSelectedChain}
            />
          </div>
        )}

        {/* Galaxy Visualization Area */}
        <div
          ref={graphWrapperRef}
          className={`relative bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center overflow-hidden transition-all duration-300 z-0 ${
            isFullscreen
              ? "w-screen h-screen fixed top-0 left-0 z-50"
              : "w-full max-w-[1280px] h-[75vh] max-h-[750px] rounded-2xl shadow-2xl shadow-blue-500/10"
          }`}
        >
          {/* Loading Spinner */}
          {loading && address && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <svg width="60" height="60">
                  <circle cx="30" cy="30" r="26" stroke="#3b82f6" strokeWidth="6" fill="none" opacity="0.2" />
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - progress.loaded / (progress.total || 1))}
                    style={{ transition: "stroke-dashoffset 0.2s" }}
                  />
                </svg>
                <div className="text-blue-200 font-medium">Loading graph...</div>
                <div className="text-slate-400 text-sm text-center">
                  Addresses with a lotta nodes may take a while... <br />
                  I&apos;m too broke for a premium API key
                </div>
              </div>
            </div>
          )}

          {/* SimpleCosmicGraph - Pass resetViewRef */}
          <SimpleCosmicGraph
            graphData={graphData}
            onSetTarget={handleSetTarget}
            isFullscreen={isFullscreen}
            targetNode={address.toLowerCase()}
            layoutMode={layoutMode}
            particleMode={particleMode}
            isAutoOrbiting={isOrbiting}
            onFullscreenToggle={handleFullscreenToggle}
            resetViewRef={resetViewRef}
            onViewStateChange={setCurrentViewState}
            showNodeLabels={showNodeLabels} // Add this prop
            selectedChain={selectedChain}
          />

          {/* Empty State */}
          {!loading && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-md">
                <div className="text-6xl mb-4 opacity-50">🌌</div>
                <div className="text-slate-300 text-xl mb-4 font-medium">
                  {!address
                    ? isConnected && connectedAddress
                      ? "Ready to explore"
                      : "Connect your wallet to begin"
                    : `No transfers found for this address on ${
                        {
                          ethereum: "Ethereum Mainnet",
                          sepolia: "Sepolia",
                          arbitrum: "Arbitrum One",
                          base: "Base",
                        }[selectedChain]
                      }`}
                </div>
                <div className="text-slate-400">
                  {!address
                    ? isConnected && connectedAddress
                      ? "Enter an address to begin"
                      : "Connect your wallet or enter an address to begin"
                    : "Try another address or switch networks."}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        {!isFullscreen && (
          <div className="w-full max-w-7xl mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-slate-800/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-center">
              <div className="text-blue-400 text-2xl mb-2">✨</div>
              <div className="text-blue-100 font-medium mb-1">3D Navigation</div>
              <div className="text-slate-400 text-sm">Pan, zoom, and orbit</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-purple-400 text-2xl mb-2">🌟</div>
              <div className="text-purple-100 font-medium mb-1">Live Particles</div>
              <div className="text-slate-400 text-sm">Follow transactions</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 text-center">
              <div className="text-cyan-400 text-2xl mb-2">🎯</div>
              <div className="text-cyan-100 font-medium mb-1">Interactive Nodes</div>
              <div className="text-slate-400 text-sm">Click nodes to explore</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
