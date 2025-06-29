"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// Import cosmic NFT functions
import { getMetadataFromIPFS } from "~~/utils/cosmicNFT/ipfs-fetch";

// Define the cosmic NFT metadata interface
export interface NFTMetaData {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
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

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export const AllHoldings = () => {
  const [allCollectibles, setAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "CosmicGraph",
  });

  // Get total supply instead of balance for a specific address
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "CosmicGraph",
    functionName: "totalSupply",
    watch: true,
  });

  useEffect(() => {
    const updateAllCollectibles = async (): Promise<void> => {
      if (totalSupply === undefined || yourCollectibleContract === undefined) return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];
      const totalTokens = parseInt(totalSupply.toString());
      
      // Loop through all token IDs from 1 to totalSupply
      for (let tokenId = 1; tokenId <= totalTokens; tokenId++) {
        try {
          // Get owner of this token
          const owner = await yourCollectibleContract.read.ownerOf([BigInt(tokenId)]);
          
          // Get token URI
          const tokenURI = await yourCollectibleContract.read.tokenURI([BigInt(tokenId)]);
          console.log(`🔍 Token ${tokenId} URI:`, tokenURI);
          
          const ipfsHash = tokenURI.replace("https://gateway.pinata.cloud/ipfs/", "");

          // Get metadata with error handling
          let nftMetadata: NFTMetaData;
          try {
            nftMetadata = await getMetadataFromIPFS(ipfsHash);
            console.log(`✅ Metadata loaded for token ${tokenId}:`, nftMetadata);
          } catch (metadataError) {
            console.error(`❌ Error fetching metadata for token ${tokenId}:`, metadataError);

            // Create fallback metadata
            nftMetadata = {
              name: `NFT #${tokenId}`,
              description: "Metadata loading failed",
              image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5GVDwvdGV4dD48L3N2Zz4=",
              attributes: []
            };
          }

          const collectible: Collectible = {
            id: tokenId,
            uri: tokenURI,
            owner: owner as string,
            ...nftMetadata,
          };

          collectibleUpdate.push(collectible);

        } catch (e) {
          console.error(`Error fetching NFT ${tokenId}:`, e);
          
          // Add a placeholder so user knows something exists but failed to load
          collectibleUpdate.push({
            id: tokenId,
            uri: "error",
            owner: "unknown",
            name: `NFT #${tokenId} (Loading Error)`,
            description: "There was an error loading this NFT",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==",
          });
        }
      }
      
      // Sort by token ID (ascending)
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateAllCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSupply]);

  if (allCollectiblesLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
        <span className="ml-4">Loading all cosmic NFTs...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-8 text-purple-300">
        🌌 All Graph NFTs ({allCollectibles.length})
      </h2>
      
      {allCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-center">
            <div className="text-2xl text-primary-content mb-4">No NFTs found</div>
            <p className="text-slate-400">
              No NFTs have been minted yet. Be the first to create one!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {allCollectibles.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </div>
  );
};