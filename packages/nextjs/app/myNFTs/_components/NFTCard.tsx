import { useState } from "react";
import { Collectible } from "./MyHoldings";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  // Helper function to get cosmic attribute values
  const getAttributeValue = (traitType: string) => {
    return nft.attributes?.find(attr => attr.trait_type === traitType)?.value || "Unknown";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-sm max-w-sm">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-purple-400/20 to-transparent rounded-full blur-xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-radial from-blue-400/20 to-transparent rounded-full blur-lg" />
      
      <div className="relative z-10 p-4 space-y-4">
        {/* Header with ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50" />
            <span className="text-white/90 text-lg font-bold">Cosmic Graph #{nft.id}</span>
          </div>
        </div>

        {/* Large Cosmic Graph Image */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-sm" />
          <div className="relative bg-black/40 rounded-xl p-2 border border-purple-400/30 overflow-hidden">
            <img 
              src={nft.image} 
              alt="Cosmic Graph Visualization" 
              className="w-full h-64 object-cover rounded-lg"
            />
            {/* Layout type badge */}
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-purple-400/40">
              <span className="text-white/90 text-sm font-medium">
                {getAttributeValue("Type")} Layout
              </span>
            </div>
          </div>
        </div>

        {/* Title/Description */}
        <div className="text-center">
          <h3 className="text-white text-xl font-bold mb-1">{nft.name || "Cosmic Graph"}</h3>
          <p className="text-white/70 text-sm">{nft.description || "A cosmic visualization of Ethereum transactions"}</p>
        </div>

        {/* Key Stats - Compact horizontal layout */}
        <div className="flex justify-between items-center bg-black/30 rounded-lg p-3 border border-purple-400/20">
          <div className="text-center">
            <div className="text-purple-300 text-xs">Transactions</div>
            <div className="text-white font-bold text-lg">{getAttributeValue("Transaction Count")}</div>
          </div>
          <div className="w-px h-8 bg-purple-400/30"></div>
          <div className="text-center">
            <div className="text-blue-300 text-xs">Connections</div>
            <div className="text-white font-bold text-lg">{getAttributeValue("Connected Addresses")}</div>
          </div>
          <div className="w-px h-8 bg-purple-400/30"></div>
          <div className="text-center">
            <div className="text-indigo-300 text-xs">Generated</div>
            <div className="text-white font-bold text-sm">{getAttributeValue("Generation Date")}</div>
          </div>
        </div>

        {/* Target Address */}
        <div className="space-y-2">
          <span className="text-purple-300 text-sm font-medium">Target Address</span>
          <div className="bg-black/30 rounded-lg p-3 border border-purple-400/20">
            {getAttributeValue("Target Address") !== "Unknown" ? (
              <Address address={getAttributeValue("Target Address")?.toString() || ''} />
            ) : (
              <span className="text-white/50 text-sm">No target address available</span>
            )}
          </div>
        </div>

        {/* Owner Info */}
        <div className="space-y-2">
          <span className="text-purple-300 text-sm font-medium">Owner</span>
          <div className="bg-black/30 rounded-lg p-3 border border-purple-400/20">
            <Address address={nft.owner} />
          </div>
        </div>

        {/* Transfer Section - Always visible but compact */}
        <div className="space-y-3">
          <span className="text-purple-300 text-sm font-medium">Transfer To:</span>
          <AddressInput
            value={transferToAddress}
            placeholder="receiver address"
            onChange={newValue => setTransferToAddress(newValue)}
          />
          
          <button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>

      {/* Subtle border glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-blue-500/20 pointer-events-none" />
    </div>
  );
};
