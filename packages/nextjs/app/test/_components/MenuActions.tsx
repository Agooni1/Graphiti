import { useAccount } from "wagmi";
import { AddressInput, BlockieAvatar } from "~~/components/scaffold-eth";
import {
  MagnifyingGlassIcon, 
  SparklesIcon, 
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  BoltIcon,
  ArrowPathRoundedSquareIcon as SwirlIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  XMarkIcon,
  TagIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { MintCosmicNFT } from "./MintCosmicNFT";
import { MintInfoTooltip } from "./MintInfoTooltip";
import { useState } from "react"; // Add if not already imported

const CHAIN_OPTIONS = [
  { value: "ethereum", label: "Ethereum Mainnet" },
  { value: "sepolia", label: "Sepolia" },
  { value: "arbitrum", label: "Arbitrum One" },
  { value: "base", label: "Base" },
];

interface MenuActionsProps {
  inputValue: string;
  setInputValue: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  connectedAddress: string;
  isConnected: boolean;
  loading: boolean;
  handleParamsChange: () => void;
  handleClear: () => void;
  graphData: any;
  layoutMode: any;
  particleMode: any;
  isOrbiting: boolean;  // 🔧 Changed from isAutoOrbiting
  currentViewState: any;
  // Add new props for graph controls
  transferDirection: 'from' | 'to' | 'both';
  setTransferDirection: (v: 'from' | 'to' | 'both') => void;
  setLayoutMode: (v: any) => void;
  setParticleMode: (v: any) => void;
  setIsOrbiting: (v: boolean) => void;  // 🔧 Changed from setIsAutoOrbiting
  handleResetView: () => void;
  showNodeLabels: boolean; // Add this
  setShowNodeLabels: (v: boolean) => void; // Add this
  selectedChain: "ethereum" | "sepolia" | "arbitrum" | "base";
  setSelectedChain: (v: "ethereum" | "sepolia" | "arbitrum" | "base") => void;
}

export function MenuActions({
  inputValue,
  setInputValue,
  address,
  setAddress,
  connectedAddress,
  isConnected,
  loading,
  handleParamsChange,
  handleClear,
  graphData,
  layoutMode,
  particleMode,
  isOrbiting,  // 🔧 Changed from isAutoOrbiting
  currentViewState,
  transferDirection,
  setTransferDirection,
  setLayoutMode,
  setParticleMode,
  setIsOrbiting,  // 🔧 Changed from setIsAutoOrbiting
  handleResetView,
  showNodeLabels,
  setShowNodeLabels,
  selectedChain,
  setSelectedChain,
}: MenuActionsProps) {
  // Only enable minting on sepolia or arbitrum
  const canMint = selectedChain === "sepolia" || selectedChain === "arbitrum";

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Section - Address Controls (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-blue-100 font-semibold text-sm flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Address
            </label>
            {address && (
              <span className="text-xs text-cyan-400 inline-flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                {address.slice(0, 6)}...{address.slice(-4)}
                <BlockieAvatar address={address} size={14} />
                {isConnected && connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase() && (
                  <span className="ml-0.5 opacity-70">(you)</span>
                )}
              </span>
            )}
          </div>

          <AddressInput
            value={inputValue}
            onChange={value => setInputValue(value)}
            name="Target Address"
            placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Paste or type address..."}
          />

          {/* Action Buttons Grid - 2x3 layout */}
          <div className="grid grid-cols-3 gap-2">
            <button
              className="btn btn-primary bg-gradient-to-r from-blue-600 to-purple-600 border-none hover:scale-105 transition-transform text-sm"
              onClick={() => {
                setAddress(inputValue);
                setInputValue("");
                handleParamsChange();
              }}
              disabled={!inputValue || loading}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span className="ml-1">Generate</span>
            </button>

            <button
              className="btn bg-gradient-to-r from-cyan-600 to-blue-600 border-none text-white hover:scale-105 transition-transform text-sm"
              onClick={() => {
                setAddress(connectedAddress ? connectedAddress : "");
                setInputValue("");
                handleParamsChange();
              }}
              disabled={!isConnected}
            >
              Use Connected Address
            </button>

            <button
              className="btn btn-outline border-slate-500 text-slate-300 hover:border-slate-400 hover:bg-slate-600/20 text-sm"
              onClick={handleClear}
              title="Clear all data and start fresh"
            >
              Clear
            </button>

            <div className="col-span-3 flex items-center gap-1 relative z-20">
              {/* Chain selector dropdown */}
              <select
                value={selectedChain}
                onChange={e => setSelectedChain(e.target.value as any)}
                className="min-w-[120px] min-h-[35px] text-s px-2 py-1 rounded-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 bg-slate-800 backdrop-blur-sm border border-slate-600/40 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 hover:border-slate-500/60 hover:from-slate-700/90 hover:to-slate-600/90 cursor-pointer shadow-lg"
                title="Select blockchain network"
              >
                {CHAIN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* Mint button, smaller and disabled if not allowed */}
              <MintCosmicNFT 
                graphConfig={{
                  graphData,
                  targetNode: address.toLowerCase(),
                  layoutMode,
                  particleMode,
                  isOrbiting,  // 🔧 Changed from isAutoOrbiting
                  viewState: currentViewState === null ? undefined : currentViewState,
                  // 🔧 ADD: Pass current filtering settings
                  // txDisplayLimit: 200,  // You'll need to get this from page.tsx state
                  transferDirection    // Pass the current transferDirection
                }}
                selectedChain={selectedChain}  // 🔧 Add this prop
                // disabled={
                //   !address ||
                //   !graphData.nodes.length ||
                //   !canMint ||
                //   !isConnected ||
                //   address.toLowerCase() !== connectedAddress?.toLowerCase()
                // }
                className={`flex-1 min-w-[110px] transition-all ${
                  !address ||
                  !graphData.nodes.length ||
                  !canMint ||
                  !isConnected ||
                  address.toLowerCase() !== connectedAddress?.toLowerCase()
                    ? "opacity-60 grayscale cursor-not-allowed"
                    : ""
                }`}
                title={
                  !canMint
                    ? "Minting is currently only available on Sepolia and Arbitrum networks."
                    : !address || !graphData.nodes.length
                      ? "Connect wallet and load a graph first"
                      : !isConnected
                        ? "Connect your wallet to mint"
                        : address.toLowerCase() !== connectedAddress?.toLowerCase()
                          ? "You can only mint for your own address"
                          : "Mint your cosmic graph as an NFT"
                }
              />
              <MintInfoTooltip />
            </div>
          </div>
        </div>

        {/* Right Section - Graph Controls (1/4 width) - COMPACT */}
        <div className="space-y-1.5 flex flex-col justify-start -mt-3.5">
          {/* Transactions - Horizontal */}
          <div>
            <div className="text-xs text-slate-300 font-medium mb-1">Transactions</div>
            <div className="flex gap-0.5">
              {[
                { mode: 'both', label: 'All' },
                { mode: 'from', label: 'Sent' },
                { mode: 'to', label: 'Received' },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  className={`btn btn-xs flex-1 text-xs ${
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

          {/* Layout - Horizontal */}
          <div>
            <div className="text-xs text-slate-300 font-medium mb-1">Layout</div>
            <div className="flex gap-0.5">
              {[
                { mode: 'shell', icon: Squares2X2Icon },
                { mode: 'force', icon: BoltIcon },
                { mode: 'fibonacci', icon: SwirlIcon }
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  className={`btn btn-xs flex-1 ${
                    layoutMode === mode 
                      ? 'btn-primary bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                  onClick={() => setLayoutMode(mode as any)}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Particles - Horizontal */}
          <div>
            <div className="text-xs text-slate-300 font-medium mb-1">Particles</div>
            <div className="flex gap-0.5">
              {[
                { mode: 'pulse', icon: PlayIcon },
                { mode: 'laser', icon: BoltIcon },
                { mode: 'off', icon: XMarkIcon }
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  className={`btn btn-xs flex-1 ${
                    particleMode === mode 
                      ? (mode === 'off' 
                          ? 'btn-primary bg-gradient-to-r from-gray-600 to-gray-700' 
                          : 'btn-primary bg-gradient-to-r from-purple-600 to-pink-600')
                      : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                  onClick={() => setParticleMode(mode as any)}
                >
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Orbit & Labels - Combined Row with Split Headers */}
          <div>
            <div className="flex gap-0.5 text-xs text-slate-300 font-medium mb-1">
              <div className="flex-2">Orbit</div>
              <div className="flex-1 -mx-1">Labels</div>
            </div>
            <div className="flex gap-0.5">
              <button
                className={`btn btn-xs flex-1 ${
                  isOrbiting  // 🔧 Changed from isAutoOrbiting
                    ? 'btn-primary bg-gradient-to-r from-cyan-600 to-blue-600' 
                    : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
                onClick={() => setIsOrbiting(!isOrbiting)}  // 🔧 Changed from setIsAutoOrbiting
                title={isOrbiting ? "Pause Orbit" : "Auto Orbit"}  // 🔧 Changed from isAutoOrbiting
              >
                {isOrbiting ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
              </button>
              
              <button
                onClick={handleResetView}
                className="btn btn-xs flex-1 btn-outline border-slate-600 text-slate-300 hover:border-slate-400"
                title="Reset View"
              >
                <ArrowPathIcon className="w-3 h-3" />
              </button>

              <button
                className={`btn btn-xs flex-1 ${
                  showNodeLabels 
                    ? 'btn-primary bg-gradient-to-r from-green-600 to-emerald-600' 
                    : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
                onClick={() => setShowNodeLabels(!showNodeLabels)}
                title={showNodeLabels ? "Hide Labels" : "Show Labels"}
              >
                {showNodeLabels ? <EyeIcon className="w-3 h-3" /> : <EyeSlashIcon className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}