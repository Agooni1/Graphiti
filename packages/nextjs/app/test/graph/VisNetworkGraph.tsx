import React, { useEffect, useRef, useMemo } from "react";
import { Network, DataSet, Options } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";
import { GraphNode, GraphLink } from "../graph-data/types";
import { mapNodes, mapEdges } from "./visGraphUtils";

const defaultOptions: Options = {
  nodes: {
    shape: "ellipse",
    font: { size: 16, face: "Inter, sans-serif", color: "#222" },
    borderWidth: 2,
    shadow: true,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  },
  edges: {
    smooth: true,
    arrows: { to: { enabled: true, scaleFactor: 0.7 } },
    color: { color: "#94a3b8", highlight: "#6366f1", opacity: 0.7 },
    width: 2,
    shadow: true,
  },
  physics: false,
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: true,
    tooltipDelay: 100,
  },
  layout: {
    improvedLayout: true,
  },
};

interface VisNetworkGraphProps {
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  height?: string;
  width?: string;
  networkOptions?: Options;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (txHash: string) => void;
}

const VisNetworkGraph: React.FC<VisNetworkGraphProps> = ({
  graphData,
  height = "70vh",
  width = "100%",
  networkOptions,
  onNodeClick,
  onEdgeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesRef = useRef<any>(null);
  const edgesRef = useRef<any>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Initialize network only once
  useEffect(() => {
    if (!containerRef.current) return;
    if (!networkRef.current) {
      nodesRef.current = new DataSet([]);
      edgesRef.current = new DataSet([]);
      networkRef.current = new Network(
        containerRef.current,
        { nodes: nodesRef.current, edges: edgesRef.current },
        { ...defaultOptions, ...networkOptions }
      );

      networkRef.current.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          if (onNodeClick) onNodeClick(nodeId);
          else window.open(`https://sepolia.etherscan.io/address/${nodeId}`, "_blank");
        } else if (params.edges.length > 0) {
          const edgeId = params.edges[0];
          const edge = edgesRef.current.get(edgeId);
          if (edge && (onEdgeClick || edge.label)) {
            if (onEdgeClick) onEdgeClick(edge.id as string);
            else window.open(`https://sepolia.etherscan.io/tx/${edge.id}`, "_blank");
          }
        }
      });
    }
    // Cleanup on unmount
    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, [networkOptions, onNodeClick, onEdgeClick]);

  // Update nodes and edges when data changes
  useEffect(() => {
    if (!nodesRef.current || !edgesRef.current) return;
    const visNodes = mapNodes(graphData.nodes);
    const visEdges = mapEdges(graphData.links);

    // Update nodes
    nodesRef.current.update(visNodes);
    // Remove nodes not in the new data
    const nodeIds = visNodes.map(n => n.id);
    nodesRef.current.getIds().forEach((id: string) => {
      if (!nodeIds.includes(id)) {
        if (networkRef.current) {
          const pos = networkRef.current.getPositions([id])[id];
          if (pos) positionsRef.current[id] = pos;
        }
        nodesRef.current.remove(id);
      }
    });

    // Update edges
    edgesRef.current.update(visEdges);
    // Remove edges not in the new data
    const edgeIds = visEdges.map(e => e.id);
    edgesRef.current.getIds().forEach((id: string) => {
      if (!edgeIds.includes(id)) edgesRef.current.remove(id);
    });

    if (networkRef.current) {
      visNodes.forEach(n => {
        if (positionsRef.current[n.id] && networkRef.current) {
          const { x, y } = positionsRef.current[n.id];
          networkRef.current.moveNode(n.id, x, y);
        }
      });
    }
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        background: "transparent",
        borderRadius: 12,
        boxShadow: "0 2px 8px #0001"
      }}
    />
  );
};

export default VisNetworkGraph;