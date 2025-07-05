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

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "CosmicGraph", // Replace with your contract name
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
      
      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          const tokenId = await yourCollectibleContract.read.tokenOfOwnerByIndex([
            connectedAddress,
            BigInt(tokenIndex),
          ]);

          const tokenIdNumber = parseInt(tokenId.toString());

          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          console.log("🔍 Token URI:", tokenURI);
          
          // const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          // const ipfsHash = tokenURI.replace("https://aqua-nearby-barracuda-607.mypinata.cloud/ipfs/", "");
          const ipfsHash = tokenURI.replace("https://gateway.pinata.cloud/ipfs/", "");
          // console.log("🔍 IPFS Hash:", ipfsHash);

          // Get metadata with error handling
          let nftMetadata: NFTMetaData;
          try {
            nftMetadata = await getMetadataFromIPFS(ipfsHash);
            // console.log("✅ Metadata loaded:", nftMetadata);
          } catch (metadataError) {
            console.error(`❌ Error fetching metadata for token ${tokenIdNumber}:`, metadataError);

            // Create fallback metadata
            nftMetadata = {
              name: `NFT #${tokenIdNumber}`,
              description: "Metadata loading failed",
              image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5GVDwvdGV4dD48L3N2Zz4=",
              attributes: []
            };
          }

          const collectible: Collectible = {
            id: tokenIdNumber,
            uri: tokenURI,
            owner: connectedAddress,
            ...nftMetadata,
          };

          collectibleUpdate.push(collectible);

        } catch (e) {
          console.error("Error fetching NFT:", e);
          
          // Add a placeholder so user knows something exists but failed to load
          collectibleUpdate.push({
            id: tokenIndex, // Use index as fallback ID
            uri: "error",
            owner: connectedAddress,
            name: "NFT (Loading Error)",
            description: "There was an error loading this NFT",
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==",
          });
        }
      }
      
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyAllCollectibles(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateMyCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, myTotalBalance]);

  if (allCollectiblesLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-4">

      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-center">
            <div className="text-2xl text-primary-content mb-4">No NFTs found</div>
            <p className="text-slate-400">
              Create your first cosmic graph NFT using the minter above! 🌌
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {myAllCollectibles.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </div>
  );
};
