import { GraphNode, GraphLink } from "../graph-data/types";
import { getETHBalance, isContract } from "../graph-data/utils";

/** Maps GraphNode to vis-network node format */
export function mapNodes(nodes: GraphNode[]) {
  return nodes
    .filter(n => typeof n.id === "string" && n.id)
    .map(n => ({
      id: n.id,
      label: `${n.isContract ? "📄" : "👤"} ${n.label ?? `${n.id.slice(0, 6)}...${n.id.slice(-4)}`}\nΞ ${n.balance ?? "0.0"} ETH`,
      shape: n.isContract ? "box" : "ellipse",
      color: {
        background: n.isContract ? "#f1f5ff" : "#e0e7ff",
        border: n.isContract ? "#6366f1" : "#3b82f6",
        highlight: { background: "#fff", border: "#6366f1" }
      },
      font: {
        color: "#222",
        size: 16,
        face: "Inter, sans-serif",
        multi: true,
        bold: true,
      },
      borderWidth: 2,
      shadow: true,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      title: `Address: ${n.id}\n${n.isContract ? "Contract" : "EOA"}\nBalance: ${n.balance ?? "?"} ETH`,
    }));
}

/** Maps GraphLink to vis-network edge format */
export function mapEdges(links: GraphLink[]) {
  return links
    .filter(l => typeof l.source === "string" && typeof l.target === "string" && l.source && l.target)
    .map((l, idx) => ({
      id: l.transactionHash ?? `${l.source}-${l.target}-${idx}`,
      from: l.source,
      to: l.target,
      arrows: "to",
      color: { color: "#94a3b8", highlight: "#6366f1", opacity: 0.7 },
      width: 2,
      label: l.transactionHash ? l.transactionHash.slice(0, 8) : undefined,
      font: { align: "middle", size: 10, color: "#64748b" },
      smooth: { type: "curvedCW", roundness: 0.2 },
    }));
}

const ethBalanceCache: Record<string, string> = {};
export async function getETHBalanceCached(address: string): Promise<string> {
  if (ethBalanceCache[address]) return ethBalanceCache[address];
  const balance = await getETHBalance(address);
  ethBalanceCache[address] = balance;
  return balance;
}

const contractCache: Record<string, boolean> = {};
export async function isContractCached(address: string): Promise<boolean> {
  if (address in contractCache) return contractCache[address];
  const result = await isContract(address);
  contractCache[address] = result;
  return result;
}