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
  targetAddress: string;  // 🔧 ADD: Target address from contract
  mintTimestamp: bigint;  // 🔧 ADD: Mint timestamp from contract
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

  // const { data: cosmicGraphData } = useScaffoldReadContract({
  //   contractName: "CosmicGraph", 
  //   functionName: "cosmicGraphs",  // ✅ This is the correct mapping name
  //   args: [BigInt(tokenId)],
  //   watch: true,
  // });

  useEffect(() => {
    const updateAllCollectibles = async (): Promise<void> => {
      if (totalSupply === undefined || yourCollectibleContract === undefined) return;

      setAllCollectiblesLoading(true);
      const collectibleUpdate: Collectible[] = [];
      const totalTokens = parseInt(totalSupply.toString());
      
      // 🔧 FIX: Check if there are any tokens before looping
      if (totalTokens === 0) {
        console.log("📝 No tokens exist - total supply is 0");
        setAllCollectibles([]);
        setAllCollectiblesLoading(false);
        return;
      }
      
      // Loop through all existing tokens using tokenByIndex
      for (let index = 0; index < totalTokens; index++) {
        try {
          // Get the actual token ID at this index (handles gaps from burned tokens)
          const tokenId = await yourCollectibleContract.read.tokenByIndex([BigInt(index)]);
          const tokenIdNumber = parseInt(tokenId.toString());
          
          // Get owner of this token
          const owner = await yourCollectibleContract.read.ownerOf([tokenId]);

          // Get Target of token
          const cardGraphData = await yourCollectibleContract.read.cosmicGraphs([tokenId]);
          const targetAddress = cardGraphData[0] as string;
          const mintTimestamp = cardGraphData[1] as bigint;
          
          // Get token URI (which is just the IPFS hash)
          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          console.log(`🔍 Token ${tokenIdNumber} raw tokenURI (should be IPFS hash):`, tokenURI);

          // Contract returns just the hash, so use it directly
          const ipfsHash = tokenURI;
          console.log(`📝 Using IPFS hash:`, ipfsHash);

          // Get metadata with error handling
          let nftMetadata: NFTMetaData;
          try {
            nftMetadata = await getMetadataFromIPFS(ipfsHash);
            console.log(`✅ Metadata loaded for token ${tokenIdNumber}:`, nftMetadata);
            
            // Debug and process animation_url
            console.log(`🎬 Raw animation_url:`, nftMetadata.animation_url);
            
            // Process IPFS URLs for image and animation_url
            if (nftMetadata.image && nftMetadata.image.startsWith("ipfs://")) {
              nftMetadata.image = nftMetadata.image.replace("ipfs://", "https://ipfs.io/ipfs/");
              console.log(`🖼️ Processed image URL:`, nftMetadata.image);
            }

            if (nftMetadata.animation_url && nftMetadata.animation_url.startsWith("ipfs://")) {
              nftMetadata.animation_url = nftMetadata.animation_url.replace("ipfs://", "https://ipfs.io/ipfs/");
              console.log(`🎬 Processed animation_url:`, nftMetadata.animation_url);
            }
            
            // Final check
            if (nftMetadata.animation_url) {
              console.log(`✅ Final animation URL:`, nftMetadata.animation_url);
            } else {
              console.log(`❌ No animation_url found in metadata for token ${tokenIdNumber}`);
            }

          } catch (metadataError) {
            console.error(`❌ Error fetching metadata for token ${tokenIdNumber}:`, metadataError);

            // Create fallback metadata
            nftMetadata = {
              name: `NFT #${tokenIdNumber}`,
              description: "Metadata loading failed",
              image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvcnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5GVDwvdGV4dD48L3N2Zz4=",
              attributes: []
            };
          }

          const collectible: Collectible = {
            id: tokenIdNumber,
            uri: tokenURI,
            owner: owner as string,
            targetAddress,
            mintTimestamp,
            ...nftMetadata, // This should include the processed animation_url
          };

          // 🔧 ADD: Debug the final collectible object
          console.log(`🔍 Final collectible for token ${tokenIdNumber}:`, {
            id: collectible.id,
            name: collectible.name,
            image: collectible.image,
            animation_url: collectible.animation_url,
            targetAddress: collectible.targetAddress
          });

          collectibleUpdate.push(collectible);

        } catch (e) {
          console.error(`Error fetching NFT at index ${index}:`, e);
          // Skip this token since we can't get its ID
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