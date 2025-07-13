import { AddressInput, BlockieAvatar } from "~~/components/scaffold-eth";
import {
  MagnifyingGlassIcon, 
  SparklesIcon, 
  Squares2X2Icon,
  BoltIcon,
  ArrowPathRoundedSquareIcon as SwirlIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import { MintCosmicNFT } from "./MintCosmicNFT";
import { MintInfoTooltip } from "./MintInfoTooltip";
import { CHAIN_CONFIGS, isContractDeployedOnChain, type SupportedChain, getChainFromId, getChainId } from "~~/utils/cosmicNFT/chainHelpers";
import { useNetworkSwitch } from "~~/hooks/cosmicNFT/useNetworkSwitch";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

// 🔧 UPDATE: Show all chains, not just deployed ones
const CHAIN_OPTIONS = Object.entries(CHAIN_CONFIGS).map(([value, config]) => ({
  value: value as SupportedChain,
  label: config.name,
  contractDeployed: config.contractDeployed, // Track contract status
}));

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
  isOrbiting: boolean;
  currentViewState: any;
  transferDirection: 'from' | 'to' | 'both';
  setTransferDirection: (v: 'from' | 'to' | 'both') => void;
  setLayoutMode: (v: any) => void;
  setParticleMode: (v: any) => void;
  setIsOrbiting: (v: boolean) => void;
  handleResetView: () => void;
  showNodeLabels: boolean;
  setShowNodeLabels: (v: boolean) => void;
  selectedChain: SupportedChain;
  setSelectedChain: (v: SupportedChain) => void;
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
  isOrbiting,
  currentViewState,
  transferDirection,
  setTransferDirection,
  setLayoutMode,
  setParticleMode,
  setIsOrbiting,
  handleResetView,
  showNodeLabels,
  setShowNodeLabels,
  selectedChain,
  setSelectedChain,
}: MenuActionsProps) {
  const { switchToChain, currentChainId } = useNetworkSwitch();
  const { chain } = useAccount();
  
  // 🔧 NEW: Add network switching state
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  // 🔧 NEW: Add debounced wrong network state
  const [showWrongNetworkWarning, setShowWrongNetworkWarning] = useState(false);
  
  // 🔧 UPDATE: Use helper function and sync with wallet
  const canMint = isContractDeployedOnChain(selectedChain);
  
  // 🔧 UPDATE: Handle network change with loading state
  const handleNetworkChange = async (newChain: SupportedChain) => {
    // Update local state immediately for UI responsiveness
    setSelectedChain(newChain);
    
    // Hide warning immediately when switching
    setShowWrongNetworkWarning(false);
    
    // Switch wallet network if connected
    if (isConnected) {
      setIsSwitchingNetwork(true);
      try {
        await switchToChain(newChain);
      } catch (error) {
        console.error("Network switch failed:", error);
      } finally {
        // Add a small delay to ensure wallet state is updated
        setTimeout(() => {
          setIsSwitchingNetwork(false);
        }, 500);
      }
    }
    
    // Refresh data for new chain
    handleParamsChange();
  };

  // 🔧 NEW: Debounced wrong network detection
  const isWrongNetwork = chain?.id && chain.id !== getChainId(selectedChain);
  
  useEffect(() => {
    if (isSwitchingNetwork) {
      // Hide warning during switch
      setShowWrongNetworkWarning(false);
      return;
    }

    if (isWrongNetwork && isConnected) {
      // Wait 2 seconds before showing warning
      const timer = setTimeout(() => {
        setShowWrongNetworkWarning(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      // Hide warning immediately if networks match
      setShowWrongNetworkWarning(false);
    }
  }, [isWrongNetwork, isConnected, isSwitchingNetwork]);

  // 🔧 NEW: Get current chain display name
  const getCurrentChainName = () => {
    if (chain?.id) {
      const currentChain = getChainFromId(chain.id);
      if (currentChain) {
        return CHAIN_CONFIGS[currentChain].name;
      }
    }
    return "Unknown Network";
  };

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

            <div className="col-span-3 space-y-2">
              {/* 🔧 UPDATE: Only show wrong network warning after delay */}
              {showWrongNetworkWarning && (
                <div className="flex items-center gap-2 text-xs bg-orange-900/30 border border-orange-500/40 rounded-lg px-3 py-2">
                  <span className="text-orange-400">⚠️ Wrong Network:</span>
                  <span className="text-orange-300">{getCurrentChainName()}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-green-400">{CHAIN_CONFIGS[selectedChain].name}</span>
                </div>
              )}

              <div className="flex items-center gap-1 relative z-20">
                {/* Chain selector and mint button */}
                <select
                  value={selectedChain}
                  onChange={e => handleNetworkChange(e.target.value as SupportedChain)}
                  disabled={isSwitchingNetwork}
                  className={`min-w-[120px] min-h-[35px] text-s px-2 py-1 rounded-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 hover:border-slate-500/60 hover:from-slate-700/90 hover:to-slate-600/90 cursor-pointer shadow-lg ${
                    isSwitchingNetwork
                      ? 'opacity-60 cursor-not-allowed'
                      : showWrongNetworkWarning 
                        ? 'border-orange-500/60 ring-1 ring-orange-500/20' 
                        : 'border-slate-600/40'
                  }`}
                  title={isSwitchingNetwork ? "Switching network..." : "Select blockchain network - this will switch your wallet too"}
                >
                  {CHAIN_OPTIONS.map(opt => (
                    <option 
                      key={opt.value} 
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                
                <MintCosmicNFT 
                  graphConfig={{
                    graphData,
                    targetNode: address.toLowerCase(),
                    layoutMode,
                    particleMode,
                    isOrbiting,
                    viewState: currentViewState === null ? undefined : currentViewState,
                    transferDirection
                  }}
                  selectedChain={selectedChain}
                  disabled={
                    !address ||
                    !graphData.nodes.length ||
                    !canMint ||
                    !isConnected ||
                    address.toLowerCase() !== connectedAddress?.toLowerCase() ||
                    showWrongNetworkWarning
                  }
                  className={`flex-1 min-w-[110px] transition-all ${
                    !address ||
                    !graphData.nodes.length ||
                    !canMint ||
                    !isConnected ||
                    address.toLowerCase() !== connectedAddress?.toLowerCase() ||
                    showWrongNetworkWarning
                      ? "opacity-60 grayscale cursor-not-allowed"
                      : ""
                  }`}
                  title={
                    showWrongNetworkWarning
                      ? "Please switch to the correct network first"
                      : !canMint
                        ? `Graph viewing available on ${CHAIN_CONFIGS[selectedChain].name}. Minting only available on Sepolia and Arbitrum.`
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