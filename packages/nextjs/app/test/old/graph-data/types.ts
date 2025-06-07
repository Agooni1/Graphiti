// Purpose:
// Central place for defining the shared data shapes used in your graph logic

import { AssetTransfersResult } from "alchemy-sdk";

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
//   txs?: AssetTransfersResult[];
    tx?: AssetTransfersResult;
    direction?: "inbound" | "outbound";
}

export interface FilterOptions {
  maxCount?: number;
  maxChild?: number;
  order?: "newest" | "oldest";
}