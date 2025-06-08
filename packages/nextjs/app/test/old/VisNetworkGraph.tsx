import React, { useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import "vis-network/styles/vis-network.css";
import { GraphNode, GraphLink } from "../graph-data/types";
import { getETHBalance } from ".";

interface VisNetworkGraphProps {
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  height?: string;
  width?: string;
}

const VisNetworkGraph: React.FC<VisNetworkGraphProps> = ({
  graphData,
  height = "70vh",
  width = "100%",
}) => {
    // console.log("INSIDE VIS NETWORK GRAPH", graphData);
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Always destroy previous network before creating a new one
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    // Convert your nodes/links to vis format
    const nodes = graphData.nodes
      .filter(n => typeof n.id === "string" && n.id) // Only valid string IDs
      .map((n) => ({
        id: n.id,
        label: `${n.isContract ? "📄" : "👤"} ${n.label ?? `${n.id.slice(0, 6)}...${n.id.slice(-4)}`}\nΞ ${n.balance ?? "0.0"} ETH`,
        shape: n.isContract ? "box" : "ellipse",
        color: {
          background: n.isContract ? "#f1f5ff" : "#e0e7ff",
          border: n.isContract ? "#6366f1" : "#3b82f6",
          highlight: {
            background: "#fff",
            border: "#6366f1"
          }
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

    const edges = graphData.links
      .filter(l => typeof l.source === "string" && typeof l.target === "string" && l.source && l.target)
      .map((l, idx) => ({
        id: l.transactionHash ?? `${l.source}-${l.target}-${idx}`,
        from: l.source, // vis-network expects 'from'
        to: l.target,   // vis-network expects 'to'
        arrows: "to",
        color: {
          color: "#94a3b8",
          highlight: "#6366f1",
          opacity: 0.7,
        },
        width: 2,
        label: l.transactionHash ? l.transactionHash.slice(0, 8) : undefined,
        font: { align: "middle", size: 10, color: "#64748b" },
        smooth: { type: "curvedCW", roundness: 0.2 },
      }));

    // console.log("vis nodes", nodes);
    // console.log("vis edges", edges);

    const data = { nodes, edges };

    const options = {
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

    networkRef.current = new Network(containerRef.current, data, options);

    // Node click: open address
    networkRef.current.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        window.open(`https://sepolia.etherscan.io/address/${nodeId}`, "_blank");
      }
      if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edge = edges.find((e) => e.id === edgeId);
        if (edge && edge.label) {
          window.open(`https://sepolia.etherscan.io/tx/${edge.id}`, "_blank");
        }
      }
    });

    // Cleanup
    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, [graphData]);

  return (
    <div
      key={graphData.nodes.length > 0 ? `${graphData.nodes[0].id}-${graphData.nodes[graphData.nodes.length-1].id}-${graphData.nodes.length}` : "empty"}
      ref={containerRef}
      style={{
        width,
        height,
        background: "transparent", // <-- transparent background
        borderRadius: 12,
        boxShadow: "0 2px 8px #0001"
      }}
    />
  );
};

export default VisNetworkGraph;