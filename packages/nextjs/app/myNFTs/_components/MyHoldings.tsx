"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { NFTCard } from "~~/app/allNFTs/_components/NFTCard";

// Import cosmic NFT functions
import { getMetadataFromIPFS } from "~~/utils/cosmicNFT/ipfs-fetch";

// Define the cosmic NFT metadata interface
export interface NFTMetaData {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  targetAddress?: string; // Add this field from your metadata
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  cosmic_data?: {
    target_address: string;
    balance_wei: string;
    connected_addresses: string[];
    generation_timestamp: number;
  };
}

// 🔧 UPDATED: Include targetAddress and mintTimestamp from contract
export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
  targetAddress: string;  // 🔧 ADD: Target address from contract
  mintTimestamp: bigint;  // 🔧 ADD: Mint timestamp from contract
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "CosmicGraph",
  });

  const { data: myTotalBalance } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "balanceOf",
    args: [connectedAddress],
    watch: true,
  });

  useEffect(() => {
    const updateMyCollectibles = async (): Promise<void> => {
      if (myTotalBalance === undefined || yourCollectibleContract === undefined || connectedAddress === undefined)
        return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];
      const totalBalance = parseInt(myTotalBalance.toString());
      
      console.log(`🔍 Fetching ${totalBalance} NFTs for ${connectedAddress}...`);
      
      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          // Get the actual token ID at this index for the connected user
          const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
            connectedAddress,
            BigInt(tokenIndex),
          ]);
          const tokenIdNumber = parseInt(tokenId.toString());

          console.log(`🔍 Processing token ${tokenIdNumber} (index ${tokenIndex})`);

          // 🔧 NEW: Get cosmic graph data from contract
          const cosmicGraphData = await yourCollectibleContract.read.cosmicGraphs([tokenId]);
          const targetAddress = cosmicGraphData[0] as string;
          const mintTimestamp = cosmicGraphData[1] as bigint;

          console.log(`🎯 Token ${tokenIdNumber} Target:`, targetAddress);
          console.log(`⏰ Token ${tokenIdNumber} Minted:`, new Date(Number(mintTimestamp) * 1000));

          // Get token URI
          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          console.log(`🔍 Token ${tokenIdNumber} URI:`, tokenURI);
          
          // Parse IPFS hash
          const ipfsHash = tokenURI.replace("https://gateway.pinata.cloud/ipfs/", "");

          // Get metadata with error handling
          let nftMetadata: NFTMetaData;
          try {
            nftMetadata = await getMetadataFromIPFS(ipfsHash);
            console.log(`✅ Metadata loaded for token ${tokenIdNumber}:`, nftMetadata.name);
          } catch (metadataError) {
            console.error(`❌ Error fetching metadata for token ${tokenIdNumber}:`, metadataError);

            // Create fallback metadata
            nftMetadata = {
              name: `Cosmic Graph #${tokenIdNumber}`,
              description: "Interactive Ethereum transaction visualization (metadata loading failed)",
              image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvc21pYyBHcmFwaDwvdGV4dD48L3N2Zz4=",
              attributes: []
            };
          }

          // 🔧 UPDATED: Include contract data in collectible
          const collectible: Collectible = {
            id: tokenIdNumber,
            uri: tokenURI,
            owner: connectedAddress,
            targetAddress: targetAddress,  // 🔧 ADD: Target address from contract
            mintTimestamp: mintTimestamp,  // 🔧 ADD: Mint timestamp from contract
            ...nftMetadata,
          };

          collectibleUpdate.push(collectible);

        } catch (e) {
          console.error(`❌ Error fetching NFT at index ${tokenIndex}:`, e);
          
          // Add a placeholder so user knows something exists but failed to load
          collectibleUpdate.push({
            id: tokenIndex, // Use index as fallback ID
            uri: "error",
            owner: connectedAddress,
            targetAddress: "0x0000000000000000000000000000000000000000", // Fallback target
            mintTimestamp: BigInt(0), // Fallback timestamp
            name: `NFT #${tokenIndex} (Loading Error)`,
            description: "There was an error loading this NFT",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==",
          });
        }
      }
      
      // Sort by token ID
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);

      console.log(`✅ Loaded ${collectibleUpdate.length} NFTs for ${connectedAddress}`);
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, myTotalBalance]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-slate-400 mt-2">Loading your cosmic graphs...</p>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* 🔧 UPDATED: Better header with stats */}
      <div className="text-center mb-8 -my-8">
        <p className="text-slate-400">
          {myAllCollectibles.length > 0 
            ? `You own ${myAllCollectibles.length} cosmic graph${myAllCollectibles.length !== 1 ? 's' : ''}`
            : "No cosmic graphs found in your wallet"
          }
        </p>
      </div>

      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-center bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-indigo-900/95 border border-purple-400/20 rounded-xl p-8">
            <div className="text-2xl text-white mb-4">No Cosmic Graphs Yet</div>
            <p className="text-slate-400 mb-6">
              Create your first cosmic graph NFT to visualize your Ethereum transaction history!
            </p>
            <div className="text-sm text-purple-300">
              💡 Tip: Use the mint section above to generate your personalized cosmic graph
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 🔧 UPDATED: Summary stats without interactive count */}
            

          {/* NFT Grid */}
          <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
            {myAllCollectibles.map(item => (
              <NFTCard nft={item} key={item.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
