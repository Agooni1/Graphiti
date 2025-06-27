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
import { generateGraphHTML, downloadGraphHTML, getGraphHTMLForIPFS } from './graph/htmlGraphGenerator';
import { 
  SparklesIcon, 
  MagnifyingGlassIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  BoltIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  AdjustmentsHorizontalIcon,
  ArrowPathRoundedSquareIcon as SwirlIcon,
  XMarkIcon, // For the "Off" button
  DocumentArrowDownIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { MintCosmicNFT } from "./_components/MintCosmicNFT";

const Test: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [inputValue, setInputValue] = useState("");
  const [address, setAddress] = useState("");
  const [layerNum, setLayerNum] = useState(1);
  const [transferDirection, setTransferDirection] = useState<"from" | "to" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [allTransfers, setAllTransfers] = useState<AssetTransfersResult[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [txDisplayLimit, setTxDisplayLimit] = useState(200);
  
  // Add state to track if we've already auto-loaded wallet address
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  
  // Add ref for fullscreen functionality
  const graphWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Add progress state
  const [progress, setProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  // Add graph control states - Update particleMode to include 'off'
  const [layoutMode, setLayoutMode] = useState<'shell' | 'force' | 'fibonacci'>('shell');
  const [particleMode, setParticleMode] = useState<'pulse' | 'laser' | 'off'>('pulse');
  const [isAutoOrbiting, setIsAutoOrbiting] = useState(true); //default to true for auto-orbiting

  // Create a ref to store the reset function from the graph component
  const resetViewRef = useRef<(() => void) | null>(null);

  // Add view state tracking
  const [currentViewState, setCurrentViewState] = useState<{
    zoom: number;
    panOffset: { x: number; y: number };
    orbitRotation: { x: number; y: number };
  } | null>(null);

  // Auto-load connected wallet address when wallet connects
  useEffect(() => {
    if (isConnected && connectedAddress && !hasAutoLoaded && !address) {
      setAddress(connectedAddress);
      setInputValue("");
      setHasAutoLoaded(true);
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
        setProgress({ loaded: 0, total: 0 });
        return;
      }

      const filtered: any[] = FilterAndSortTx(allTransfers, {
        maxCount: txDisplayLimit,
        direction: transferDirection,
        address: address,
      });

      setProgress({ loaded: 0, total: filtered.length });

      const graph = await generateNodesFromTx(filtered, (loaded, total) => {
        setProgress({ loaded, total });
      });
      setGraphData(graph);
      setLoading(false);
    };

    fetchGraphData();
  }, [allTransfers, txDisplayLimit, transferDirection, layerNum]);

  // New handler function
  const handleSetTarget = (newAddress: string) => {
    setAddress(newAddress.toLowerCase());
    setInputValue("");
    handleParamsChange();
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

  // Graph control handlers - now actually calls the reset function
  const handleResetView = () => {
    console.log('Reset button clicked, calling resetViewRef.current');
    if (resetViewRef.current) {
      resetViewRef.current();
    } else {
      console.log('resetViewRef.current is null');
    }
  };

  // New handler for clearing everything - enhanced version
  const handleClear = () => {
    // Clear all state
    setAddress("");
    setInputValue("");
    setGraphData({ nodes: [], links: [] });
    setAllTransfers([]);
    setHasAutoLoaded(false);
    setLoading(false);
    setProgress({ loaded: 0, total: 0 });
    
    // Also reset graph view position
    if (resetViewRef.current) {
      resetViewRef.current();
    }
    
    // Force a re-render by updating a key or similar
    // This ensures any cached rendering state is cleared
    setTimeout(() => {
      setGraphData({ nodes: [], links: [] });
    }, 50);
  };

  // Add these handler functions after your existing handlers
  const handleDownloadGraph = () => {
    if (!address || !graphData.nodes.length) {
      alert('No graph data to download. Please load a graph first.');
      return;
    }

    const config = {
      graphData,
      targetNode: address,
      layoutMode,
      particleMode,
      isAutoOrbiting,
      viewState: currentViewState === null ? undefined : currentViewState // Ensure undefined, not null
    };
    
    console.log('Downloading graph with config (including view state):', config);
    downloadGraphHTML(config);
  };

  const handlePreviewHTML = () => {
    if (!address || !graphData.nodes.length) {
      alert('No graph data to preview. Please load a graph first.');
      return;
    }

    const config = {
      graphData,
      targetNode: address,
      layoutMode,
      particleMode,
      isAutoOrbiting,
      viewState: currentViewState === null ? undefined : currentViewState // Ensure undefined, not null
    };
    
    console.log('Generating HTML preview with config (including view state):', config);
    const htmlContent = getGraphHTMLForIPFS(config);
    
    // Open in new window for preview
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
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
          <div className="w-full max-w-6xl bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left Section - Address Input */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-blue-100 mb-2 font-semibold text-sm flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    Address
                    {address && (
                      <span className="ml-2 text-xs text-cyan-400 inline-flex items-center gap-1.5 bg-slate-700/50 px-2 py-1 rounded-full">
                        {address.slice(0, 6)}...{address.slice(-4)}
                        <BlockieAvatar address={address} size={14} />
                        {isConnected && connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase() && (
                          <span className="ml-0.5 opacity-70">(you)</span>
                        )}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <AddressInput
                      value={inputValue}
                      onChange={value => setInputValue(value)}
                      name="Target Address"
                      placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Paste or type address..."}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      className="btn btn-primary bg-gradient-to-r from-blue-600 to-purple-600 border-none hover:scale-105 transition-transform"
                      onClick={() => {
                        setAddress(inputValue);
                        setInputValue("");
                        handleParamsChange();
                      }}
                      disabled={!inputValue || loading}
                    >
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      Explore
                    </button>
                    <button
                      className="btn bg-gradient-to-r from-cyan-600 to-blue-600 border-none text-white hover:scale-105 transition-transform"
                      onClick={() => {
                        setAddress(connectedAddress ? connectedAddress : "");
                        setInputValue("");
                        handleParamsChange();
                      }}
                    >
                      Use Wallet
                    </button>
                    
                    {/* Softer Clear button without trash icon */}
                    <button
                      className="btn btn-outline border-slate-500 text-slate-300 hover:border-slate-400 hover:bg-slate-600/20"
                      onClick={handleClear}
                      title="Clear all data and start fresh"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Section - Graph Controls (now includes Direction) */}
              <div className="bg-slate-700/30 border border-slate-600/40 rounded-lg p-4 space-y-4">
                <div className="text-blue-100 font-semibold text-sm flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  Graph Controls
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Direction Controls - moved here */}
                  <div>
                    <div className="text-xs text-slate-300 font-medium mb-2">Transactions</div>
                    <div className="flex flex-col gap-1">
                      {[
                        { mode: 'both', label: 'All' },
                        { mode: 'from', label: 'Sent' },
                        { mode: 'to', label: 'Received' },
                      ].map(({ mode, label }) => (
                        <button
                          key={mode}
                          className={`btn btn-xs ${
                            transferDirection === mode 
                              ? 'btn-primary bg-gradient-to-r from-blue-600 to-purple-600' 
                              : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                          }`}
                          onClick={() => { 
                            setTransferDirection(mode as any); 
                            handleParamsChange(); 
                          }}
                          disabled={loading}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Controls */}
                  <div>
                    <div className="text-xs text-slate-300 font-medium mb-2">Layout</div>
                    <div className="flex gap-1">
                      {[
                        { mode: 'shell', icon: Squares2X2Icon, label: 'Shell' },
                        { mode: 'force', icon: BoltIcon, label: 'Force' },
                        { mode: 'fibonacci', icon: SwirlIcon, label: 'Spiral' }
                      ].map(({ mode, icon: Icon, label }) => (
                        <button
                          key={mode}
                          className={`btn btn-xs ${
                            layoutMode === mode 
                              ? 'btn-primary bg-gradient-to-r from-blue-600 to-purple-600' 
                              : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                          }`}
                          onClick={() => setLayoutMode(mode as any)}
                          title={`${label} Layout`}
                        >
                          <Icon className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Particle Controls - with 'off' option */}
                  <div>
                    <div className="text-xs text-slate-300 font-medium mb-2">Particles</div>
                    <div className="flex gap-1">
                      {[
                        { mode: 'pulse', icon: PlayIcon, label: 'Pulse' },
                        { mode: 'laser', icon: BoltIcon, label: 'Laser' },
                        { mode: 'off', icon: XMarkIcon, label: 'Off' }
                      ].map(({ mode, icon: Icon, label }) => (
                        <button
                          key={mode}
                          className={`btn btn-xs ${
                            particleMode === mode 
                              ? (mode === 'off' 
                                  ? 'btn-primary bg-gradient-to-r from-gray-600 to-gray-700' 
                                  : 'btn-primary bg-gradient-to-r from-purple-600 to-pink-600')
                              : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                          }`}
                          onClick={() => setParticleMode(mode as any)}
                          title={`${label} Mode`}
                        >
                          <Icon className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Enhanced with HTML generation */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-600/30">
                  <div className="flex gap-2">
                    <button
                      className={`btn btn-xs flex-1 ${
                        isAutoOrbiting 
                          ? 'btn-primary bg-gradient-to-r from-cyan-600 to-blue-600' 
                          : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                      }`}
                      onClick={() => setIsAutoOrbiting(prev => !prev)}
                      title={isAutoOrbiting ? "Pause Orbit" : "Auto Orbit"}
                    >
                      {isAutoOrbiting ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
                      {isAutoOrbiting ? "Pause" : "Orbit"}
                    </button>
                    
                    <button
                      onClick={handleResetView}
                      className="btn btn-xs flex-1 btn-outline border-slate-600 text-slate-300 hover:border-slate-400"
                      title="Reset View"
                    >
                      <ArrowPathIcon className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Galaxy Visualization Area */}
        <div
          ref={graphWrapperRef}
          className={`relative bg-slate-900/50 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isFullscreen 
              ? "w-screen h-screen fixed top-0 left-0 z-50" 
              : "w-full max-w-7xl h-[75vh] rounded-2xl shadow-2xl shadow-blue-500/10"
          }`}
        >
          {/* Loading Spinner */}
          {loading && address && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                <svg width="60" height="60">
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.2"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={
                      2 * Math.PI * 26 * (1 - (progress.loaded / (progress.total || 1)))
                    }
                    style={{ transition: "stroke-dashoffset 0.2s" }}
                  />
                </svg>
                <div className="text-blue-200 font-medium">
                  Loading graph...
                </div>
                <div className="text-slate-400 text-sm text-center">
                  Addresses with a lotta nodes may take a while... <br />
                  Pls be patient I'm too broke for a premium API key
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
            isAutoOrbiting={isAutoOrbiting}
            onFullscreenToggle={handleFullscreenToggle}
            resetViewRef={resetViewRef}
            onViewStateChange={setCurrentViewState} // Add this prop
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

        {/* Mint NFT Section - Replace the HTML Generation Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleResetView}
            className="btn btn-xs flex-1 btn-outline border-slate-600 text-slate-300 hover:border-slate-400"
            title="Reset View"
          >
            <ArrowPathIcon className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Add the Mint Component */}
        <div className="pt-4 border-t border-slate-600/30">
          <MintCosmicNFT 
            graphConfig={{
              graphData,
              targetNode: address.toLowerCase(),
              layoutMode,
              particleMode,
              isAutoOrbiting,
              viewState: currentViewState === null ? undefined : currentViewState
            }}
            disabled={!address || !graphData.nodes.length}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Test;