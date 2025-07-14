import { NextRequest, NextResponse } from "next/server";
import { NETWORK_MAP } from "../utils";
import { Alchemy, AssetTransfersCategory, SortingOrder } from "alchemy-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chain = (searchParams.get("chain") as keyof typeof NETWORK_MAP) || "sepolia";
  const _network = NETWORK_MAP[chain] || NETWORK_MAP.sepolia;

  if (!address) {
    return NextResponse.json({ error: "Address parameter required" }, { status: 400 });
  }

  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: _network,
    connectionInfoOverrides: { skipFetchSetup: true },
  });

  // console.log("Fetching transfers for address:", address);
  // console.log("Using network:", _network);

  // Internal transfers are not supported on Arbitrum and Base
  const supportsInternal = chain !== "arbitrum" && chain !== "base";

  const categories = [
    AssetTransfersCategory.EXTERNAL,
    ...(supportsInternal ? [AssetTransfersCategory.INTERNAL] : []),
    AssetTransfersCategory.ERC20,
    AssetTransfersCategory.ERC721,
    AssetTransfersCategory.ERC1155,
  ];

  const commonParams = {
    fromBlock: "0x0",
    toBlock: "latest",
    maxCount: 200,
    category: categories,
    order: SortingOrder.DESCENDING,
  };

  try {
    // console.log("Making Alchemy API calls...");

    // Fetch sent and received separately with error handling
    const [sent, received] = await Promise.all([
      alchemy.core
        .getAssetTransfers({
          ...commonParams,
          fromAddress: address,
          toAddress: undefined,
        })
        .catch(err => {
          console.error("Error fetching sent transfers:", err);
          return { transfers: [] };
        }),
      alchemy.core
        .getAssetTransfers({
          ...commonParams,
          fromAddress: undefined,
          toAddress: address,
        })
        .catch(err => {
          console.error("Error fetching received transfers:", err);
          return { transfers: [] };
        }),
    ]);

    // console.log("Sent transfers:", sent.transfers.length);
    // console.log("Received transfers:", received.transfers.length);

    // Combine and deduplicate by tx hash
    const all = [...sent.transfers, ...received.transfers];
    // console.log("Total transfers before dedup:", all.length);

    const seen = new Set<string>();
    const deduped = all.filter(tx => {
      if (seen.has(tx.hash)) return false;
      seen.add(tx.hash);
      return true;
    });

    // console.log("Total transfers after dedup:", deduped.length);

    return NextResponse.json({ transfers: deduped });
  } catch (err) {
    console.error("Failed to fetch transfers:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch transfers",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
