import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function MintInfoTooltip() {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <button
        className="ml-2 text-blue-300 hover:text-blue-400 focus:outline-none"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        aria-label="What does mint do?"
        type="button"
      >
        <QuestionMarkCircleIcon className="w-5 h-5" />
      </button>
      {show && (
        <div className="absolute left-8 top-1 z-50 w-72 bg-slate-800 text-slate-100 text-sm rounded-lg shadow-lg p-4 border border-blue-500/30">
          <div className="font-semibold mb-1">What does "Mint Cosmic NFT" do?</div>
          <div>
            This will mint an NFT of the graph you see below, preserving its exact appearance and layout. 
            The NFT contains an interactive, on-chain visualization of your Ethereum address and its current connections
            <br /><br />
            <span className="text-blue-300">You can view, share, and trade this NFT like any other collectible!</span>
          </div>
        </div>
      )}
    </div>
  );
}