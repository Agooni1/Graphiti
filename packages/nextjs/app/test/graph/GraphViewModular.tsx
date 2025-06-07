// graph/
// ├── GraphView.tsx                ← Main ForceGraph2D component (lean logic)
// ├── nodeRenderUtils.ts          ← Drawing logic for canvas nodes and pointer area
// ├── linkUtils.ts                ← Curvature calculation, color assignment
// ├── graphConstants.ts           ← Constants like box sizes, line heights, etc.
// ├── types.ts                    ← Re-exports of GraphNode, GraphLink

// Purpose:
// The main React component rendering your force-directed graph using react-force-graph-2d.

import ForceGraph2D from "react-force-graph-2d";
import { FC, useEffect, useRef } from "react";
import { drawNode, paintNodePointerArea } from "./nodeRenderUtils";
import { getLinkCurvature, getLinkColor } from "./linkUtils";
import { GraphNode, GraphLink } from "../graph-data/types";


interface GraphViewProps {
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

const GraphViewModular: FC<GraphViewProps> = ({ graphData }) => {
  const graphRef = useRef<any>(null);

  useEffect(() => {
    const nodeCount = graphData.nodes.length;
    const linkDistance = Math.min(500, 200 + nodeCount * 10);
    const chargeStrength = Math.max(-800, -200 - nodeCount * 15);
    graphRef.current?.d3Force("link")?.distance(linkDistance);
    graphRef.current?.d3Force("charge")?.strength(chargeStrength);
    graphRef.current?.d3ReheatSimulation();
  }, [graphData]);

  return (
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
      width={window.innerWidth}
      height={window.innerHeight * 0.8}
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
    />
  );
};

export default GraphViewModular;

//TO DO:
// FIGURE OUT HOW TRANSACTIONS ARE GETTING PASSED/PROCESS ESPECIALLY FOR CHILD NODES - sure kind
// GO THROUGH AND MODULARIZE ALL DATA STUFF
// FIX ARROW DIRECTION FOR TRANSACTIONS AND YA CHILD
// ALSO SPACING SO THINGS DONT OVERLAP
//add sliders for number of transactions, depth, time too maybe?


//ok next step we got filtered transactions (only from -> to pairs so far) - filterAndSort.tsx
// figure out how to pass that into generateNodesfromTx / create a new version, and feed it into graphviewmodular

//ok I kinda got it, the link info/graphdata has been cleaned up. I think we gotta implement a TO and FROM variable,
//(maybe using key) in PairData. Also holy these graphview files and a lot of files need to be cleaned up.

//bruv alright zoom to fit, link path/spacing, second/multiple layers