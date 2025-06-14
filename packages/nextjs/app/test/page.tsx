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
      console.log("Wallet connected, auto-loading address:", connectedAddress);
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
    <div className="min-h-screen bg-base-200 flex flex-col items-center py-6">
      {/* Controls Card */}
      <div className="w-full max-w-3xl bg-base-100 rounded-xl shadow-lg p-6 mb-6 flex flex-col md:flex-row md:items-end gap-6">
        {/* Address Input */}
        <div className="flex-1">
          <label className="block text-base-content mb-1 font-semibold">
            Target Address
            {/* Show current address with mini BlockieAvatar */}
            {address && (
              <span className="ml-2 text-xs text-success inline-flex items-center gap-1.5">
                {address.slice(0, 6)}...{address.slice(-4)}
                <BlockieAvatar address={address} size={14} />
                {isConnected && connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase() && (
                  <span className="ml-0.5 opacity-70">(wallet)</span>
                )}
              </span>
            )}
          </label>
          <AddressInput
            value={inputValue}
            onChange={value => setInputValue(value)}
            name="Target Address"
            placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Enter address..."}
          />
          <div className="flex gap-2 mt-2">
            <button
              className="btn btn-primary"
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
              <span>Set</span>
            </button>
            
            {/* Add button to use connected wallet */}
            {isConnected && connectedAddress && address.toLowerCase() !== connectedAddress.toLowerCase() && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAddress(connectedAddress);
                  setInputValue("");
                  handleParamsChange();
                }}
                disabled={loading}
              >
                Use Wallet
              </button>
            )}
            
            <button
              className="btn btn-secondary"
              onClick={() => {
                setAddress("");
                setInputValue("");
                setGraphData({ nodes: [], links: [] });
                setHasAutoLoaded(false); // Reset auto-load flag
              }}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4 w-48">
          <div>
            <label className="block text-base-content mb-1 font-semibold">Transactions:</label>
            <input
              type="range"
              min="1"
              max="500"
              value={txDisplayLimit}
              onChange={e => {
                setTxDisplayLimit(Number(e.target.value));
              }}
              className="range w-full"
              disabled={loading}
            />
            <div className="text-center text-base-content/50 text-xs mt-1">{txDisplayLimit} tx</div>
          </div>
          <div>
            <label className="block text-base-content mb-1 font-semibold">Graph Depth</label>
            <input
              type="range"
              min="1"
              max="5"
              value={layerNum}
              onChange={a => {
                setLayerNum(Number(a.target.value));
                handleParamsChange();
              }}
              className="range w-full"
            />
            <div className="text-center text-base-content/50 text-xs mt-1">Depth: {layerNum}</div>
          </div>
        </div>

        {/* Direction Controls */}
        <div className="flex flex-col gap-4">
          {/* Direction Buttons */}
          <div className="flex flex-col gap-2">
            <label className="block text-base-content mb-1 font-semibold">Direction</label>
            <div className="btn-group flex">
              <button
                className={`btn btn-sm ${transferDirection === "from" ? "btn-active btn-primary" : ""}`}
                onClick={() => { setTransferDirection("from"); handleParamsChange(); }}
                disabled={loading}
              >
                Sent
              </button>
              <button
                className={`btn btn-sm ${transferDirection === "to" ? "btn-active btn-primary" : ""}`}
                onClick={() => { setTransferDirection("to"); handleParamsChange(); }}
                disabled={loading}
              >
                Received
              </button>
              <button
                className={`btn btn-sm ${transferDirection === "both" ? "btn-active btn-primary" : ""}`}
                onClick={() => { setTransferDirection("both"); handleParamsChange(); }}
                disabled={loading}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Area - Updated with dynamic sizing */}
      <div
        ref={graphWrapperRef}
        className={`relative bg-base-100 flex items-center justify-center overflow-hidden ${
          isFullscreen 
            ? "w-screen h-screen fixed top-0 left-0 z-50" 
            : "w-full max-w-6xl h-[70vh] rounded-xl shadow-lg"
        }`}
      >
        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreenToggle}
          className="absolute top-3 right-3 btn btn-sm btn-outline z-20"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            // Exit fullscreen icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9V4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v4.5M15 15h4.5M15 15l5.5 5.5" />
            </svg>
          ) : (
            // Enter fullscreen icon
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
        </button>
        
        {/* Loading Spinner */}
        {loading && address && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-80 z-10 rounded-xl">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}
        
        {/* SimpleCosmicGraph - Pass fullscreen state */}
        <SimpleCosmicGraph 
          graphData={graphData} 
          onSetTarget={handleSetTarget}
          isFullscreen={isFullscreen}
        />
        
        {!loading && (!address || graphData.nodes.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/50 text-lg">
            {isConnected && connectedAddress ? 
              "Connect your wallet above or enter an address to view the graph." :
              "Connect your wallet or enter an address to view the graph."
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;