"use client";
import { useEffect, useRef, useState } from "react";
import { GraphNode, GraphLink } from "../graph-data/types";

interface Props {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  depth: number;
  galaxyLayer: 'core' | 'inner' | 'outer' | 'halo'; // Add galaxy layer info
}

export default function SimpleCosmicGraph({ graphData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [orbitRotation, setOrbitRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Initialize node positions in galaxy distribution
  useEffect(() => {
    if (!graphData.nodes.length) return;

    const positionedNodes: PositionedNode[] = graphData.nodes.map((node, index) => {
      const nodeCount = graphData.nodes.length;
      const normalizedIndex = index / nodeCount;
      
      // Determine galaxy layer based on node importance
      const balance = parseFloat(node.balance || '0');
      let galaxyLayer: 'core' | 'inner' | 'outer' | 'halo';
      let baseRadius: number;
      let heightVariation: number;
      
      if (node.isContract || balance > 10) {
        // High-value nodes go to galactic core
        galaxyLayer = 'core';
        baseRadius = 20 + Math.random() * 40;
        heightVariation = 10;
      } else if (balance > 1) {
        // Medium nodes in inner galaxy
        galaxyLayer = 'inner';
        baseRadius = 60 + Math.random() * 80;
        heightVariation = 25;
      } else if (balance > 0.1) {
        // Regular nodes in outer galaxy
        galaxyLayer = 'outer';
        baseRadius = 140 + Math.random() * 120;
        heightVariation = 40;
      } else {
        // Small nodes in galaxy halo
        galaxyLayer = 'halo';
        baseRadius = 260 + Math.random() * 140;
        heightVariation = 80;
      }

      // Create spiral arms (based on index for consistent positioning)
      const spiralArms = 3; // Number of spiral arms
      const armIndex = index % spiralArms;
      const nodeInArm = Math.floor(index / spiralArms);
      const totalNodesInArm = Math.ceil(nodeCount / spiralArms);
      
      // Spiral angle calculation
      const spiralTightness = 0.3; // How tight the spiral is
      const armAngleOffset = (armIndex * 2 * Math.PI) / spiralArms;
      const spiralAngle = armAngleOffset + (nodeInArm / totalNodesInArm) * spiralTightness * 4 * Math.PI;
      
      // Add some randomness to break perfect spiral
      const randomAngleOffset = (Math.random() - 0.5) * 0.8;
      const randomRadiusOffset = (Math.random() - 0.5) * baseRadius * 0.3;
      
      const finalAngle = spiralAngle + randomAngleOffset;
      const finalRadius = baseRadius + randomRadiusOffset;
      
      // Height based on distance from center (galaxy disk shape)
      const heightFactor = Math.exp(-finalRadius / 100); // Exponential falloff
      const height = (Math.random() - 0.5) * heightVariation * heightFactor;
      
      // Convert to 3D coordinates
      const x = finalRadius * Math.cos(finalAngle);
      const y = height;
      const z = finalRadius * Math.sin(finalAngle);
      
      return {
        ...node,
        x,
        y,
        z,
        screenX: 0,
        screenY: 0,
        depth: 0,
        galaxyLayer
      };
    });

    setNodes(positionedNodes);
  }, [graphData.nodes]);

  // Project 3D coordinates to 2D screen coordinates
  const project3DTo2D = (node: PositionedNode, rotX: number, rotY: number) => {
    // Apply orbital rotations
    const cosRotX = Math.cos(rotX);
    const sinRotX = Math.sin(rotX);
    const cosRotY = Math.cos(rotY);
    const sinRotY = Math.sin(rotY);

    // Rotate around X axis (vertical orbit)
    let y1 = node.y * cosRotX - node.z * sinRotX;
    let z1 = node.y * sinRotX + node.z * cosRotX;

    // Rotate around Y axis (horizontal orbit)
    let x2 = node.x * cosRotY + z1 * sinRotY;
    let z2 = -node.x * sinRotY + z1 * cosRotY;

    // Perspective projection
    const distance = 600; // Increased camera distance for better galaxy view
    const perspective = distance / (distance + z2);
    
    return {
      screenX: x2 * perspective,
      screenY: y1 * perspective,
      depth: z2,
      perspective: perspective
    };
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();

    let animationTime = 0;

    const animate = () => {
      animationTime += 0.01;
      
      const canvasWidth = canvas.width / window.devicePixelRatio;
      const canvasHeight = canvas.height / window.devicePixelRatio;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      // Create enhanced cosmic background with galaxy center glow
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvasWidth, canvasHeight) / 2);
      bgGradient.addColorStop(0, '#2a1810'); // Warm galaxy center
      bgGradient.addColorStop(0.3, '#1a1a2e');
      bgGradient.addColorStop(0.7, '#16213e');
      bgGradient.addColorStop(1, '#0c0c0c');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Project all nodes to 2D and sort by depth
      const projectedNodes = nodes.map(node => {
        const projected = project3DTo2D(node, orbitRotation.x, orbitRotation.y);
        return {
          ...node,
          screenX: projected.screenX,
          screenY: projected.screenY,
          depth: projected.depth,
          perspective: projected.perspective
        };
      }).sort((a, b) => a.depth - b.depth);

      // Apply transforms
      ctx.save();
      ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
      ctx.scale(zoom, zoom);

      // Draw galaxy dust/background first (for nodes far behind)
      projectedNodes.forEach(node => {
        if (node.depth < -300) {
          const dustOpacity = Math.max(0.02, Math.min(0.08, (600 + node.depth) / 1000));
          ctx.beginPath();
          ctx.fillStyle = `rgba(100, 150, 200, ${dustOpacity})`;
          ctx.arc(node.screenX, node.screenY, 0.5 / zoom, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw links (only for visible nodes)
      graphData.links.forEach(link => {
        const sourceNode = projectedNodes.find(n => n.id === link.source);
        const targetNode = projectedNodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode) {
          // Only draw links for nodes in front of camera
          if (sourceNode.depth > -500 && targetNode.depth > -500) {
            ctx.beginPath();
            
            // Enhanced link opacity based on galaxy layers
            const avgDepth = (sourceNode.depth + targetNode.depth) / 2;
            let baseOpacity = Math.max(0.1, Math.min(0.5, (500 + avgDepth) / 1000));
            
            // Boost opacity for core connections
            if (sourceNode.galaxyLayer === 'core' || targetNode.galaxyLayer === 'core') {
              baseOpacity *= 1.5;
            }
            
            ctx.strokeStyle = `rgba(97, 218, 251, ${baseOpacity})`;
            ctx.lineWidth = 1 / zoom;
            
            ctx.moveTo(sourceNode.screenX, sourceNode.screenY);
            ctx.lineTo(targetNode.screenX, targetNode.screenY);
            ctx.stroke();

            // Enhanced particles for core connections
            if (baseOpacity > 0.25) {
              const particlePos = (animationTime * 0.5) % 1;
              const px = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * particlePos;
              const py = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * particlePos;
              
              ctx.beginPath();
              ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                `rgba(255, 215, 100, ${baseOpacity})` : 
                `rgba(97, 218, 251, ${baseOpacity})`;
              ctx.arc(px, py, 1.5 / zoom, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      });

      // Draw nodes with galaxy-appropriate styling
      projectedNodes.forEach(node => {
        if (node.depth > -500) {
          const balance = parseFloat(node.balance || '0');
          let color, baseSize, glowIntensity;
          
          // Enhanced colors based on galaxy layer
          switch (node.galaxyLayer) {
            case 'core':
              color = node.isContract ? '#ff6b6b' : '#ffd93d'; // Red giants or bright stars
              baseSize = 8;
              glowIntensity = 1.5;
              break;
            case 'inner':
              color = '#74b9ff'; // Blue giants
              baseSize = 6;
              glowIntensity = 1.2;
              break;
            case 'outer':
              color = '#ffffff'; // Main sequence stars
              baseSize = 4;
              glowIntensity = 1.0;
              break;
            case 'halo':
              color = '#a0a0a0'; // Dim halo stars
              baseSize = 3;
              glowIntensity = 0.7;
              break;
          }

          // Scale size based on perspective and zoom
          const size = (baseSize * node.perspective) / zoom;
          
          // Enhanced depth-based opacity
          const depthOpacity = Math.max(0.2, Math.min(1, (500 + node.depth) / 700));
          
          // Galaxy rotation effect (subtle)
          const rotationPhase = animationTime * 0.1 + (node.x + node.z) * 0.001;
          const pulse = Math.sin(rotationPhase) * 0.2 + 1;

          // Enhanced glow based on galaxy layer
          const glowSize = size * 4 * glowIntensity;
          const glowGradient = ctx.createRadialGradient(
            node.screenX, node.screenY, 0, 
            node.screenX, node.screenY, glowSize
          );
          
          const glowOpacity = depthOpacity * 0.8;
          glowGradient.addColorStop(0, `${color}${Math.floor(glowOpacity * 255).toString(16).padStart(2, '0')}`);
          glowGradient.addColorStop(0.5, `${color}${Math.floor(glowOpacity * 100).toString(16).padStart(2, '0')}`);
          glowGradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, glowSize * pulse, 0, 2 * Math.PI);
          ctx.fill();

          // Draw core
          ctx.fillStyle = `${color}${Math.floor(depthOpacity * 255).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, size, 0, 2 * Math.PI);
          ctx.fill();

          // Enhanced labels for core objects
          if (zoom > 1.2 && depthOpacity > 0.6 && node.galaxyLayer === 'core') {
            ctx.font = `${14 / zoom}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = `${color}${Math.floor(depthOpacity * 200).toString(16).padStart(2, '0')}`;
            ctx.fillText(node.label ?? "", node.screenX, node.screenY + size + 18 / zoom);
          }
        }
      });

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, graphData.links, panOffset, orbitRotation, zoom]);

  // Mouse event handlers (same as before)
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setLastMousePos({ x: event.clientX, y: event.clientY });

    if (event.button === 2) {
      setIsOrbiting(true);
    } else {
      setIsDragging(true);
      setDragOffset({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isOrbiting) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      
      const sensitivity = 0.01;
      setOrbitRotation(prev => ({
        x: prev.x + deltaY * sensitivity,
        y: prev.y + deltaX * sensitivity
      }));
      
      setLastMousePos({ x: event.clientX, y: event.clientY });
    } else if (isDragging) {
      setPanOffset({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsOrbiting(false);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || isOrbiting) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const worldX = (canvasX - centerX - panOffset.x) / zoom;
    const worldY = (canvasY - centerY - panOffset.y) / zoom;

    const projectedNodes = nodes.map(node => ({
      ...node,
      ...project3DTo2D(node, orbitRotation.x, orbitRotation.y)
    }));

    const clickedNode = projectedNodes.find(node => {
      if (node.depth > -500) {
        const dx = worldX - node.screenX;
        const dy = worldY - node.screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 15;
      }
      return false;
    });

    if (clickedNode) {
      console.log('Clicked node:', clickedNode);
      window.open(`https://sepolia.etherscan.io/address/${clickedNode.id}`, "_blank");
    }
  };

  const resetView = () => {
    setPanOffset({ x: 0, y: 0 });
    setOrbitRotation({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ borderRadius: "12px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
      />
      
      {/* Enhanced Controls */}
      <div className="absolute top-4 left-4 text-white text-sm opacity-70">
        🌌 Galaxy View ({graphData.nodes.length} nodes, {graphData.links.length} links)
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={resetView}
          className="btn btn-xs btn-ghost text-white hover:bg-white/20"
        >
          Reset Orbit
        </button>
        <div className="text-white text-xs opacity-70">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-white text-xs opacity-50">
        Left-drag: pan • Right-drag: orbit • Scroll: zoom • Click nodes to open
      </div>

      {/* Galaxy Layer Legend */}
      <div className="absolute bottom-4 right-4 text-white text-xs opacity-60">
        <div className="flex gap-3">
          <span>🔴 Contracts</span>
          <span>🟡 Whales</span>
          <span>🔵 Active</span>
          <span>⚪ Regular</span>
        </div>
      </div>
    </div>
  );
}