"use client";
import type { NextPage } from "next";
import { useState } from "react";
import { Address, AddressInput, Balance, EtherInput, IntegerInput } from "~~/components/scaffold-eth";
import GraphViewModular from "./graph/GraphViewModular";
import { GenerateTx } from "./graph-data/GenerateTx";

const Test: NextPage = () => {
  // const address = "0x65aFADD39029741B3b8f0756952C74678c9cEC93";
  // const address = "0xcC6eDeB501BbD8AD9E028BDe937B63Cdd64A1D91";
  // const address = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543";
  const [inputValue, setInputValue] = useState(""); // holds the text in the input box
  const [address, setAddress] = useState("0xcC6eDeB501BbD8AD9E028BDe937B63Cdd64A1D91");       // confirmed address on button click

  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  const [sliderValue, setSliderValue] = useState(10); // Example default depth or count

  const [transferDirection, setTransferDirection] = useState<"from" | "to" | "both">("both");

  return (
    <div>
      {/* <WrapperClient address={address} /> */}
       <div className="flex flex-col w-full mb-2">
          <label className="text-sm mb-1">Set Address:</label>
        <AddressInput
          value={inputValue}
          onChange={value => {
            setInputValue(value); // updates text box display
          }}
          name="Target Address"
        />
        <button
          className="btn btn-primary h-[2.2rem] min-h-[2.2rem] mt-2"
          onClick={() => {
            setAddress(inputValue); // updates actual address state
            setInputValue("");
          }}
        >
          Send
        </button>
      </div>
      <div>
        <button
          className="btn btn-primary h-[2.2rem] min-h-[2.2rem] mt-2"
          onClick={() => {
            setAddress(""); // updates actual address state
          }}
        >
          Clear
        </button>
      </div>
      <div>
        {/* <WrapperNode address= {address} /> */}
        {/* <GraphData address={address} onGraphDataReady={setGraphData} /> */}
        {/* OK THIS ONE DOES WORK (BELOW) */}
        {/* <GraphDatamodular address={address} onGraphDataReady={setGraphData} /> */} 
        
        
      </div>
            <div className="relative w-full h-[80vh] mt-8">
              {/* Main graph display full width/height */}
              <div className="w-full h-full">
                <GenerateTx address={address} txNum={sliderValue} direction={transferDirection} onGraphDataReady={setGraphData} />
                <GraphViewModular graphData={graphData} />
              </div>

              {/* Slider fixed in bottom-right corner */}
              <div className="absolute top-4 right-4 flex flex-col items-center">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={sliderValue}
                  onChange={e => {
                    setSliderValue(Number(e.target.value));
                    console.log("Slider value:", e.target.value);
                  }}
                  className="range rotate-[-90deg]"
                />
                <div className="btn-group mt-4">
                  <button
                    className={`btn btn-sm ${transferDirection === "from" ? "btn-active" : ""}`}
                    onClick={() => setTransferDirection("from")}
                  >
                    Sent
                  </button>
                  <button
                    className={`btn btn-sm ${transferDirection === "to" ? "btn-active" : ""}`}
                    onClick={() => setTransferDirection("to")}
                  >
                    Received
                  </button>
                  <button
                    className={`btn btn-sm ${transferDirection === "both" ? "btn-active" : ""}`}
                    onClick={() => setTransferDirection("both")}
                  >
                    All
                  </button>
                </div>
              </div>
              <div className="absolute top-24 right-12 flex flex-col items-center">
                <span className="text-sm mt-2 text-white">Depth: {sliderValue}</span>
              </div>
            </div>
      
            </div>
  );

};

export default Test;