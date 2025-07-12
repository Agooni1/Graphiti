"use client";

import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export function MintInfoTooltip() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
        type="button"
      >
        <InformationCircleIcon className="h-6 w-6" />
      </button>
      
      {isVisible && (
        <div className="absolute right-0 top-6 w-80 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl z-[100]">
          <div className="text-white font-semibold text-sm mb-2">
            What does "Mint Cosmic NFT" do?
          </div>
          <div className="text-slate-300 text-xs leading-relaxed space-y-2">
            <p>
              This will mint an NFT of the graph you see below, preserving its exact 
              state and making it <strong>fully interactive</strong>. The NFT includes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Complete 3D visualization with all nodes and connections</li>
              <li>Current camera position and zoom level</li>
              <li>Selected layout mode and particle effects</li>
              <li>Interactive navigation (pan, zoom, orbit)</li>
            </ul>
            
            <div className="bg-amber-900/30 border border-amber-600/50 rounded px-2 py-0">
              <p className="text-amber-200 text-xs font-medium italic flex items-center gap-1">
                <span>Node labels not included in final NFT</span>
              </p>
              <p className="text-amber-200 text-xs font-medium italic flex items-center gap-1">
                <span>Minting to the same address again will burn its previous NFT</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}