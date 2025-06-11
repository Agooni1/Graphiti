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
  galaxyLayer: 'core' | 'inner' | 'outer' | 'halo';
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
  const [particleMode, setParticleMode] = useState<'pulse' | 'laser'>('pulse'); // Add particle mode toggle

  // Initialize node positions in electron-like orbital shells
  useEffect(() => {
    if (!graphData.nodes.length) return;

    const positionedNodes: PositionedNode[] = graphData.nodes.map((node, index) => {
      // Determine orbital shell based on node importance
      const balance = parseFloat(node.balance || '0');
      let galaxyLayer: 'core' | 'inner' | 'outer' | 'halo';
      let shellRadius: number;
      let shellThickness: number;
      
      if (node.isContract || balance > 10) {
        galaxyLayer = 'core';
        shellRadius = 40;
        shellThickness = 20;
      } else if (balance > 1) {
        galaxyLayer = 'inner';
        shellRadius = 100;
        shellThickness = 30;
      } else if (balance > 0.1) {
        galaxyLayer = 'outer';
        shellRadius = 180;
        shellThickness = 40;
      } else {
        galaxyLayer = 'halo';
        shellRadius = 280;
        shellThickness = 60;
      }

      // Create orbital patterns within each shell
      const numOrbitals = Math.ceil(Math.sqrt(index + 1));
      const orbitalIndex = index % numOrbitals;
      
      const orbitalTilt = (orbitalIndex / numOrbitals) * Math.PI;
      const orbitalRotation = Math.random() * 2 * Math.PI;
      
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const radiusInShell = shellRadius + (Math.random() - 0.5) * shellThickness;
      
      let x = radiusInShell * Math.sin(phi) * Math.cos(theta);
      let y = radiusInShell * Math.sin(phi) * Math.sin(theta);
      let z = radiusInShell * Math.cos(phi);
      
      const cosT = Math.cos(orbitalTilt);
      const sinT = Math.sin(orbitalTilt);
      const cosR = Math.cos(orbitalRotation);
      const sinR = Math.sin(orbitalRotation);
      
      const y1 = y * cosT - z * sinT;
      const z1 = y * sinT + z * cosT;
      
      const x2 = x * cosR + z1 * sinR;
      const z2 = -x * sinR + z1 * cosR;
      
      return {
        ...node,
        x: x2,
        y: y1,
        z: z2,
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
    const cosRotX = Math.cos(rotX);
    const sinRotX = Math.sin(rotX);
    const cosRotY = Math.cos(rotY);
    const sinRotY = Math.sin(rotY);

    let y1 = node.y * cosRotX - node.z * sinRotX;
    let z1 = node.y * sinRotX + node.z * cosRotX;

    let x2 = node.x * cosRotY + z1 * sinRotY;
    let z2 = -node.x * sinRotY + z1 * cosRotY;

    const distance = 600;
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
      bgGradient.addColorStop(0, '#2a1810');
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

      // Draw galaxy dust/background first
      projectedNodes.forEach(node => {
        if (node.depth < -300) {
          const dustOpacity = Math.max(0.02, Math.min(0.08, (600 + node.depth) / 1000));
          ctx.beginPath();
          ctx.fillStyle = `rgba(100, 150, 200, ${dustOpacity})`;
          ctx.arc(node.screenX, node.screenY, 0.5 / zoom, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw links with enhanced particle system
      graphData.links.forEach((link, linkIndex) => {
        const sourceNode = projectedNodes.find(n => n.id === link.source);
        const targetNode = projectedNodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNode) {
          if (sourceNode.depth > -500 && targetNode.depth > -500) {
            ctx.beginPath();
            
            const avgDepth = (sourceNode.depth + targetNode.depth) / 2;
            let baseOpacity = Math.max(0.1, Math.min(0.5, (500 + avgDepth) / 1000));
            
            if (sourceNode.galaxyLayer === 'core' || targetNode.galaxyLayer === 'core') {
              baseOpacity *= 1.5;
            }
            
            ctx.strokeStyle = `rgba(97, 218, 251, ${baseOpacity})`;
            ctx.lineWidth = 1 / zoom;
            
            ctx.moveTo(sourceNode.screenX, sourceNode.screenY);
            ctx.lineTo(targetNode.screenX, targetNode.screenY);
            ctx.stroke();

            // Enhanced particle system with mode toggle
            if (baseOpacity > 0.25) {
              let particlePos;
              
              if (particleMode === 'pulse') {
                // Synchronized pulse mode (original)
                particlePos = (animationTime * 0.5) % 1;
              } else {
                // Laser mode - slower, asynchronous particles
                const linkSpeed = 1.2 + (linkIndex * 0.2) % 0.8; // Slower speeds: 1.2-2.0x instead of 3-5x
                const linkOffset = (linkIndex * 0.7) % 1; // Different starting positions
                particlePos = (animationTime * linkSpeed + linkOffset) % 1;
              }
              
              const px = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * particlePos;
              const py = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * particlePos;
              
              // Different particle effects based on mode
              if (particleMode === 'laser') {
                // Laser mode: Multiple particles with trail effect (slower)
                const numParticles = 2; // Reduced from 3 to 2 particles
                for (let i = 0; i < numParticles; i++) {
                  const trailOffset = i * 0.15; // Increased spacing between trail particles
                  const trailPos = (particlePos - trailOffset + 1) % 1;
                  if (trailPos >= 0 && trailPos <= 1) {
                    const trailPx = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * trailPos;
                    const trailPy = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * trailPos;
                    const trailOpacity = baseOpacity * (1 - i * 0.4); // Slightly more fade
                    
                    ctx.beginPath();
                    ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                      `rgba(255, 100, 100, ${trailOpacity})` : 
                      `rgba(100, 255, 255, ${trailOpacity})`;
                    ctx.arc(trailPx, trailPy, (2 - i * 0.5) / zoom, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                }
              } else {
                // Pulse mode: Single synchronized particle (original)
                ctx.beginPath();
                ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                  `rgba(255, 215, 100, ${baseOpacity})` : 
                  `rgba(97, 218, 251, ${baseOpacity})`;
                ctx.arc(px, py, 1.5 / zoom, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          }
        }
      });

      // Draw nodes with galaxy-appropriate styling
      projectedNodes.forEach(node => {
        if (node.depth > -500) {
          const balance = parseFloat(node.balance || '0');
          let color, baseSize, glowIntensity;
          
          switch (node.galaxyLayer) {
            case 'core':
              color = node.isContract ? '#ff6b6b' : '#ffd93d';
              baseSize = 8;
              glowIntensity = 1.5;
              break;
            case 'inner':
              color = '#74b9ff';
              baseSize = 6;
              glowIntensity = 1.2;
              break;
            case 'outer':
              color = '#ffffff';
              baseSize = 4;
              glowIntensity = 1.0;
              break;
            case 'halo':
              color = '#a0a0a0';
              baseSize = 3;
              glowIntensity = 0.7;
              break;
          }

          const size = (baseSize * node.perspective) / zoom;
          const depthOpacity = Math.max(0.2, Math.min(1, (500 + node.depth) / 700));
          
          const rotationPhase = animationTime * 0.1 + (node.x + node.z) * 0.001;
          const pulse = Math.sin(rotationPhase) * 0.2 + 1;

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

          ctx.fillStyle = `${color}${Math.floor(depthOpacity * 255).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, size, 0, 2 * Math.PI);
          ctx.fill();

          // Clean labels for ALL nodes
          if (zoom > 1.2 && depthOpacity > 0.6) {
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
  }, [nodes, graphData.links, panOffset, orbitRotation, zoom, particleMode]); // Add particleMode to dependencies

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
        {/* Particle Mode Toggle */}
        <div className="btn-group">
          <button
            className={`btn btn-xs ${particleMode === 'pulse' ? 'btn-primary' : 'btn-ghost'} text-white`}
            onClick={() => setParticleMode('pulse')}
          >
            🌊 Pulse
          </button>
          <button
            className={`btn btn-xs ${particleMode === 'laser' ? 'btn-primary' : 'btn-ghost'} text-white`}
            onClick={() => setParticleMode('laser')}
          >
            ⚡ Laser
          </button>
        </div>
        
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

      {/* Enhanced Legend */}
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

//TODO:
// Control laser speed (maybe have to add functionality to filter and pass as param)
// fix layout issues - zoom/scroll overlapping
// I think make center red, contracts maybe purple?
// Add more visual effects for different node types (idk ai generated)
// and ofc add layer/children