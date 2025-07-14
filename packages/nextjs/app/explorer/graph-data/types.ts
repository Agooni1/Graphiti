// Purpose:
// Central place for defining the shared data shapes used in your graph logic
import { AssetTransfersResult } from "alchemy-sdk";

export interface GraphDataProps {
  address: string;
  depth?: number;
  maxDepth?: number;
  onGraphDataReady: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
}

export interface GraphNode {
  id: string;
  label?: string;
  balance?: string;
  isContract?: boolean;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  transactionHash?: string;
  curvatureIndex?: number;
  tx?: AssetTransfersResult;
  direction?: "inbound" | "outbound";
}

export interface FilterOptions {
  maxCount?: number;
  maxChild?: number;
  address?: string;
  order?: "newest" | "oldest";
  direction?: "from" | "to" | "both"; // ← add this line
}

export interface Props {
  transfers: AssetTransfersResult[];
  options?: FilterOptions;
}

export interface PairDataProps {
  pairsFromParent: { from: string; to: string; direction: "inbound" | "outbound" }[];
  transfers: AssetTransfersResult[];
}

export interface DataProps {
  address: string;
  NumNodes?: number;
  NumLayers?: number;
  txNum?: number;
  direction: "from" | "to" | "both"; // ← add this line
  onGraphDataReady: (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
}
