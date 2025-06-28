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
  XMarkIcon
} from "@heroicons/react/24/outline";
import { MintCosmicNFT } from "./MintCosmicNFT";
import { MintInfoTooltip } from "./MintInfoTooltip";

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
  isAutoOrbiting: boolean;
  currentViewState: any;
  // Add new props for graph controls
  transferDirection: 'from' | 'to' | 'both';
  setTransferDirection: (v: 'from' | 'to' | 'both') => void;
  setLayoutMode: (v: any) => void;
  setParticleMode: (v: any) => void;
  setIsAutoOrbiting: (v: boolean) => void;
  handleResetView: () => void;
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
  isAutoOrbiting,
  currentViewState,
  transferDirection,
  setTransferDirection,
  setLayoutMode,
  setParticleMode,
  setIsAutoOrbiting,
  handleResetView,
}: MenuActionsProps) {
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
              <span className="ml-1">Explore</span>
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
              Use Wallet
            </button>

            <button
              className="btn btn-outline border-slate-500 text-slate-300 hover:border-slate-400 hover:bg-slate-600/20 text-sm"
              onClick={handleClear}
              title="Clear all data and start fresh"
            >
              Clear
            </button>

            <div className="col-span-3 flex items-center gap-1">
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
                className="flex-1"
              />
              <MintInfoTooltip />
            </div>
          </div>
        </div>

        {/* Right Section - Graph Controls (1/4 width) - COMPACT */}
        <div className="space-y-2">
          {/* <div className="text-blue-100 font-semibold text-sm flex items-center gap-2 mb-3">
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Graph Controls
          </div> */}
          
          {/* Transactions - Horizontal */}
          <div>
            <div className="text-xs text-slate-300 font-medium mb-1">Transactions</div>
            <div className="flex gap-1">
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
            <div className="flex gap-1">
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
            <div className="flex gap-1">
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

          {/* Animation Controls */}
          <div>
            <div className="text-xs text-slate-300 font-medium mb-1">Orbit</div>
            <div className="flex gap-1">
              <button
                className={`btn btn-xs flex-1 ${
                  isAutoOrbiting 
                    ? 'btn-primary bg-gradient-to-r from-cyan-600 to-blue-600' 
                    : 'btn-outline border-slate-600 text-slate-300 hover:border-slate-400'
                }`}
                onClick={() => setIsAutoOrbiting(!isAutoOrbiting)}
                title={isAutoOrbiting ? "Pause Orbit" : "Auto Orbit"}
              >
                {isAutoOrbiting ? <PauseIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
              </button>
              
              <button
                onClick={handleResetView}
                className="btn btn-xs flex-1 btn-outline border-slate-600 text-slate-300 hover:border-slate-400"
                title="Reset View"
              >
                <ArrowPathIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}