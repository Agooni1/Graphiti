"use client";
import type { NextPage } from "next";
import { useState, useCallback } from "react";
import { AddressInput } from "~~/components/scaffold-eth";
import GraphViewModular from "./graph/GraphViewModular";
import { GenerateTx } from "./graph-data/GenerateTx";

const Test: NextPage = () => {
  const [inputValue, setInputValue] = useState("");
  const [address, setAddress] = useState("");
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [sliderValue, setSliderValue] = useState(10);
  const [layerNum, setLayerNum] = useState(1);
  const [transferDirection, setTransferDirection] = useState<"from" | "to" | "both">("both");
  const [loading, setLoading] = useState(false);

  // Stable callback for graph data
  const handleGraphDataReady = useCallback((data: any) => {
    setGraphData(data);
    setLoading(false);
  }, []);

  // When address/params change, show loading spinner
  const handleParamsChange = () => {
    setLoading(true);
  };

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
                setAddress(inputValue);
                setInputValue("");
                handleParamsChange();
              }}
              disabled={!inputValue}
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
            >
              Clear
            </button>
          </div>
        </div>
        {/* Sliders */}
        <div className="flex flex-col gap-4 w-48">
          <div>
            <label className="block text-base-content mb-1 font-semibold">Transactions per Layer</label>
            <input
              type="range"
              min="1"
              max="50"
              value={sliderValue}
              onChange={e => {
                setSliderValue(Number(e.target.value));
                handleParamsChange();
              }}
              className="range w-full"
            />
            <div className="text-center text-base-content/50 text-xs mt-1">{sliderValue} tx</div>
          </div>
          <div>
            <label className="block text-base-content mb-1 font-semibold">Graph Depth</label>
            <input
              type="range"
              min="1"
              max="5"
              value={layerNum}
              onChange={e => {
                setLayerNum(Number(e.target.value));
                handleParamsChange();
              }}
              className="range w-full"
            />
            <div className="text-center text-base-content/50 text-xs mt-1">Depth: {layerNum}</div>
          </div>
        </div>
        {/* Direction Buttons */}
        <div className="flex flex-col gap-2">
          <label className="block text-base-content mb-1 font-semibold">Direction</label>
          <div className="btn-group flex">
            <button
              className={`btn btn-sm ${transferDirection === "from" ? "btn-active btn-primary" : ""}`}
              onClick={() => { setTransferDirection("from"); handleParamsChange(); }}
            >
              Sent
            </button>
            <button
              className={`btn btn-sm ${transferDirection === "to" ? "btn-active btn-primary" : ""}`}
              onClick={() => { setTransferDirection("to"); handleParamsChange(); }}
            >
              Received
            </button>
            <button
              className={`btn btn-sm ${transferDirection === "both" ? "btn-active btn-primary" : ""}`}
              onClick={() => { setTransferDirection("both"); handleParamsChange(); }}
            >
              All
            </button>
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
        {/* Graph */}
        {address && (
          <>
            <GenerateTx
              address={address}
              txNum={sliderValue}
              NumLayers={layerNum - 1}
              direction={transferDirection}
              onGraphDataReady={handleGraphDataReady}
            />
            <GraphViewModular graphData={graphData} />
          </>
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