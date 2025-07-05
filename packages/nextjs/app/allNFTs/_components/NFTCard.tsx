import { useState } from "react";
import { Collectible } from "../../myNFTs/_components/MyHoldings";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);

  const { address: connectedAddress } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("CosmicGraph");

  // Helper function to get cosmic attribute values
  const getAttributeValue = (traitType: string) => {
    return nft.attributes?.find(attr => attr.trait_type === traitType)?.value || "Unknown";
  };

  // Check if connected user owns this NFT
  const isOwner = connectedAddress?.toLowerCase() === nft.owner?.toLowerCase();

  // Check if it's an interactive HTML NFT - using "Format" attribute
  const isInteractive = getAttributeValue("Format") === "Interactive";
  const hasAnimationUrl = nft.animation_url && nft.animation_url.length > 0;

  const handleBurn = async () => {
    try {
      await writeContractAsync({
        functionName: "burn",
        args: [BigInt(nft.id.toString())],
      });
      setShowBurnConfirm(false);
    } catch (err) {
      console.error("Error burning NFT:", err);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-indigo-900/95 border border-purple-400/20 shadow-xl backdrop-blur-sm w-full max-w-md">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative z-10">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b border-purple-400/10">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse" />
            <span className="text-white font-semibold text-sm">Cosmic Graph #{nft.id}</span>
            {isInteractive && (
              <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-400/30">
                Interactive
              </span>
            )}
          </div>
          {/* Small external link button */}
          {isInteractive && hasAnimationUrl && (
            <a
              href={nft.animation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-white text-xs bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded transition-colors border border-purple-400/20"
            >
              ↗ Open
            </a>
          )}
        </div>

        {/* Large Interactive Graph Area */}
        <div className="relative">
          {isInteractive && hasAnimationUrl ? (
            <div className="relative bg-black/20">
              {/* Full-size interactive iframe */}
              <iframe
                src={nft.animation_url}
                className="w-full h-80 border-0"
                title="Interactive Cosmic Graph"
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                loading="lazy"
                style={{ 
                  background: 'transparent',
                }}
              />
              {/* Layout badge overlay - using "Shape" attribute */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 border border-purple-400/30">
                <span className="text-white/90 text-xs font-medium">
                  {getAttributeValue("Shape")} Layout
                </span>
              </div>
            </div>
          ) : (
            <div className="relative bg-black/20">
              <img 
                src={nft.image} 
                alt="Cosmic Graph Visualization" 
                className="w-full h-80 object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 border border-purple-400/30">
                <span className="text-white/90 text-xs font-medium">
                  {getAttributeValue("Shape")} Layout
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Compact Info Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="text-center">
            <h3 className="text-white text-lg font-bold">{nft.name || "Cosmic Graph"}</h3>
            <p className="text-white/60 text-sm mt-1">{nft.description || "Interactive Ethereum visualization"}</p>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-3 gap-2 bg-black/20 rounded-lg p-3 border border-purple-400/10">
            <div className="text-center">
              <div className="text-purple-300 text-xs">Type</div>
              <div className="text-white font-bold text-sm">{getAttributeValue("Type")}</div>
            </div>
            <div className="text-center border-l border-r border-purple-400/20">
              <div className="text-blue-300 text-xs">Shape</div>
              <div className="text-white font-bold text-sm">{getAttributeValue("Shape")}</div>
            </div>
            <div className="text-center">
              <div className="text-indigo-300 text-xs">Format</div>
              <div className="text-white font-bold text-xs">{getAttributeValue("Format")}</div>
            </div>
          </div>

          {/* Collapsible Details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-purple-300 hover:text-white text-sm font-medium py-2 transition-colors flex items-center justify-center space-x-1"
          >
            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isExpanded && (
            <div className="space-y-3 border-t border-purple-400/10 pt-3">
              {/* Interactive Features */}
              {isInteractive && (
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-400/20">
                  <div className="text-purple-300 text-sm font-medium mb-1">Constellation:</div>
                  <div className="text-white/80 text-xs">{getAttributeValue("Constellation")}</div>
                </div>
              )}

              {/* Target Address - using targetAddress from metadata root */}
              <div className="space-y-2">
                <span className="text-purple-300 text-sm font-medium">Target Address</span>
                <div className="bg-black/20 rounded-lg p-2 border border-purple-400/10">
                  {nft.targetAddress ? (
                    <Address address={nft.targetAddress} />
                  ) : (
                    <span className="text-white/50 text-sm">No target address available</span>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-2">
                <span className="text-purple-300 text-sm font-medium">Owner</span>
                <div className="bg-black/20 rounded-lg p-2 border border-purple-400/10">
                  <Address address={nft.owner} />
                </div>
              </div>

              {/* External URL */}
              {nft.external_url && (
                <div className="space-y-2">
                  <span className="text-purple-300 text-sm font-medium">External Link</span>
                  <div className="bg-black/20 rounded-lg p-2 border border-purple-400/10">
                    <a 
                      href={nft.external_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm underline"
                    >
                      {nft.external_url}
                    </a>
                  </div>
                </div>
              )}

              {/* Transfer Section - only show if user is owner */}
              {isOwner && (
                <div className="space-y-2">
                  <span className="text-purple-300 text-sm font-medium">Transfer To:</span>
                  <AddressInput
                    value={transferToAddress}
                    placeholder="receiver address"
                    onChange={newValue => setTransferToAddress(newValue)}
                  />
                  
                  <button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    disabled={!transferToAddress}
                    onClick={() => {
                      try {
                        writeContractAsync({
                          functionName: "transferFrom",
                          args: [nft.owner, transferToAddress, BigInt(nft.id.toString())],
                        });
                      } catch (err) {
                        console.error("Error calling transferFrom function");
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              )}

              {/* Burn Section - only show if user is owner */}
              {isOwner && (
                <div className="space-y-2 border-t border-red-400/20 pt-3">
                  <span className="text-red-300 text-sm font-medium">Danger Zone</span>
                  
                  {!showBurnConfirm ? (
                    <button
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25 text-sm"
                      onClick={() => setShowBurnConfirm(true)}
                    >
                      🔥 Burn NFT
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-300 text-xs text-center">
                        ⚠️ This action cannot be undone! The NFT will be permanently destroyed.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                          onClick={handleBurn}
                        >
                          Yes, Burn It
                        </button>
                        <button
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                          onClick={() => setShowBurnConfirm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
