import { useState } from "react";
import { Collectible } from "./AllHoldings"; // Make sure this import exists
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);

  const { address: connectedAddress } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("CosmicGraph");

  // Helper function to get attribute values
  const getAttributeValue = (traitType: string) => {
    return nft.attributes?.find(attr => attr.trait_type === traitType)?.value || "Unknown";
  };

  // 🔧 ADD: Helper functions for explorer links
  const getExplorerUrl = (address: string, network: string) => {
    const baseUrls = {
      'mainnet': 'https://etherscan.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'base': 'https://basescan.org',
      'arbitrum': 'https://arbiscan.io',
    };
    
    const baseUrl = baseUrls[network as keyof typeof baseUrls] || baseUrls.mainnet;
    return `${baseUrl}/address/${address}`;
  };

  const getExplorerName = (network: string) => {
    const names = {
      'mainnet': 'Etherscan',
      'sepolia': 'Sepolia Etherscan',
      'base': 'BaseScan',
      'arbitrum': 'Arbiscan',
    };
    
    return names[network as keyof typeof names] || 'Etherscan';
  };

  // Check if connected user owns this NFT
  const isOwner = connectedAddress?.toLowerCase() === nft.owner?.toLowerCase();

  // Check if it's interactive
  const isInteractive = nft.animation_url && nft.animation_url.length > 0;
  const hasAnimationUrl = nft.animation_url && nft.animation_url.length > 0;

  // Convert bigint to readable date
  const formatMintDate = (timestamp: bigint): string => {
    try {
      // Convert bigint to number (timestamp is usually in seconds)
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleDateString();
    } catch (error) {
      return "Unknown";
    }
  };

  // 🔧 ADD BACK: Handle burn function
  const handleBurn = async () => {
    try {
      await writeContractAsync({
        functionName: "burn",
        args: [BigInt(nft.id)],
      });
      
      // Reset burn confirmation state
      setShowBurnConfirm(false);
      
      // Optionally show success message or refresh NFT list
      console.log(`🔥 Successfully burned NFT #${nft.id}`);
      
    } catch (error) {
      console.error("Error burning NFT:", error);
      // Optionally show error message to user
      setShowBurnConfirm(false);
    }
  };

  // 🔧 ADD BACK: Handle transfer function  
  const handleTransfer = async () => {
    if (!transferToAddress) return;
    
    try {
      await writeContractAsync({
        functionName: "transferFrom",
        args: [nft.owner, transferToAddress, BigInt(nft.id)],
      });
      
      // Reset transfer state
      setTransferToAddress("");
      console.log(`✅ Successfully transferred NFT #${nft.id} to ${transferToAddress}`);
      
    } catch (error) {
      console.error("Error transferring NFT:", error);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-indigo-900/95 border border-purple-400/20 shadow-xl backdrop-blur-sm w-full max-w-md">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative z-10">
        {/* Large Interactive Graph Area */}
        <div className="relative">
          {isInteractive && hasAnimationUrl ? (
            <div className="relative bg-black/20">
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
              {/* 🔧 UPDATED: Shape badge - top left */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 border border-purple-400/30">
                <span className="text-white/90 text-xs font-medium">
                  {getAttributeValue("Shape")}
                </span>
              </div>
              {/* Open Full Screen button - top right */}
              <a 
                href={nft.animation_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 border border-purple-400/30 hover:bg-black/80 transition-all duration-200 group"
                title="Open Full Screen"
              >
                <span className="text-white/90 text-xs font-medium flex items-center space-x-1">
                  <span>↗</span>
                  <span className="hidden group-hover:inline">Open</span>
                </span>
              </a>
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
                  {getAttributeValue("Shape")} Shape
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

          {/* 🔧 UPDATED: Stats Grid with new attributes */}
          <div className="grid grid-cols-4 gap-2 bg-black/20 rounded-lg p-3 border border-purple-400/10">
            <div className="text-center">
              <div className="text-purple-300 text-xs">Tier</div>
              <div className="text-white font-bold text-lg">{getAttributeValue("Tier")}</div>
            </div>
            <div className="text-center border-l border-purple-400/20">
              <div className="text-blue-300 text-xs">Nodes</div>
              <div className="text-white font-bold text-sm">{getAttributeValue("Nodes")}</div>
            </div>
            <div className="text-center border-l border-purple-400/20">
              <div className="text-green-300 text-xs">Shape</div>
              <div className="text-white font-bold text-xs">{getAttributeValue("Shape")}</div>
            </div>
            <div className="text-center border-l border-purple-400/20">
              <div className="text-indigo-300 text-xs">Type</div>
              <div className="text-white font-bold text-xs">{getAttributeValue("Type")}</div>
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
            <div className="space-y-4 border-t border-purple-400/10 pt-4">
              {/* 🔧 NEW: Cosmic Attributes Card */}

              {/* 🔧 ENHANCED: Target Address with Explorer Link */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-400/20">
                <div className="text-indigo-300 text-sm font-medium mb-3 flex items-center space-x-2">
                  
                  <span>Target Address</span>
                </div>
                {nft.targetAddress ? (
                  <div className="space-y-2">
                    <Address address={nft.targetAddress} />
                    <a 
                      href={getExplorerUrl(nft.targetAddress, String(getAttributeValue("Network")))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs underline transition-colors"
                    >
                      <span>View on {getExplorerName(String(getAttributeValue("Network")))}</span>
                      <span>↗</span>
                    </a>
                  </div>
                ) : (
                  <span className="text-white/50 text-sm">No target address available</span>
                )}
              </div>

              {/* 🔧 ENHANCED: Current Owner with Explorer Link */}
              <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-lg p-4 border border-green-400/20">
                <div className="text-green-300 text-sm font-medium mb-3 flex items-center space-x-2">
                  
                  <span>Current Owner</span>
                </div>
                <div className="space-y-2">
                  <Address address={nft.owner} />
                  <a 
                    href={getExplorerUrl(nft.owner, String(getAttributeValue("Network")))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs underline transition-colors"
                  >
                    <span>View on {getExplorerName(String(getAttributeValue("Network")))}</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              {/* 🔧 ENHANCED: Network & Mint Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-400/20">
                  <div className="text-yellow-300 text-sm font-medium mb-2 flex items-center space-x-2">
                  
                    <span>Network</span>
                  </div>
                  <div className="text-white font-bold capitalize">{getAttributeValue("Network")}</div>
                </div>
                
                {nft.mintTimestamp && (
                  <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg p-4 border border-pink-400/20">
                    <div className="text-pink-300 text-sm font-medium mb-2 flex items-center space-x-2">
                      
                      <span>Minted</span>
                    </div>
                    <div className="text-white font-bold text-sm">
                      {new Date(Number(nft.mintTimestamp) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Transfer Section - only show if user is owner */}
              {isOwner && (
                <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-400/20">
                  <div className="text-purple-300 text-sm font-medium mb-3 flex items-center space-x-2">
                    <span>📤</span>
                    <span>Transfer NFT</span>
                  </div>
                  <div className="space-y-3">
                    <AddressInput
                      value={transferToAddress}
                      placeholder="Enter receiver address"
                      onChange={newValue => setTransferToAddress(newValue)}
                    />
                    
                    <button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
                      disabled={!transferToAddress}
                      onClick={handleTransfer}
                    >
                      <span>📤</span>
                      <span>Send NFT</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Burn Section - only show if user is owner */}
              {isOwner && (
                <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg p-4 border border-red-400/20">
                
                  
                  {!showBurnConfirm ? (
                    <button
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/25 text-sm flex items-center justify-center space-x-2"
                      onClick={() => setShowBurnConfirm(true)}
                    >
                      <span>🔥</span>
                      <span>Burn NFT</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-500/20 rounded-lg p-3 border border-red-400/30">
                        <p className="text-red-300 text-xs text-center flex items-center justify-center space-x-2">
                          <span>⚠️</span>
                          <span>This action cannot be undone! The NFT will be permanently destroyed.</span>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm flex items-center justify-center space-x-1"
                          onClick={handleBurn}
                        >
                          <span>🔥</span>
                          <span>Yes, Burn It</span>
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
