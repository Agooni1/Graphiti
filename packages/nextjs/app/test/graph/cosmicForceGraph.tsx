"use client";
import { useEffect, useRef, useState } from "react";
import { GraphNode, GraphLink } from "../graph-data/types";

interface Props {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
}

export default function CosmicForceGraph({ graphData }: Props) {
  const fgRef = useRef<any>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadForceGraph = async () => {
      try {
        // Import ForceGraph2D directly from the main package
        const { ForceGraph2D: FG2D } = await import("react-force-graph");
        setForceGraph2D(() => FG2D);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load ForceGraph2D:", error);
        setIsLoading(false);
      }
    };
    loadForceGraph();
  }, []);

  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(1000, 50);
      }, 2000);
    }
  }, [graphData]);

  useEffect(() => {
    if (fgRef.current && ForceGraph2D) {
      const fg = fgRef.current;
      
      try {
        // Custom forces for galaxy distribution
        fg.d3Force('charge').strength(-200);
        fg.d3Force('link').distance(100).strength(0.1);
        fg.d3Force('center').strength(0.05);
      } catch (error) {
        console.warn("Could not set d3Force:", error);
      }
    }
  }, [graphData, ForceGraph2D]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{
        background: "radial-gradient(circle, #1a1a2e 0%, #0c0c0c 70%)"
      }}>
        <div className="text-white text-lg">Loading Cosmic Graph... 🌌</div>
      </div>
    );
  }

  if (!ForceGraph2D) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{
        background: "radial-gradient(circle, #1a1a2e 0%, #0c0c0c 70%)"
      }}>
        <div className="text-white text-lg">Graph unavailable - using fallback visualization</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{
      background: "radial-gradient(circle, #1a1a2e 0%, #0c0c0c 70%)",
      borderRadius: "12px",
      overflow: "hidden"
    }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        backgroundColor="transparent"
        
        // Cosmic node styling
        nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
          const balance = parseFloat(node.balance || '0');
          let color, size;
          
          if (node.isContract) {
            color = '#ff6b6b'; // Red giants (contracts)
            size = 6;
          } else if (balance > 10) {
            color = '#ffd93d'; // Gold stars (whales)
            size = 8;
          } else if (balance > 1) {
            color = '#74b9ff'; // Blue giants (medium)
            size = 5;
          } else {
            color = '#ffffff'; // White dwarfs (small)
            size = 4;
          }

          // Draw outer glow
          ctx.beginPath();
          const outerGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 4);
          outerGradient.addColorStop(0, `${color}40`); // 25% opacity
          outerGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = outerGradient;
          ctx.arc(node.x, node.y, size * 4, 0, 2 * Math.PI, false);
          ctx.fill();

          // Draw inner glow
          ctx.beginPath();
          const innerGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 2);
          innerGradient.addColorStop(0, `${color}80`); // 50% opacity
          innerGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = innerGradient;
          ctx.arc(node.x, node.y, size * 2, 0, 2 * Math.PI, false);
          ctx.fill();

          // Draw core node
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // Add subtle label for larger nodes
          if (globalScale > 1.5 && size > 5) {
            ctx.font = `${Math.max(10, size)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = color;
            ctx.fillText(node.label, node.x, node.y + size + 12);
          }
        }}
        
        // Cosmic link styling
        linkColor={() => 'rgba(97, 218, 251, 0.2)'}
        linkWidth={0.8}
        
        // Physics for galaxy distribution
        d3Force="charge" 
        d3ForceStrength={-200}
        linkDistance={100}
        
        // Interactions
        onNodeClick={(node: any) => {
          console.log('Clicked cosmic node:', node);
          window.open(`https://sepolia.etherscan.io/address/${node.id}`, "_blank");
          
          // Focus camera on clicked node
          if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(3, 1000);
          }
        }}
        
        onLinkClick={(link: any) => {
          console.log('Clicked cosmic link:', link);
          window.open(`https://sepolia.etherscan.io/tx/${link.transactionHash}`, "_blank");
        }}

        // Node hover effects
        onNodeHover={(node: any) => {
          if (node) {
            document.body.style.cursor = 'pointer';
          } else {
            document.body.style.cursor = 'default';
          }
        }}
        
        // Enhanced cosmic effects
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleColor={() => '#61dafb'}
        linkDirectionalParticleWidth={1.5}
        
        // Performance
        cooldownTicks={300}
        onEngineStop={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(1000, 50);
          }
        }}

        // Controls
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />
    </div>
  );
}