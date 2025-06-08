"use client";
import { useEffect } from "react";
import { buildGraphData } from "./buildGraphData";
import { DataProps } from "../graph-data/types";

export const GenerateTx = ({
  address,
  txNum = 10,
  NumLayers = 1,
  direction,
  onGraphDataReady,
}: DataProps) => {
  useEffect(() => {
    if (address) {
      buildGraphData({
        address,
        txNum,
        maxDepth: NumLayers,
        direction,
      }).then(onGraphDataReady);
    }
  }, [address, txNum, NumLayers, direction, onGraphDataReady]);
  return null;
};