"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { MyHoldings } from "../../myNFTs/_components"; // Reuse the existing component

interface NFTData {
  tokenId: string;
  owner: string;
  tokenURI: string;
  metadata?: any;
}

export const AllHoldings = () => {
  const [allNFTs, setAllNFTs] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: contractInfo } = useDeployedContractInfo("YourCollectible");
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchAllNFTs = async () => {
      if (!contractInfo?.address || !publicClient) return;

      try {
        setLoading(true);
        
        // Get all Transfer events to find minted tokens
        const logs = await publicClient.getLogs({
          address: contractInfo.address,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'tokenId', type: 'uint256', indexed: true }
            ]
          },
          fromBlock: 'earliest',
          toBlock: 'latest'
        });

        // Filter for mint events (from address 0x0)
        const mintEvents = logs.filter(log => 
          log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000'
        );

        const nftData: NFTData[] = [];

        for (const event of mintEvents) {
          const tokenId = parseInt(event.topics[3]!, 16).toString();
          const owner = `0x${event.topics[2]!.slice(26)}`;

          // Get token URI
          try {
            const tokenURI = await publicClient.readContract({
              address: contractInfo.address,
              abi: [
                {
                  name: 'tokenURI',
                  type: 'function',
                  stateMutability: 'view',
                  inputs: [{ name: 'tokenId', type: 'uint256' }],
                  outputs: [{ name: '', type: 'string' }]
                }
              ],
              functionName: 'tokenURI',
              args: [BigInt(tokenId)]
            });

            nftData.push({
              tokenId,
              owner,
              tokenURI: tokenURI as string
            });
          } catch (error) {
            console.error(`Error fetching tokenURI for token ${tokenId}:`, error);
          }
        }

        setAllNFTs(nftData);
      } catch (error) {
        console.error("Error fetching all NFTs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNFTs();
  }, [contractInfo?.address, publicClient]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-4">Loading all NFTs...</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-7xl w-full px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-purple-300">
          🌌 All Cosmic Graphs ({allNFTs.length})
        </h2>
        
        {allNFTs.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            No cosmic NFTs have been minted yet. Be the first to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allNFTs.map((nft) => (
              <div key={nft.tokenId} className="bg-base-200 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">
                  Token #{nft.tokenId}
                </div>
                <div className="text-sm text-purple-300 mb-4">
                  Owner: {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                </div>
                
                {/* You can add more details here, like loading metadata from IPFS */}
                <div className="bg-black rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                  <span className="text-slate-500">Cosmic Visualization</span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <a 
                    href={nft.tokenURI} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline w-full"
                  >
                    View Metadata
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};