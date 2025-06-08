import { alchemy } from "~~/app/lib/alchemy";
import { AssetTransfersCategory, SortingOrder } from "alchemy-sdk";
import { FilterPair, pairData } from "../graph-data/utils";
import { GraphNode, GraphLink } from "../graph-data/types";

type BuildGraphOptions = {
  address: string;
  txNum: number;
  maxDepth: number;
  direction?: string;
};

export async function buildGraphData(
  { address, txNum, maxDepth, direction }: BuildGraphOptions,
  currentDepth = 0,
  visited = new Set<string>(),
  nodeMap = new Map<string, GraphNode>(),
  linkSet = new Set<string>()
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const addr = address.toLowerCase();
  if (currentDepth > maxDepth || visited.has(addr)) {
    return { nodes: Array.from(nodeMap.values()), links: Array.from(linkSet.values()) as any };
  }
  visited.add(addr);

  // Fetch transfers for this address
  const commonParams = {
    fromBlock: "0x0",
    toBlock: "latest",
    maxCount: txNum,
    category: [
      AssetTransfersCategory.EXTERNAL,
      AssetTransfersCategory.INTERNAL,
      AssetTransfersCategory.ERC20,
      AssetTransfersCategory.ERC721,
      AssetTransfersCategory.ERC1155,
    ],
    order: SortingOrder.DESCENDING,
  };

  let allTransfers: any[] = [];
  if (direction === "from") {
    const resFrom = await alchemy.core.getAssetTransfers({ ...commonParams, fromAddress: address });
    allTransfers = resFrom.transfers;
  } else if (direction === "to") {
    const resTo = await alchemy.core.getAssetTransfers({ ...commonParams, toAddress: address });
    allTransfers = resTo.transfers;
  } else {
    const [resFrom, resTo] = await Promise.all([
      alchemy.core.getAssetTransfers({ ...commonParams, fromAddress: address }),
      alchemy.core.getAssetTransfers({ ...commonParams, toAddress: address }),
    ]);
    allTransfers = [...resFrom.transfers, ...resTo.transfers];
    allTransfers.sort((a, b) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16));
    allTransfers = allTransfers.slice(0, txNum ?? 1);
  }

  const pairsFromParent = FilterPair(allTransfers, address);
  const { nodes, links } = await pairData({ pairsFromParent, transfers: allTransfers });

  // Add nodes and links to maps/sets for uniqueness
  for (const node of nodes) {
    nodeMap.set(node.id.toLowerCase(), node);
  }
  for (const link of links) {
    // Use a unique key for each link
    const key = `${link.source}-${link.target}-${link.transactionHash ?? ""}`;
    if (!linkSet.has(key)) {
      (linkSet as any).add(link); // store the actual link object
      linkSet.add(key); // store the key for uniqueness
    }
  }

  // Recursively fetch for child nodes (to addresses)
  for (const node of nodes) {
    if (!visited.has(node.id.toLowerCase())) {
      await buildGraphData(
        { address: node.id, txNum, maxDepth, direction },
        currentDepth + 1,
        visited,
        nodeMap,
        linkSet
      );
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkSet).filter(l => typeof l !== "string") as GraphLink[],
  };
}