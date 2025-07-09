// /app/api/mint-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Wallet, solidityPackedKeccak256, getBytes, verifyMessage } from "ethers";
import { getGraphHTMLForIPFS } from "~~/app/test/graph/htmlGraphGenerator";
import { uploadHtmlToIPFS, uploadMetadataToIPFS } from "~~/utils/cosmicNFT/ipfs-upload";
import { generateMetadata } from "~~/utils/cosmicNFT/generateMetadata";
import { generateNodesFromTx } from "~~/app/test/graph-data/generateNodesFromTx";

// Import the cached functions from your utils
import { 
  getETHBalanceCached, 
  isContractCached, 
  FilterAndSortTx, 
  FilterPair, 
  pairData,
  asyncPool
} from "~~/app/test/graph-data/utils";
import { fetchAllTransfersCached } from "~~/app/test/graph-data/utils";

// Adjust path as needed

const signer = new Wallet(process.env.SIGNING_PRIVATE_KEY!);

// Rate limiting and request tracking
const addressRequestTracker = new Map<string, number>();
const pendingRequests = new Set<string>();

const IS_LOCALHOST = process.env.NODE_ENV === 'development';
const TEST_ADDRESS = "0xcC6eDeB501BbD8AD9E028BDe937B63Cdd64A1D91";

export async function POST(req: NextRequest) {
  const { 
    userAddress: originalUserAddress, 
    signature, 
    message, 
    timestamp,
    layoutMode = 'shell',
    particleMode = 'pulse',
    chain = 'sepolia',
    // txDisplayLimit = 200,
    transferDirection = 'both',
    isOrbiting = true,
    targetNode,
    viewState
  } = await req.json();

  // 🔧 LOCALHOST OVERRIDE: Use test address for development
  const userAddress = IS_LOCALHOST ? TEST_ADDRESS : originalUserAddress;

  console.log(`🔍 ${IS_LOCALHOST ? '[LOCALHOST MODE]' : '[PRODUCTION MODE]'} Processing mint for: ${userAddress}`);

  // Input validation - relaxed for localhost
  if (!IS_LOCALHOST && (!userAddress || !signature || !message || !timestamp)) {
    return NextResponse.json({ error: "Missing required authentication fields" }, { status: 400 });
  }

  try {
    // 🔧 SKIP AUTHENTICATION FOR LOCALHOST
    if (!IS_LOCALHOST) {
      // 1. Verify timestamp is recent (within 5 minutes)
      const now = Date.now();
      if (now - timestamp > 5 * 60 * 1000) {
        return NextResponse.json({ error: "Request expired - timestamp too old" }, { status: 400 });
      }

      // 2. Verify signature proves address ownership
      const expectedMessage = `Mint cosmic graph for ${userAddress} at ${timestamp}`;
      if (message !== expectedMessage) {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
      }

      const recoveredAddress = verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return NextResponse.json({ error: "Signature verification failed" }, { status: 403 });
      }
    } else {
      console.log(`🔧 LOCALHOST: Skipping signature verification for ${userAddress}`);
    }

    // 🔧 SKIP RATE LIMITING FOR LOCALHOST
    if (!IS_LOCALHOST) {
      // 4. Prevent concurrent requests for same address
      if (pendingRequests.has(userAddress.toLowerCase())) {
        return NextResponse.json({ 
          error: "Request already in progress for this address" 
        }, { status: 409 });
      }

      // Mark request as pending
      pendingRequests.add(userAddress.toLowerCase());
      addressRequestTracker.set(userAddress.toLowerCase(), Date.now());
    }

    // 5. Fetch transfers using CACHED function (likely already cached!)
    console.log(`🔍 Fetching transfers for: ${userAddress} on chain: ${chain}`);
    console.log(`🔍 Chain parameter received: ${chain}`);
    const allTransfers = await fetchAllTransfersCached(userAddress, chain);

    console.log(`📊 Found ${allTransfers.length} transfers for ${userAddress} on ${chain}`);

    if (allTransfers.length === 0) {
      console.log(`❌ No transfers found for ${userAddress} on ${chain}`);
      
      // Add more detailed error information
      return NextResponse.json({ 
        error: `No transaction history found for address ${userAddress} on ${chain} network`,
        debug: {
          userAddress,
          chain,
          transferCount: allTransfers.length,
          suggestion: "Ensure this address has made transactions on the selected network"
        }
      }, { status: 400 });
    }

    // 6. Process transfers to get pairs
    console.log(`📊 Processing ${allTransfers.length} transfers...`);
    const filteredTransfers: any[] = FilterAndSortTx(allTransfers, {
    //   maxCount: txDisplayLimit,           // 🔧 Changed from 1000 to txDisplayLimit
      direction: transferDirection,       // 🔧 Changed from "both" to transferDirection
      address: userAddress,               // 🔧 Keep the same (userAddress = address)
      // 🔧 Remove "order: newest" - page.tsx doesn't use it
    });

    const pairsFromParent = FilterPair(filteredTransfers, userAddress);
    console.log(`🔗 Found ${pairsFromParent.length} unique pairs`);

    // 7. Generate graph data using the SAME function as the graph UI
    console.log(`🎨 Generating graph data...`);
    const generatedgraphData = await generateNodesFromTx(
      filteredTransfers, 
      chain,
      (loaded, total) => console.log(`📊 Processing nodes: ${loaded}/${total}`)
    );

    // 8. Create the SAME structure as page.tsx
    // const graphData = {
    //   nodes: generatedGraph.nodes || [],
    //   links: generatedGraph.links || []
    // };

    console.log(`📊 Generated ${generatedgraphData.nodes.length} nodes and ${generatedgraphData.links.length} links`);

    // 9. Generate HTML visualization (use ACTUAL UI state)
    console.log(`🖼️ Generating HTML visualization...`);
    const graphConfig = {
      graphData: generatedgraphData,
      targetNode: targetNode || userAddress,  // 🔧 Use passed targetNode
      layoutMode: layoutMode as 'shell' | 'force' | 'fibonacci',
      particleMode: particleMode as 'pulse' | 'laser' | 'off',
      isOrbiting: isOrbiting,  // 🔧 Use passed isOrbiting value
      viewState: viewState || undefined  // 🔧 Use passed viewState
    };

    const htmlContent = getGraphHTMLForIPFS(graphConfig);
    if (!htmlContent) {
      throw new Error("Failed to generate HTML content");
    }

    // 10. Upload HTML to IPFS
    console.log(`📤 Uploading HTML to IPFS...`);
    const htmlCid = await uploadHtmlToIPFS(
      htmlContent, 
      `cosmic-graph-${userAddress.slice(0, 6)}.html`
    );

    // 11. Create simple metadata (not using generateMetadata with cosmic data)
    console.log(`📋 Creating NFT metadata...`);
    // console.log ("generatedgraphData", generatedgraphData);
    // const metadata = {
    //   name: `Cosmic Graph - ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
    //   description: `Interactive 3D transaction graph for ${userAddress} on ${chain}`,
    //   image: `ipfs://${htmlCid}`,
    //   animation_url: `ipfs://${htmlCid}`,
    //   attributes: [
    //     { trait_type: "Address", value: userAddress },
    //     { trait_type: "Nodes", value: generatedgraphData.nodes.length },
    //     { trait_type: "Links", value: generatedgraphData.links.length },
    //     { trait_type: "Layout", value: layoutMode },
    //     { trait_type: "Particles", value: particleMode },
    //     { trait_type: "Network", value: chain },
    //     { trait_type: "Transfers", value: allTransfers.length }
    //   ]
    // };

    const addressCosmicData = {
      address: userAddress,
      balance: await getETHBalanceAsBigInt(userAddress), 
      transactionCount: allTransfers.length,
      connectedAddresses: Array.from(new Set(
        allTransfers
          .flatMap(tx => [tx.from, tx.to])
          .filter((addr): addr is string => typeof addr === 'string' && addr !== null && addr.toLowerCase() !== userAddress.toLowerCase())
      )),
      // Transform AssetTransfersResult[] to Transaction[]
      recentTransactions: allTransfers.slice(0, 10).map(transfer => ({
        hash: transfer.hash || transfer.uniqueId || `${transfer.blockNum}-${transfer.from}-${transfer.to}`,
        from: transfer.from || '',
        to: transfer.to || '',
        value: transfer.value?.toString() || '0',
        timestamp: transfer.blockNum
          ? Number(transfer.blockNum)
          : Math.floor(Date.now() / 1000) // fallback to current time
      })),
      tokenBalances: [], 
      nftCount: 0 
    };

    // 🔧 ADD: Chain ID mapping function (add this before generateMetadata call)
    const getChainId = (chain: string) => {
      switch (chain) {
        case 'sepolia': return 11155111;
        case 'mainnet': return 1;
        case 'base': return 8453;
        case 'arbitrum': return 42161;
        default: return 11155111; // fallback to sepolia
      }
    };

    const { metadata } = generateMetadata(
      addressCosmicData,
      htmlCid,
      layoutMode as 'shell' | 'force' | 'fibonacci',
      'html',
      getChainId(chain), // 🔧 FIXED: Use dynamic chain mapping
      generatedgraphData.nodes.length,
    );


        
    // const AddressCosmicData {
    //   address: generatedgraphData.address,;
    //   balance: bigint;
    //   transactionCount: number;
    //   connectedAddresses: string[];
    //   recentTransactions: Transaction[];
    //   tokenBalances: TokenBalance[];
    //   nftCount: number;
    // }

    console.log(`📤 Uploading metadata to IPFS...`);
    const metadataCid = await uploadMetadataToIPFS(metadata);

    // 12. Create signature for minting (assuming nonce is 0 for now)
    console.log(`✍️ Creating minting signature...`);
    const currentNonce = 0; // You might want to fetch this from your contract
    const messageHash = solidityPackedKeccak256(
      ["string", "address", "uint256"],
      [metadataCid, userAddress, currentNonce]
    );

    const messageHashBytes = getBytes(messageHash);
    const mintingSignature = await signer.signMessage(messageHashBytes);

    console.log(`✅ Successfully prepared mint for: ${userAddress}`);
    console.log(`📊 Stats: ${generatedgraphData.nodes.length} nodes, ${generatedgraphData.links.length} links`);

    // Debugging output
    console.log(`🔍 DEBUG VALUES:`);
    console.log(`- metadataCid: ${metadataCid} (type: ${typeof metadataCid})`);
    console.log(`- userAddress: ${userAddress} (type: ${typeof userAddress})`);
    console.log(`- currentNonce: ${currentNonce} (type: ${typeof currentNonce})`);

    if (!metadataCid || metadataCid === 'undefined' || metadataCid === 'null') {
      throw new Error(`Invalid metadataCid: ${metadataCid}`);
    }

    return NextResponse.json({
      metadataCid,
      signature: mintingSignature,
      nonce: currentNonce,
      metadata: metadata,
      htmlCid,
      stats: {
        transferCount: allTransfers.length,
        nodeCount: generatedgraphData.nodes.length,
        linkCount: generatedgraphData.links.length,
        pairCount: pairsFromParent.length
      }
    });

  } catch (error) {
    console.error(`❌ Error processing mint request for ${userAddress}:`, error);
    return NextResponse.json({ 
      error: "Failed to process mint request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });

  } finally {
    // Always remove from pending requests (only if not localhost)
    if (!IS_LOCALHOST) {
      pendingRequests.delete(userAddress.toLowerCase());
    }
  }
}

// Helper function to get ETH balance as BigInt
async function getETHBalanceAsBigInt(address: string): Promise<bigint> {
  try {
    const balanceStr = await getETHBalanceCached(address);
    if (balanceStr === "..." || !balanceStr || balanceStr === "0") {
      return BigInt(0);
    }
    // Remove any non-numeric characters except decimal points
    const cleanBalance = balanceStr.replace(/[^0-9.]/g, '');
    if (!cleanBalance || cleanBalance === '.') {
      return BigInt(0);
    }
    // Convert to wei (multiply by 10^18 if it's in ETH)
    const balanceNum = parseFloat(cleanBalance);
    return BigInt(Math.floor(balanceNum * 1e18));
  } catch (error) {
    console.log(`⚠️ Failed to convert balance for ${address}, using 0`);
    return BigInt(0);
  }
}

// Helper function to get Chain ID
function getChainId(chain: string): number {
  switch (chain) {
    case 'sepolia':
      return 11155111;
    case 'mainnet':
      return 1;
    // Add more cases as needed
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}