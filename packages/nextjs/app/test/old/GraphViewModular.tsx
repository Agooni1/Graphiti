// graph/
// ├── GraphView.tsx                ← Main ForceGraph2D component (lean logic)
// ├── nodeRenderUtils.ts          ← Drawing logic for canvas nodes and pointer area
// ├── linkUtils.ts                ← Curvature calculation, color assignment
// ├── graphConstants.ts           ← Constants like box sizes, line heights, etc.
// ├── types.ts                    ← Re-exports of GraphNode, GraphLink

// Purpose:
// The main React component rendering your force-directed graph using react-force-graph-2d.

"use client";
import dynamic from "next/dynamic";
import { FC, useEffect, useRef, useState, useLayoutEffect } from "react";
import { drawNode, paintNodePointerArea } from "./nodeRenderUtils";
import { getLinkCurvature, getLinkColor } from "./linkUtils";
import { GraphNode, GraphLink } from "../graph-data/types";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import * as d3 from "d3-force"; // Add this import at the top

// Dynamically import ForceGraph2D with SSR disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphViewProps {
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

const GraphViewModular: FC<GraphViewProps> = ({ graphData }) => {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [shouldZoom, setShouldZoom] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const PADDING = 1; // px, adjust as needed

  // Set dimensions to match container, minus padding
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth - PADDING * 2,
          height: containerRef.current.offsetHeight - PADDING * 2,
        });
      }
    }
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [fullscreen]);

  // When graphData changes, trigger zoom after simulation
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      setShouldZoom(true);
    }
  }, [graphData, dimensions]);

  const getDynamicPadding = () => {
    // Minimum 60, scale up with node count
    return Math.max(60, Math.min(200, graphData.nodes.length * 2));
  };

  // Only zoom after simulation stops
  const handleEngineStop = () => {
    if (shouldZoom && graphRef.current) {
      const padding = getDynamicPadding();
      graphRef.current.zoomToFit(padding, 800);
      setShouldZoom(false);

      // Fallback: call zoomToFit again after a short delay (helps with some edge cases)
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(padding, 400);
        }
      }, 500);
    }
  };

  useEffect(() => {
    const nodeCount = graphData.nodes.length;
    // Increase link distance and repulsion for larger graphs
    const linkDistance = Math.min(800, 200 + nodeCount * 18);
    const chargeStrength = Math.max(-2000, -400 - nodeCount * 30);

    graphRef.current?.d3Force("link")?.distance(linkDistance);
    graphRef.current?.d3Force("charge")?.strength(chargeStrength);

    // Add or update collision force to prevent node overlap
    if (graphRef.current?.d3Force("collide")) {
      graphRef.current.d3Force("collide").radius(90); // Adjust radius as needed
    } else if (graphRef.current?.d3Force) {
      graphRef.current.d3Force("collide", d3.forceCollide(90));
    }

    graphRef.current?.d3ReheatSimulation();
  }, [graphData]);

  // Fullscreen styles
  const containerClass = fullscreen
    ? "fixed top-[4.5rem] left-0 w-screen h-[calc(100vh-4.5rem)] z-50 bg-base-100 rounded-none shadow-2xl transition-all"
    : "w-full max-w-6xl h-[70vh] bg-base-100 rounded-xl shadow-lg relative transition-all";

  return (
    <div ref={containerRef} className={containerClass}>
      {/* Fullscreen Toggle Button */}
      <button
        className="absolute top-4 right-4 btn btn-sm btn-circle z-50"
        onClick={() => setFullscreen(f => !f)}
        aria-label={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {fullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
      </button>
      <div style={{ width: "100%", height: "100%", padding: PADDING, boxSizing: "border-box" }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeCanvasObject={(node, ctx, globalScale) =>
            drawNode(node as GraphNode, ctx, globalScale)
          }
          nodePointerAreaPaint={(node, color, ctx) =>
            paintNodePointerArea(node as GraphNode, color, ctx)
          }
          linkCurvature={(link) =>
            getLinkCurvature(link as GraphLink, graphData.links)
          }
          linkColor={(link) => getLinkColor(link as GraphLink)}
          linkDirectionalArrowLength={18}
          linkDirectionalArrowRelPos={0.9}
          linkWidth={2}
          linkLabel={(link: GraphLink) => link.transactionHash ?? ""}
          width={dimensions.width}
          height={dimensions.height}
          onNodeClick={(node) => {
            const address = (node as GraphNode).id;
            window.open(`https://sepolia.etherscan.io/address/${address}`, "_blank");
          }}
          onLinkClick={(link) => {
            const hash = (link as GraphLink).transactionHash;
            if (hash) {
              window.open(`https://sepolia.etherscan.io/tx/${hash}`, "_blank");
            }
          }}
          onEngineStop={handleEngineStop}
        />
      </div>
    </div>
  );
};

export default GraphViewModular;