"use client";
import type { NextPage } from "next";
import { useState, useCallback, useEffect } from "react";
import { AddressInput } from "~~/components/scaffold-eth";
import VisNetworkGraph from "./graph/VisNetworkGraph";
// import CosmicForceGraph from "./graph/CosmicForceGraph"; // Add this import
import SimpleCosmicGraph from "./graph/SimpleCosmicGraph";
import { AssetTransfersResult } from "alchemy-sdk";
import { GraphNode, GraphLink } from "./graph-data/types";
import { fetchAllTransfers, fetchAllTransfersCached, FilterAndSortTx } from "./graph-data/utils";
import { generateNodesFromTx } from "./graph-data/generateNodesFromTx";

const Test: NextPage = () => {
  const [inputValue, setInputValue] = useState("");
  const [address, setAddress] = useState("");
  const [layerNum, setLayerNum] = useState(1);
  const [transferDirection, setTransferDirection] = useState<"from" | "to" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [allTransfers, setAllTransfers] = useState<AssetTransfersResult[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [txDisplayLimit, setTxDisplayLimit] = useState(10);
  const [useCosmicGraph, setUseCosmicGraph] = useState(false); // Add this line

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

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center py-6">
      {/* Controls Card */}
      <div className="w-full max-w-3xl bg-base-100 rounded-xl shadow-lg p-6 mb-6 flex flex-col md:flex-row md:items-end gap-6">
        {/* Address Input */}
        <div className="flex-1">
          <label className="block text-base-content mb-1 font-semibold">Target Address</label>
          <AddressInput
            value={inputValue}
            onChange={value => setInputValue(value)}
            name="Target Address"
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
            <button
              className="btn btn-secondary"
              onClick={() => {
                setAddress("");
                setInputValue("");
                setGraphData({ nodes: [], links: [] });
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
              max="200"
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

        {/* Direction + Graph Type Controls */}
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

          {/* Graph Type Toggle */}
          <div className="flex flex-col gap-2">
            <label className="block text-base-content mb-1 font-semibold">Visualization</label>
            <div className="btn-group flex">
              <button
                className={`btn btn-sm ${!useCosmicGraph ? "btn-active btn-primary" : ""}`}
                onClick={() => setUseCosmicGraph(false)}
                disabled={loading}
              >
                Network
              </button>
              <button
                className={`btn btn-sm ${useCosmicGraph ? "btn-active btn-primary" : ""}`}
                onClick={() => setUseCosmicGraph(true)}
                disabled={loading}
              >
                🌌 Cosmic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div className="w-full max-w-6xl h-[70vh] bg-base-100 rounded-xl shadow-lg flex items-center justify-center relative">
        {/* Loading Spinner */}
        {loading && address && (
          <div className="absolute inset-0 flex items-center justify-center bg-base-100 bg-opacity-80 z-10 rounded-xl">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}
        
        {/* Conditional Graph Rendering */}
        {useCosmicGraph ? (
          // <CosmicForceGraph graphData={graphData} />
          // If CosmicForceGraph fails, you can switch to:
          <SimpleCosmicGraph graphData={graphData} />
        ) : (
          <VisNetworkGraph graphData={graphData} />
        )}
        
        {!loading && (!address || graphData.nodes.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/50 text-lg">
            Enter an address to view the graph.
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;