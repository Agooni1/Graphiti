import dynamic from "next/dynamic";
import React, { useRef, useEffect } from "react";
import { ForceGraphMethods } from "react-force-graph-2d";
import {GraphNode, GraphLink} from "../graph-data/types"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphViewProps {
  graphData: GraphData;
}

const NewGraphView: React.FC<GraphViewProps> = ({ graphData }) => {
    
  const fgRef = useRef<ForceGraphMethods | null>(null);

  useEffect(() => {
  console.log("GRAPH DATA CHANGED:");
  console.log("NODES:", graphData.nodes.length, graphData.nodes);
  console.log("LINKS:", graphData.links.length, graphData.links);
}, [graphData]);

if (!graphData.nodes.length && !graphData.links.length) {
  console.warn("⚠️ Graph data is empty — nothing to render");
}


  useEffect(() => {
    fgRef.current?.d3ReheatSimulation();
  }, [graphData]);

    return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        linkCurvature={() => Math.random() * 0.2 - 0.1}
        // linkLabel={(link: GraphLink) => link.txs?.[0]?.hash ?? "No tx hash"}
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalArrowLength={4}
        linkWidth={(link) => ('txs' in link && Array.isArray(link.txs) ? Math.min(6, link.txs.length) : 1)}
        nodeLabel={(node: GraphNode) => node.id}
      />
    </div>
  );
};

export default NewGraphView;