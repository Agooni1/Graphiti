// /app/api/mint-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Wallet, getBytes, solidityPackedKeccak256, verifyMessage } from "ethers";
import { generateNodesFromTx } from "~~/app/explorer/graph-data/generateNodesFromTx";
import { FilterAndSortTx, FilterPair, getETHBalanceCached } from "~~/app/explorer/graph-data/utils";
import { fetchAllTransfersCached } from "~~/app/explorer/graph-data/utils";
import { getGraphHTMLForIPFS } from "~~/app/explorer/graph/htmlGraphGenerator";
import { generateMetadata } from "~~/utils/cosmicNFT/generateMetadata";

const signer = new Wallet(process.env.SIGNING_PRIVATE_KEY!);

const addressRequestTracker = new Map<string, number>();
const pendingRequests = new Set<string>();

export async function POST(req: NextRequest) {
  const {
    userAddress: originalUserAddress,
    signature,
    message,
    timestamp,
    layoutMode,
    particleMode,
    chain,
    transferDirection,
    isOrbiting,
    targetNode,
    viewState,
    graphData: clientGraphData,
    nonce,
  } = await req.json();

  // Step 1: Input validation (no localhost override)
  const userAddress = originalUserAddress;

  if (!userAddress || !signature || !message || !timestamp) {
    return NextResponse.json({ error: "Missing required authentication fields" }, { status: 400 });
  }

  try {
    // Step 2: Authentication
    const now = Date.now();
    if (now - timestamp > 1 * 60 * 1000) {
      return NextResponse.json({ error: "Request expired - timestamp too old" }, { status: 400 });
    }

    const expectedMessage = `Mint cosmic graph for ${userAddress} at ${timestamp}`;
    if (message !== expectedMessage) {
      return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
    }

    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 403 });
    }

    // Step 3: Rate limiting
    if (pendingRequests.has(userAddress.toLowerCase())) {
      return NextResponse.json({ error: "Request already in progress for this address" }, { status: 409 });
    }
    pendingRequests.add(userAddress.toLowerCase());
    addressRequestTracker.set(userAddress.toLowerCase(), Date.now());

    // Step 4: Fetch transfers
    const allTransfers = await fetchAllTransfersCached(userAddress, chain);

    if (allTransfers.length === 0) {
      return NextResponse.json(
        {
          error: `No transaction history found for address ${userAddress} on ${chain} network`,
          debug: {
            userAddress,
            chain,
            transferCount: allTransfers.length,
            suggestion: "Ensure this address has made transactions on the selected network",
          },
        },
        { status: 400 },
      );
    }

    // Step 5: Process transfers
    const filteredTransfers: any[] = FilterAndSortTx(allTransfers, {
      direction: transferDirection,
      address: userAddress,
    });

    const pairsFromParent = FilterPair(filteredTransfers, userAddress);

    // Step 6: Generate graph data
    let generatedgraphData;
    if (clientGraphData && clientGraphData.nodes && clientGraphData.links) {
      generatedgraphData = clientGraphData;
    } else {
      generatedgraphData = await generateNodesFromTx(filteredTransfers, chain);
    }

    // Step 7: Generate HTML visualization
    const graphConfig = {
      graphData: generatedgraphData,
      targetNode: targetNode || userAddress,
      layoutMode: layoutMode as "shell" | "force" | "fibonacci",
      particleMode: particleMode as "pulse" | "laser" | "off",
      isOrbiting: isOrbiting,
      viewState: viewState || undefined,
    };

    const htmlContent = getGraphHTMLForIPFS(graphConfig);
    if (!htmlContent) {
      throw new Error("Failed to generate HTML content");
    }

    // Step 8: Upload HTML to IPFS
    const htmlUploadRes = await internalApiPost("/api/ipfs/upload-html", {
      htmlContent,
      filename: `cosmic-graph-${userAddress.slice(0, 6)}.html`,
    });
    const htmlCid = htmlUploadRes.cid;

    // Step 9: Create metadata
    const addressCosmicData = {
      address: userAddress,
      balance: await getETHBalanceAsBigInt(userAddress),
      transactionCount: allTransfers.length,
      connectedAddresses: Array.from(
        new Set(
          allTransfers
            .flatMap(tx => [tx.from, tx.to])
            .filter(
              (addr): addr is string =>
                typeof addr === "string" && addr !== null && addr.toLowerCase() !== userAddress.toLowerCase(),
            ),
        ),
      ),
      recentTransactions: allTransfers.slice(0, 10).map(transfer => ({
        hash: transfer.hash || transfer.uniqueId || `${transfer.blockNum}-${transfer.from}-${transfer.to}`,
        from: transfer.from || "",
        to: transfer.to || "",
        value: transfer.value?.toString() || "0",
        timestamp: transfer.blockNum ? Number(transfer.blockNum) : Math.floor(Date.now() / 1000),
      })),
      tokenBalances: [],
      nftCount: 0,
    };

    const { metadata } = generateMetadata(
      addressCosmicData,
      htmlCid,
      layoutMode as "shell" | "force" | "fibonacci",
      "html",
      getChainId(chain),
      generatedgraphData.nodes.length,
    );

    // Step 10: Upload metadata to IPFS
    const metadataUploadRes = await internalApiPost("/api/ipfs/upload-metadata", { metadata });
    const metadataCid = metadataUploadRes.cid;

    // Step 11: Create signature for minting
    const messageHash = solidityPackedKeccak256(
      ["string", "address", "uint256"],
      [metadataCid, userAddress, nonce + 1],
    );
    const messageHashBytes = getBytes(messageHash);
    const mintingSignature = await signer.signMessage(messageHashBytes);

    if (!metadataCid || metadataCid === "undefined" || metadataCid === "null") {
      throw new Error(`Invalid metadataCid: ${metadataCid}`);
    }

    return NextResponse.json({
      metadataCid,
      signature: mintingSignature,
      metadata: metadata,
      htmlCid,
      stats: {
        transferCount: allTransfers.length,
        nodeCount: generatedgraphData.nodes.length,
        linkCount: generatedgraphData.links.length,
        pairCount: pairsFromParent.length,
      },
    });
  } catch (_error) {
    console.error(`❌ Error processing mint request for ${userAddress}:`, _error);
    return NextResponse.json(
      {
        error: "Failed to process mint request",
        details: _error instanceof Error ? _error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    pendingRequests.delete(userAddress.toLowerCase());
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
    const cleanBalance = balanceStr.replace(/[^0-9.]/g, "");
    if (!cleanBalance || cleanBalance === ".") {
      return BigInt(0);
    }
    const balanceNum = parseFloat(cleanBalance);
    return BigInt(Math.floor(balanceNum * 1e18));
  } catch {
    console.log(`⚠️ Failed to convert balance for ${address}, using 0`);
    return BigInt(0);
  }
}

// Helper function to get Chain ID
const getChainId = (chain: string) => {
  switch (chain) {
    case "sepolia":
      return 11155111;
    case "mainnet":
      return 1;
    case "base":
      return 8453;
    case "arbitrum":
      return 42161;
    default:
      return 11155111;
  }
};

// Internal API POST helper
async function internalApiPost(path: string, body: any) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `Failed to upload to ${path}`);
  }

  return res.json();
}
