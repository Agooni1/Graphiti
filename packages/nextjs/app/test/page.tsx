"use client";
import type { NextPage } from "next";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { AddressInput, BlockieAvatar } from "~~/components/scaffold-eth";
import SimpleCosmicGraph from "./graph/SimpleCosmicGraph";
import { AssetTransfersResult } from "alchemy-sdk";
import { GraphNode, GraphLink } from "./graph-data/types";
import { fetchAllTransfers, fetchAllTransfersCached, FilterAndSortTx } from "./graph-data/utils";
import { generateNodesFromTx } from "./graph-data/generateNodesFromTx";
import { SparklesIcon, MagnifyingGlassIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from "@heroicons/react/24/outline";

const Test: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [inputValue, setInputValue] = useState("");
  const [address, setAddress] = useState("");
  const [layerNum, setLayerNum] = useState(1);
  const [transferDirection, setTransferDirection] = useState<"from" | "to" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [allTransfers, setAllTransfers] = useState<AssetTransfersResult[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [txDisplayLimit, setTxDisplayLimit] = useState(10);
  
  // Add state to track if we've already auto-loaded wallet address
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  
  // Add ref for fullscreen functionality
  const graphWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-load connected wallet address when wallet connects
  useEffect(() => {
    if (isConnected && connectedAddress && !hasAutoLoaded && !address) {
      // console.log("Wallet connected, auto-loading address:", connectedAddress);
      setAddress(connectedAddress);
      setInputValue(""); // Clear input since we're setting from wallet
      setHasAutoLoaded(true); // Prevent auto-loading again
      handleParamsChange();
    }
  }, [isConnected, connectedAddress, hasAutoLoaded, address]);

  // Reset auto-load flag when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasAutoLoaded(false);
    }
  }, [isConnected]);

  // Track fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Stable callback for graph data
  const handleGraphDataReady = useCallback((data: any) => {
    setGraphData(data);
    setLoading(false);
  }, []);

  // When address/params change, show loading spinner
  const handleParamsChange = () => {
    setLoading(true);
  };

  useEffect(() => {
    if (!address) return;
    fetchAllTransfersCached(address).then(transfers => {
      setAllTransfers(transfers);
    });
  }, [address]);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!allTransfers.length) {
        setGraphData({ nodes: [], links: [] });
        setLoading(false);
        return;
      }

      const filtered: any[] = FilterAndSortTx(allTransfers, {
        maxCount: txDisplayLimit,
        direction: transferDirection,
        address: address,
      });

      const graph = await generateNodesFromTx(filtered);
      setGraphData(graph);
      setLoading(false);
    };

    fetchGraphData();
  }, [allTransfers, txDisplayLimit, transferDirection, layerNum]);

  // New handler function
  const handleSetTarget = (newAddress: string) => {
    console.log("Setting new target address:", newAddress);
    setAddress(newAddress);
    setInputValue(""); // Clear input
    handleParamsChange(); // Trigger loading
  };

  // Fullscreen toggle handler
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
            🌌 Explorer
          </h1>
          <p className="text-slate-300 text-lg">Navigate the Ethereum Universe</p>
        </div>

        {/* Controls Card */}
        <div className="w-full max-w-5xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            
            {/* Address Input Section */}
            <div className="flex-1">
              <label className="block text-blue-100 mb-2 font-semibold text-sm flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                Target Stellar Address
                {/* Show current address with mini BlockieAvatar */}
                {address && (
                  <span className="ml-2 text-xs text-cyan-400 inline-flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-full">
                    {address.slice(0, 6)}...{address.slice(-4)}
                    <BlockieAvatar address={address} size={14} />
                    {isConnected && connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase() && (
                      <span className="ml-0.5 opacity-70">(connected)</span>
                    )}
                  </span>
                )}
              </label>
              <div className="relative">
                <AddressInput
                  value={inputValue}
                  onChange={value => setInputValue(value)}
                  name="Target Address"
                  placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Enter cosmic address..."}
                />
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  className="btn btn-primary bg-gradient-to-r from-blue-600 to-purple-600 border-none hover:scale-105 transition-transform"
                  onClick={() => {
                    if (address.toLowerCase() !== inputValue.toLowerCase()) {
                      setTxDisplayLimit(10);
                    }
                    setAddress(inputValue);
                    setInputValue("");
                    handleParamsChange();
                  }}
                  disabled={!inputValue || loading}
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Explore
                </button>
                
                {/* Add button to use connected wallet */}
                {/* {isConnected && connectedAddress && address.toLowerCase() !== connectedAddress.toLowerCase() && ( */}
                  <button
                    className="btn bg-gradient-to-r from-cyan-600 to-blue-600 border-none text-white hover:scale-105 transition-transform"
                    onClick={() => {
                      setAddress(connectedAddress? connectedAddress : "");
                      setInputValue("");
                      handleParamsChange();
                    }}
                    // disabled={loading}
                  >
                    Use Wallet
                  </button>

                  {/* Add reload button */}
                  {/* <button
                    className="btn bg-gradient-to-r from-green-600 to-emerald-600 border-none text-white hover:scale-105 transition-transform"
                    onClick={() => {
                      if (address) {
                        handleParamsChange(); // Reload current address
                      }
                    }}
                    // disabled={!address || loading}
                    title="Reload current address data"
                  >
                    🔄 Reload
                  </button> */}
                
                <button
                  className="btn btn-outline border-slate-600 text-slate-300 hover:border-slate-400"
                  onClick={() => {
                    setAddress("");
                    setInputValue("");
                    setGraphData({ nodes: [], links: [] });
                    setHasAutoLoaded(false); // Reset auto-load flag
                  }}
                  // disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Control Sliders */}
            <div className="flex flex-col lg:flex-row gap-6 lg:w-96">
              <div className="flex-1">
                <label className="block text-blue-100 mb-2 font-semibold text-sm">
                  Transaction Streams: <span className="text-cyan-400">{txDisplayLimit}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={txDisplayLimit}
                  onChange={e => {
                    setTxDisplayLimit(Number(e.target.value));
                  }}
                  className="range range-primary w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1</span>
                  <span>500</span>
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-blue-100 mb-2 font-semibold text-sm">
                  Galaxy Depth: <span className="text-purple-400">{layerNum}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={layerNum}
                  onChange={e => {
                    setLayerNum(Number(e.target.value));
                    handleParamsChange();
                  }}
                  className="range range-secondary w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            {/* Direction Controls */}
            <div className="flex flex-col gap-2">
              <label className="block text-blue-100 mb-1 font-semibold text-sm">Flow Direction</label>
              <div className="btn-group">
                <button
                  className={`btn btn-sm ${transferDirection === "from" ? "btn-primary bg-gradient-to-r from-red-500 to-red-600" : "btn-outline border-slate-600 text-slate-300"}`}
                  onClick={() => { setTransferDirection("from"); handleParamsChange(); }}
                  disabled={loading}
                >
                  Sent
                </button>
                <button
                  className={`btn btn-sm ${transferDirection === "to" ? "btn-primary bg-gradient-to-r from-green-500 to-green-600" : "btn-outline border-slate-600 text-slate-300"}`}
                  onClick={() => { setTransferDirection("to"); handleParamsChange(); }}
                  disabled={loading}
                >
                  Received
                </button>
                <button
                  className={`btn btn-sm ${transferDirection === "both" ? "btn-primary bg-gradient-to-r from-blue-500 to-purple-600" : "btn-outline border-slate-600 text-slate-300"}`}
                  onClick={() => { setTransferDirection("both"); handleParamsChange(); }}
                  disabled={loading}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Galaxy Visualization Area */}
        <div
          ref={graphWrapperRef}
          className={`relative bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? "w-screen h-screen fixed top-0 left-0 z-50" 
              : "w-full max-w-7xl h-[75vh] rounded-2xl shadow-2xl shadow-blue-500/10"
          }`}
        >
          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreenToggle}
            className="absolute top-4 right-4 btn btn-sm bg-slate-800/80 backdrop-blur-sm border-slate-600 text-slate-300 hover:bg-slate-700 z-20 transition-all hover:scale-105"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
          </button>
          
          {/* Loading Spinner */}
          {loading && address && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  <div className="animate-ping absolute top-0 left-0 rounded-full h-12 w-12 border border-blue-400/20"></div>
                </div>
                <div className="text-blue-200 font-medium">Mapping the cosmos...</div>
                <div className="text-slate-400 text-sm">Discovering stellar connections</div>
              </div>
            </div>
          )}
          
          {/* SimpleCosmicGraph - Pass fullscreen state */}
          <SimpleCosmicGraph 
            graphData={graphData} 
            onSetTarget={handleSetTarget}
            isFullscreen={isFullscreen}
            targetNode={address}
          />
          
          {/* Empty State */}
          {!loading && (!address || graphData.nodes.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div className="max-w-md">
                <div className="text-6xl mb-4 opacity-50">🌌</div>
                <div className="text-slate-300 text-xl mb-4 font-medium">
                  {isConnected && connectedAddress ? 
                    "Ready to explore the cosmos" :
                    "Connect your wallet to begin"
                  }
                </div>
                <div className="text-slate-400">
                  {isConnected && connectedAddress ? 
                    "Enter an address above to visualize the Ethereum galaxy" :
                    "Connect your wallet or enter an address to explore the universe"
                  }
                </div>
              </div>
            </div>
          )}

          {/* Stats Overlay */}
          {!loading && graphData.nodes.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/50">
              <div className="text-xs text-slate-300">
                <span className="text-blue-400 font-medium">{graphData.nodes.length}</span> stellar objects • 
                <span className="text-purple-400 font-medium ml-1">{graphData.links.length}</span> cosmic streams
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
              <div className="text-slate-400 text-sm">Pan, zoom, and orbit through space</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-purple-400 text-2xl mb-2">🌟</div>
              <div className="text-purple-100 font-medium mb-1">Live Particles</div>
              <div className="text-slate-400 text-sm">Watch transactions flow as cosmic energy</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 text-center">
              <div className="text-cyan-400 text-2xl mb-2">🎯</div>
              <div className="text-cyan-100 font-medium mb-1">Interactive Nodes</div>
              <div className="text-slate-400 text-sm">Click nodes to explore new galaxies</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;