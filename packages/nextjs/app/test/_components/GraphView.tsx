"use client";

import ForceGraph2D from "react-force-graph-2d";
import { FC, useEffect, useRef } from "react";

export type GraphNode = {
  id: string;
  label: string;
  isContract?: boolean;
  balance?: string;
  x?: number;
  y?: number;
};

export type GraphLink = {
  source: string;
  target: string;
  transactionHash: string;
  curvatureIndex?: number;
};

interface GraphViewProps {
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export const GraphView: FC<GraphViewProps> = ({ graphData }) => {
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (!fgRef.current) return;
    const nodeCount = graphData.nodes.length;

    // Stronger force separation for larger graphs
    const linkDistance = Math.min(500, 200 + nodeCount * 10);
    const chargeStrength = Math.max(-800, -200 - nodeCount * 15);

    fgRef.current.d3Force("link")?.distance(linkDistance);
    fgRef.current.d3Force("charge")?.strength(chargeStrength);
    fgRef.current.d3ReheatSimulation();
  }, [graphData]);

  return (
    <div className="w-full h-[700px]">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="label"
        nodeAutoColorBy="id"
        linkDirectionalArrowLength={18}
        linkDirectionalArrowRelPos={0.9}
        linkLabel={(link: GraphLink) => link.transactionHash}
        linkCurvature={(link: GraphLink) => {
          const i = link.curvatureIndex ?? 0;
          if (i === 0) return 0; // single link

          // totalLinks is estimated as the highest curvatureIndex + 1 per pair
          const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
          const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
          const allLinks = graphData.links.filter(l => {
            const lSource = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
            const lTarget = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
            return lSource === sourceId && lTarget === targetId;
          });
          const total = allLinks.length;

          if (total === 1) return 0;

          const mid = Math.floor(total / 2);
          const offset = i - mid;

          if (total % 2 === 1 && i === mid) return 0; // center straight for odd count

          const direction = offset < 0 ? -1 : 1;
          return direction * (0.15 + Math.abs(offset) * 0.15);
        }}
        linkWidth={2}
        // linkColor={() => "rgba(0, 0, 0, 0.7)"}
        linkColor={(link: GraphLink) => {
        const hues = [0, 60, 120, 180, 240, 300];
        const hue = hues[link.curvatureIndex ?? 0 % hues.length];
        return `hsl(${hue}, 100%, 50%)`;
}}
        // width={800}
        // height={700}
        width={window.innerWidth}
        height={window.innerHeight * 0.8}   
        nodeCanvasObject={(node, ctx, globalScale) => {
          const fontSize = Math.max(12 / globalScale, 8);
          const padding = 6;
          const n = node as GraphNode;
          if (typeof n.x !== 'number' || typeof n.y !== 'number') return;
          const label = (n.label ?? n.id) || "Unknown";
          const lines = [
            `📄 ${label.slice(0, 6)}...${label.slice(-4)}`,
            `Ξ ${n.balance || '0.0'}`,
            `Contract: ${n.isContract ? 'Yes' : 'No'}`,
          ];

          const boxWidth = 160;
          const lineHeight = fontSize + 4;
          const boxHeight = lines.length * lineHeight + padding * 2;

          ctx.save();
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(n.x - boxWidth / 2, n.y - boxHeight / 2, boxWidth, boxHeight);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'black';
          ctx.font = `${fontSize}px sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          lines.forEach((line, i) => {
            ctx.fillText(
              line,
              n.x! - boxWidth / 2 + padding,
              n.y! - boxHeight / 2 + padding + i * lineHeight
            );
          });
          ctx.restore();
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const fontSize = 12;
          const padding = 6;
          const lineHeight = fontSize + 4;
          const lines = 3;
          const boxWidth = 160;
          const boxHeight = lines * lineHeight + padding * 2;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.rect(node.x! - boxWidth / 2, node.y! - boxHeight / 2, boxWidth, boxHeight);
          ctx.fill();
        }}
        onNodeClick={(node) => {
          const address = (node as GraphNode).id;
          window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank');
        }}
        onLinkClick={(link) => {
          const txHash = (link as GraphLink).transactionHash;
          window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank');
        }}
      />
    </div>
  );
};
