import React, { useEffect, useRef, useMemo } from "react";
import { Network, DataSet, Options } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";
import { GraphNode, GraphLink } from "../graph-data/types";

// Optimized options for better performance
const optimizedCosmicOptions: Options = {
  nodes: {
    shape: "dot",
    size: 8,
    font: {
      size: 12,
      face: "Inter, sans-serif",
      color: "#ffffff",
      strokeWidth: 1, // Reduced stroke width
      strokeColor: "#000000",
    },
    borderWidth: 0,
    shadow: false, // Disable shadows for performance
    color: {
      border: "transparent",
      background: "#ffffff",
      highlight: { border: "#61dafb", background: "#61dafb" },
      hover: { border: "#ffd93d", background: "#ffd93d" },
    },
  },
  edges: {
    smooth: false, // Disable smooth edges for performance
    color: {
      color: "rgba(97, 218, 251, 0.4)",
      highlight: "rgba(97, 218, 251, 0.8)",
    },
    width: 1,
    shadow: false, // Disable shadows
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.3,
        type: "arrow",
      },
    },
  },
  physics: {
    enabled: true,
    stabilization: {
      iterations: 200, // Reduced iterations
      updateInterval: 25, // Faster updates
    },
    barnesHut: {
      gravitationalConstant: -4000, // Reduced for faster simulation
      centralGravity: 0.1,
      springLength: 150, // Shorter springs
      springConstant: 0.04,
      damping: 0.1,
      avoidOverlap: 0.3,
    },
    maxVelocity: 30, // Reduced max velocity
    minVelocity: 0.1,
    timestep: 0.3, // Smaller timesteps
    adaptiveTimestep: true, // Enable adaptive timestep
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: false, // Disable hover for performance
    hoverConnectedEdges: false,
    selectConnectedEdges: false,
    tooltipDelay: 100,
  },
  layout: {
    improvedLayout: false, // Disable for performance
    randomSeed: 42,
  },
  configure: {
    enabled: false, // Disable configuration panel
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

  // Initialize network
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing network
    if (networkRef.current) {
      networkRef.current.destroy();
    }

    nodesRef.current = new DataSet([]);
    edgesRef.current = new DataSet([]);

    // Create network with optimized options
    networkRef.current = new Network(
      containerRef.current,
      { nodes: nodesRef.current, edges: edgesRef.current },
      { ...optimizedCosmicOptions, ...networkOptions }
    );

    // Event handlers
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

    // Performance: Turn off physics after stabilization
    networkRef.current.on("stabilizationIterationsDone", () => {
      console.log("Network stabilized - disabling physics");
      networkRef.current?.setOptions({ physics: { enabled: false } });
    });

    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, [networkOptions, onNodeClick, onEdgeClick]);

  // Memoized nodes with simplified styling
  const optimizedNodes = useMemo(() => {
    return graphData.nodes.map((node) => {
      const balance = parseFloat(node.balance || "0");
      let color, size;

      if (node.isContract) {
        color = "#ff6b6b";
        size = 10;
      } else if (balance > 10) {
        color = "#ffd93d";
        size = 12;
      } else if (balance > 1) {
        color = "#74b9ff";
        size = 8;
      } else {
        color = "#ffffff";
        size = 6;
      }

      return {
        id: node.id,
        label: "", // Remove labels for performance
        title: `${node.label}\nBalance: ${node.balance} ETH\nType: ${
          node.isContract ? "Contract" : "EOA"
        }`,
        color: {
          background: color,
          border: "transparent",
        },
        size: size,
      };
    });
  }, [graphData.nodes]);

  // Memoized edges with simplified styling
  const optimizedEdges = useMemo(() => {
    return graphData.links.map((link) => ({
      id: link.transactionHash,
      from: link.source,
      to: link.target,
      color: "rgba(97, 218, 251, 0.4)",
      width: 1,
    }));
  }, [graphData.links]);

  // Update data efficiently
  useEffect(() => {
    if (!nodesRef.current || !edgesRef.current) return;

    // Use batch updates for better performance
    nodesRef.current.clear();
    edgesRef.current.clear();

    // Add data in batches
    if (optimizedNodes.length > 0) {
      nodesRef.current.add(optimizedNodes);
    }
    if (optimizedEdges.length > 0) {
      edgesRef.current.add(optimizedEdges);
    }

    // Delayed fit for better performance
    setTimeout(() => {
      networkRef.current?.fit({
        animation: { duration: 500, easingFunction: "easeInOutQuad" },
      });
    }, 500);
  }, [optimizedNodes, optimizedEdges]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        background: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
        borderRadius: 12,
        border: "1px solid rgba(97, 218, 251, 0.1)",
        position: "relative",
        overflow: "hidden",
      }}
    />
  );
};

export default VisNetworkGraph;