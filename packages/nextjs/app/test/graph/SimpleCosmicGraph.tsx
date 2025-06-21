"use client";
import { useEffect, useRef, useState } from "react";
import { GraphNode, GraphLink } from "../graph-data/types";
import { generateLayout, shouldRegenerateLayout, LayoutConfig, PositionedNode } from './graphLayouts';

// Extend the Window interface to include customSetTarget
declare global {
  interface Window {
    customSetTarget?: (address: string) => void;
  }
}

interface NodePopupData {
  node: PositionedNode;
  x: number;
  y: number;
}

interface Props {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  onSetTarget?: (address: string) => void;
  isFullscreen?: boolean;
  targetNode?: string; // Add this prop
}

export default function SimpleCosmicGraph({ graphData, onSetTarget, isFullscreen = false, targetNode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [isAutoOrbiting, setIsAutoOrbiting] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [orbitRotation, setOrbitRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [particleMode, setParticleMode] = useState<'pulse' | 'laser'>('pulse');
  const [isHovered, setIsHovered] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'shell' | 'force' | 'fibonacci'>('shell');
  const [nodePopup, setNodePopup] = useState<NodePopupData | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  // Add target node state and find target node
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);

  // Enhanced resize handler that uses direct window dimensions in fullscreen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      let newWidth, newHeight;
      
      if (isFullscreen) {
        // In fullscreen, use window dimensions directly
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;
      } else {
        // Normal mode, use container dimensions
        const rect = canvas.getBoundingClientRect();
        newWidth = rect.width;
        newHeight = rect.height;
      }
      
      // Only update if size actually changed
      if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
        // console.log(`Canvas resizing: ${newWidth}x${newHeight} (fullscreen: ${isFullscreen})`);
        setCanvasSize({ width: newWidth, height: newHeight });
        
        canvas.width = newWidth * window.devicePixelRatio;
        canvas.height = newHeight * window.devicePixelRatio;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    };

    // Initial size update
    updateCanvasSize();

    // Set up ResizeObserver for normal mode
    if (!isFullscreen) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserverRef.current.observe(canvas);
    }

    // Window resize listener for fullscreen mode
    const handleWindowResize = () => {
      if (isFullscreen) {
        updateCanvasSize();
      }
    };

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setTimeout(updateCanvasSize, 100);
    };

    window.addEventListener('resize', handleWindowResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleWindowResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [canvasSize.width, canvasSize.height, isFullscreen]);

  // Force resize when fullscreen prop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Force immediate resize when fullscreen state changes
    const updateSize = () => {
      let newWidth, newHeight;
      
      if (isFullscreen) {
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;
      } else {
        const rect = canvas.getBoundingClientRect();
        newWidth = rect.width;
        newHeight = rect.height;
      }
      
      // console.log(`Force resize for fullscreen change: ${newWidth}x${newHeight}`);
      setCanvasSize({ width: newWidth, height: newHeight });
      
      canvas.width = newWidth * window.devicePixelRatio;
      canvas.height = newHeight * window.devicePixelRatio;
      canvas.style.width = newWidth + 'px';
      canvas.style.height = newHeight + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    // Multiple attempts to ensure resize happens
    updateSize();
    setTimeout(updateSize, 50);
    setTimeout(updateSize, 150);
    setTimeout(updateSize, 300);
  }, [isFullscreen]);

  // Initialize node positions using the layout generator
  useEffect(() => {
    if (!graphData.nodes.length || !targetNodeId) return;

    const newConfig: LayoutConfig = {
      layoutMode,
      targetNodeId,
      graphData
    };

    // Only regenerate if configuration changed
    if (shouldRegenerateLayout(layoutConfig, newConfig)) {
      // console.log('Generating layout with config:', newConfig);
      const positionedNodes = generateLayout(newConfig);
      setNodes(positionedNodes);
      setLayoutConfig(newConfig);
    }
  }, [graphData.nodes, layoutMode, targetNodeId, layoutConfig]);

  // Project 3D coordinates to 2D screen coordinates
  const project3DTo2D = (node: PositionedNode, rotX: number, rotY: number) => {
    // Use node coordinates directly since target is already at origin
    const offsetX = node.x;
    const offsetY = node.y;
    const offsetZ = node.z;

    const cosRotX = Math.cos(rotX);
    const sinRotX = Math.sin(rotX);
    const cosRotY = Math.cos(rotY);
    const sinRotY = Math.sin(rotY);

    let y1 = offsetY * cosRotX - offsetZ * sinRotX;
    let z1 = offsetY * sinRotX + offsetZ * cosRotX;

    let x2 = offsetX * cosRotY + z1 * sinRotY;
    let z2 = -offsetX * sinRotY + z1 * cosRotY;

    const distance = 600;
    const perspective = distance / (distance + z2);
    
    return {
      screenX: x2 * perspective,
      screenY: y1 * perspective,
      depth: z2,
      perspective: perspective
    };
  };

  // Animation loop - updated to use canvasSize state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationTime = 0;
    let lastFrameTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime) / 1000;
      animationTime += deltaTime * 0.6;
      lastFrameTime = currentTime;
      
      // AUTO-ORBIT: Update rotation if auto-orbiting is enabled
      if (isAutoOrbiting && !isDragging && !isOrbiting) {
        setOrbitRotation(prev => ({
          x: prev.x + deltaTime * 0.15,
          y: prev.y + deltaTime * 0.25
        }));
      }
      
      // Use the stored canvas size
      const canvasWidth = canvasSize.width;
      const canvasHeight = canvasSize.height;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      // Clear canvas with proper dimensions
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // Create enhanced cosmic background with galaxy center glow
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvasWidth, canvasHeight) / 2);
      bgGradient.addColorStop(0, '#2a1810');
      bgGradient.addColorStop(0.3, '#1a1a2e');
      bgGradient.addColorStop(0.7, '#16213e');
      bgGradient.addColorStop(1, '#0c0c0c');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Find the target node by id
      const targetNode = nodes.find(n => n.id === targetNodeId);

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
                particlePos = (animationTime * 0.5) % 1;
              } else {
                const linkSpeed = 1.2 + (linkIndex * 0.2) % 0.8;
                const linkOffset = (linkIndex * 0.7) % 1;
                particlePos = (animationTime * linkSpeed + linkOffset) % 1;
              }
              
              const px = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * particlePos;
              const py = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * particlePos;
              
              if (particleMode === 'laser') {
                const numParticles = 2;
                for (let i = 0; i < numParticles; i++) {
                  const trailOffset = i * 0.15;
                  const trailPos = (particlePos - trailOffset + 1) % 1;
                  if (trailPos >= 0 && trailPos <= 1) {
                    const trailPx = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * trailPos;
                    const trailPy = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * trailPos;
                    const trailOpacity = baseOpacity * (1 - i * 0.4);
                    
                    ctx.beginPath();
                    ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                      `rgba(255, 100, 100, ${trailOpacity})` : 
                      `rgba(100, 255, 255, ${trailOpacity})`;
                    ctx.arc(trailPx, trailPy, (2 - i * 0.5) / zoom, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                }
              } else {
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

          if (zoom > 1.2 && depthOpacity > 0.6) {
            ctx.font = `${14 / zoom}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = `${color}${Math.floor(depthOpacity * 200).toString(16).padStart(2, '0')}`;
            ctx.fillText(node.label ?? "", node.screenX, node.screenY + size + 18 / zoom);
          }
        }
      });

      // Enhanced target node indicator
      projectedNodes.forEach(node => {
        if (targetNode && node.id === targetNodeId) {
          // Target node indicator removed - functionality preserved
        }
      });

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, graphData.links, panOffset, orbitRotation, zoom, particleMode, isAutoOrbiting, isDragging, isOrbiting, canvasSize]);

  // Mouse event handlers
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

  // Native wheel event listener to prevent browser scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isHovered) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [isHovered, setZoom]);

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

    // Find the target node by id
    const targetNode = nodes.find(n => n.id === targetNodeId);

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
      setNodePopup({
        node: clickedNode,
        x: canvasX,
        y: canvasY
      });
    } else {
      setNodePopup(null);
    }
  };

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      const target = event.target as Element;
      
      if (nodePopup) {
        const popupElement = target.closest('.node-popup');
        if (popupElement) {
          return;
        }
      }
      
      if (canvas && !canvas.contains(target)) {
        setNodePopup(null);
      }
    };

    if (nodePopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [nodePopup]);

  const formatBalance = (balance: string | undefined): string => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return num.toExponential(2);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    return (num / 1000000).toFixed(1) + 'M';
  };

  // Add a unified function to handle ALL target changes
  const handleTargetChange = (newTargetId: string, source: string = '') => {
    console.log(`Setting new target from ${source}:`, newTargetId);
    setTargetNodeId(newTargetId);
    
    // Always notify parent component of the change (unless it came FROM the parent)
    if (onSetTarget && source !== 'prop') {
      onSetTarget(newTargetId);
    }
    
    // Close any open popup
    setNodePopup(null);
  };

  // Update the targetNode prop handling to use unified function
  useEffect(() => {
    if (targetNode && targetNode !== targetNodeId) {
      console.log('External prop setting target node:', targetNode);
      handleTargetChange(targetNode, 'prop');
    }
  }, [targetNode, targetNodeId]);

  // Update the fallback logic to use unified function
  useEffect(() => {
    if (graphData.nodes.length > 0 && !targetNodeId && !targetNode) {
      const fallbackNodeId = graphData.nodes[0].id;
      console.log('Setting fallback target node:', fallbackNodeId);
      handleTargetChange(fallbackNodeId, 'fallback');
    }
  }, [graphData.nodes, targetNodeId, targetNode]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          isHovered ? 'ring-2 ring-blue-400 ring-opacity-30' : ''
        }`}
        style={{ 
          borderRadius: isFullscreen ? "0px" : "12px",
          // Force exact dimensions in fullscreen
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : '100%'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
      />
      
      {/* Enhanced Controls */}
      <div className="absolute top-4 left-4 text-white text-sm opacity-70">
        🌌 Galaxy View ({graphData.nodes.length} nodes, {graphData.links.length} links)
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Layout Mode Toggle */}
        <div className="btn-group">
          <button
            className={`btn btn-xs ${layoutMode === 'shell' ? 'btn-secondary' : 'btn-ghost'} text-white`}
            onClick={() => setLayoutMode('shell')}
            title="Shell-based layout"
          >
            🌌 Shell
          </button>
          <button
            className={`btn btn-xs ${layoutMode === 'force' ? 'btn-secondary' : 'btn-ghost'} text-white`}
            onClick={() => setLayoutMode('force')}
            title="Force-directed layout"
          >
            ⚡ Force
          </button>
          <button
            className={`btn btn-xs ${layoutMode === 'fibonacci' ? 'btn-secondary' : 'btn-ghost'} text-white`}
            onClick={() => setLayoutMode('fibonacci')}
            title="Fibonacci spiral layout"
          >
            🌀 Spiral
          </button>
        </div>

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

        {/* Auto-orbit button */}
        <button
          className={`btn btn-xs ${isAutoOrbiting ? 'btn-accent' : 'btn-ghost'} text-white`}
          onClick={() => setIsAutoOrbiting(prev => !prev)}
          title={isAutoOrbiting ? "Stop auto-orbit" : "Start auto-orbit"}
        >
          {isAutoOrbiting ? '⏸️' : '🪐'} Orbit
        </button>
        
        <button
          onClick={() => {
            setPanOffset({ x: 0, y: 0 });
            setOrbitRotation({ x: 0, y: 0 });
            setZoom(1);
            // Keep the target node centered
          }}
          className="btn btn-xs btn-ghost text-white hover:bg-white/20"
        >
          Reset Orbit
        </button>
        <div className="text-white text-xs opacity-70">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-white text-xs opacity-50">
        {isHovered ? (
          "🎯 Hover active • Scroll to zoom • Left-drag: pan • Right-drag: orbit"
        ) : (
          "Hover over graph to enable zoom • Left-drag: pan • Right-drag: orbit"
        )}
      </div>

      {/* Node Popup - preserved exactly as it was */}
      {nodePopup && (
        <div 
          className="absolute z-50 pointer-events-auto node-popup"
          style={{ 
            left: Math.min(nodePopup.x, (isFullscreen ? window.innerWidth : canvasSize.width) - 220),
            top: Math.max(10, Math.min(nodePopup.y - 80, (isFullscreen ? window.innerHeight : canvasSize.height) - 160))
          }}
        >
          {/* Cosmic-themed popup with glow effect */}
          <div 
            className="relative rounded-lg shadow-2xl p-3 w-[200px] border"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(42, 24, 16, 0.95) 100%)',
              borderColor: 'rgba(97, 218, 251, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 30px rgba(97, 218, 251, 0.2), 0 0 60px rgba(97, 218, 251, 0.1)'
            }}
          >
            {/* Cosmic header with enhanced glow indicator */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: 'rgba(97, 218, 251, 0.2)' }}>
              {(() => {
                const balance = parseFloat(nodePopup.node.balance || '0');
                let indicatorColor;
                
                switch (nodePopup.node.galaxyLayer) {
                  case 'core':
                    indicatorColor = nodePopup.node.isContract ? '#ff6b6b' : '#ffd93d';
                    break;
                  case 'inner':
                    indicatorColor = '#74b9ff';
                    break;
                  case 'outer':
                    indicatorColor = '#ffffff';
                    break;
                  case 'halo':
                    indicatorColor = '#a0a0a0';
                    break;
                  default:
                    indicatorColor = '#a0a0a0';
                }

                return (
                  <div 
                    className="w-2 h-2 rounded-full relative"
                    style={{ 
                      backgroundColor: indicatorColor,
                      boxShadow: `0 0 8px ${indicatorColor}, 0 0 16px ${indicatorColor}40`
                    }}
                  >
                    {/* Pulsing glow effect */}
                    <div 
                      className="absolute inset-0 w-2 h-2 rounded-full animate-pulse"
                      style={{ 
                        backgroundColor: indicatorColor,
                        filter: 'blur(1px)',
                        opacity: 0.6
                      }}
                    />
                  </div>
                );
              })()}
              
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: '#e1e5f2' }}>
                  {nodePopup.node.isContract ? '📋' : '👤'} {nodePopup.node.id.slice(0, 6)}...{nodePopup.node.id.slice(-4)}
                </div>
              </div>
              <button
                onClick={() => setNodePopup(null)}
                className="btn btn-ghost btn-xs btn-circle p-0 min-h-4 h-4 w-4 hover:bg-white/10"
                style={{ color: 'rgba(225, 229, 242, 0.5)' }}
              >
                ✕
              </button>
            </div>

            {/* Enhanced balance section */}
            <div className="mb-3">
              <div className="text-[10px] mb-1" style={{ color: 'rgba(97, 218, 251, 0.7)' }}>
                Balance
              </div>
              <div 
                className="text-sm font-bold"
                style={{ 
                  color: '#e1e5f2',
                  textShadow: '0 0 10px rgba(97, 218, 251, 0.5)'
                }}
              >
                {formatBalance(nodePopup.node.balance)} ETH
              </div>
            </div>

            {/* Cosmic stats grid */}
            <div className="grid grid-cols-2 gap-1 mb-3 text-[10px]">
              <div 
                className="rounded p-1.5 border"
                style={{
                  background: 'rgba(97, 218, 251, 0.05)',
                  borderColor: 'rgba(97, 218, 251, 0.2)'
                }}
              >
                <div style={{ color: 'rgba(97, 218, 251, 0.7)' }}>Type</div>
                <div className="font-semibold text-xs" style={{ color: '#e1e5f2' }}>
                  {nodePopup.node.isContract ? 'Contract' : 'Wallet'}
                </div>
              </div>
              <div 
                className="rounded p-1.5 border"
                style={{
                  background: 'rgba(97, 218, 251, 0.05)',
                  borderColor: 'rgba(97, 218, 251, 0.2)'
                }}
              >
                <div style={{ color: 'rgba(97, 218, 251, 0.7)' }}>Links</div>
                <div className="font-semibold text-xs" style={{ color: '#e1e5f2' }}>
                  {graphData.links.filter(link => 
                    link.source === nodePopup.node.id || link.target === nodePopup.node.id
                  ).length}
                </div>
              </div>
            </div>

            {/* Cosmic action buttons */}
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://sepolia.etherscan.io/address/${nodePopup.node.id}`, "_blank");
                }}
                className="flex-1 text-[10px] h-6 rounded transition-all duration-200 font-medium cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(97, 218, 251, 0.8) 0%, rgba(116, 185, 255, 0.8) 100%)',
                  color: '#0a0a0a',
                  border: '1px solid rgba(97, 218, 251, 0.5)',
                  boxShadow: '0 0 10px rgba(97, 218, 251, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(97, 218, 251, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(97, 218, 251, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔗 Scan
              </button>
              
              {onSetTarget && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTargetChange(nodePopup.node.id, 'user-click');
                  }}
                  className="flex-1 text-[10px] h-6 rounded transition-all duration-200 font-medium cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 215, 100, 0.8) 0%, rgba(255, 107, 107, 0.8) 100%)',
                    color: '#0a0a0a',
                    border: '1px solid rgba(255, 215, 100, 0.5)',
                    boxShadow: '0 0 10px rgba(255, 215, 100, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 100, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 215, 100, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🎯 Target
                </button>
              )}
            </div>

            {/* Subtle cosmic border glow */}
            <div 
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(97, 218, 251, 0.1) 50%, transparent 100%)',
                zIndex: -1
              }}
            />
          </div>
        </div>
      )}

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
// fix whale/active/regular definitons.. Im seeign wahles withzero to no baalnce
// move on to contract/nft stuff we've done enough
// Prob remove graph depth for now