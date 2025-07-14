"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GraphLink, GraphNode } from "../graph-data/types";
import FullscreenButton from "./_components/FullscreenButton";
import NodePopup from "./_components/NodePopup";
import { LayoutConfig, PositionedNode, generateLayout, shouldRegenerateLayout } from "./graphLayouts";

interface NodePopupData {
  node: PositionedNode;
  x: number;
  y: number;
}

interface ViewState {
  zoom: number;
  panOffset: { x: number; y: number };
  orbitRotation: { x: number; y: number };
}

interface Props {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  onSetTarget?: (address: string) => void;
  isFullscreen?: boolean;
  targetNode?: string;
  layoutMode: "shell" | "force" | "fibonacci";
  particleMode: "pulse" | "laser" | "off";
  isAutoOrbiting: boolean;
  onFullscreenToggle: () => void;
  resetViewRef?: React.RefObject<(() => void) | null>;
  onViewStateChange?: (viewState: ViewState) => void;
  showNodeLabels?: boolean; // Add this prop
  selectedChain: "ethereum" | "sepolia" | "arbitrum" | "base";
}

export default function SimpleCosmicGraph({
  graphData,
  onSetTarget,
  isFullscreen = false,
  targetNode,
  layoutMode,
  particleMode,
  isAutoOrbiting,
  onFullscreenToggle,
  resetViewRef,
  onViewStateChange,
  showNodeLabels = true,
  selectedChain,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [nodes, setNodes] = useState<PositionedNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const orbitRotationRef = useRef({ x: 0, y: 0 });
  const [orbitRotation, setOrbitRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [nodePopup, setNodePopup] = useState<NodePopupData | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
  const animationTimeRef = useRef(0);

  // Create the actual reset function and assign it to the ref
  useEffect(() => {
    const resetView = () => {
      console.log("Graph reset function called - resetting view!");
      setPanOffset({ x: 0, y: 0 });
      setOrbitRotation({ x: 0, y: 0 });
      orbitRotationRef.current = { x: 0, y: 0 };
      setZoom(1);
    };

    // Assign the reset function to the ref if it exists
    if (resetViewRef) {
      resetViewRef.current = resetView;
    }

    // Cleanup function
    return () => {
      if (resetViewRef) {
        resetViewRef.current = null;
      }
    };
  }, [resetViewRef]);

  // Enhanced resize handler that uses direct window dimensions in fullscreen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      let newWidth, newHeight;

      if (isFullscreen) {
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;
      } else {
        const rect = canvas.getBoundingClientRect();
        newWidth = rect.width;
        newHeight = rect.height;
      }

      // Add reasonable size constraints
      const MIN_SIZE = 200; // Minimum usable size
      const MAX_SIZE = 3840; // 4K width limit for performance

      newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth));
      newHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight));

      if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
        setCanvasSize({ width: newWidth, height: newHeight });

        // Also clamp the actual canvas buffer size for performance
        const maxBufferSize = 2560; // Reasonable buffer limit
        const bufferWidth = Math.min(newWidth * window.devicePixelRatio, maxBufferSize);
        const bufferHeight = Math.min(newHeight * window.devicePixelRatio, maxBufferSize);

        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
        canvas.style.width = newWidth + "px";
        canvas.style.height = newHeight + "px";

        const ctx = canvas.getContext("2d");
        if (ctx) {
          const scaleX = bufferWidth / newWidth;
          const scaleY = bufferHeight / newHeight;
          ctx.scale(scaleX, scaleY);
        }
      }
    };

    updateCanvasSize();

    if (!isFullscreen) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserverRef.current.observe(canvas);
    }

    const handleWindowResize = () => {
      if (isFullscreen) {
        updateCanvasSize();
      }
    };

    const handleFullscreenChange = () => {
      setTimeout(updateCanvasSize, 100);
    };

    window.addEventListener("resize", handleWindowResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener("resize", handleWindowResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [canvasSize.width, canvasSize.height, isFullscreen]);

  // Force resize when fullscreen prop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

      setCanvasSize({ width: newWidth, height: newHeight });

      canvas.width = newWidth * window.devicePixelRatio;
      canvas.height = newHeight * window.devicePixelRatio;
      canvas.style.width = newWidth + "px";
      canvas.style.height = newHeight + "px";

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

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
      graphData,
    };

    if (shouldRegenerateLayout(layoutConfig, newConfig)) {
      const positionedNodes = generateLayout(newConfig);
      setNodes(positionedNodes);
      setLayoutConfig(newConfig);
    }
  }, [graphData, layoutMode, targetNodeId, layoutConfig]);

  // Project 3D coordinates to 2D screen coordinates
  const project3DTo2D = (node: PositionedNode, rotX: number, rotY: number) => {
    const offsetX = node.x;
    const offsetY = node.y;
    const offsetZ = node.z;

    const cosRotX = Math.cos(rotX);
    const sinRotX = Math.sin(rotX);
    const cosRotY = Math.cos(rotY);
    const sinRotY = Math.sin(rotY);

    const y1 = offsetY * cosRotX - offsetZ * sinRotX;
    const z1 = offsetY * sinRotX + offsetZ * cosRotX;

    const x2 = offsetX * cosRotY + z1 * sinRotY;
    const z2 = -offsetX * sinRotY + z1 * cosRotY;

    const distance = 600;
    const perspective = distance / (distance + z2);

    return {
      screenX: x2 * perspective,
      screenY: y1 * perspective,
      depth: z2,
      perspective: perspective,
    };
  };

  // Animation loop - update to handle empty states better
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If no nodes, clear canvas and don't start animation
    if (!nodes.length || !graphData.nodes.length) {
      const canvasWidth = canvasSize.width;
      const canvasHeight = canvasSize.height;

      if (canvasWidth && canvasHeight) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw clean background
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const bgGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          Math.max(canvasWidth, canvasHeight) / 2,
        );
        bgGradient.addColorStop(0, "#2a1810");
        bgGradient.addColorStop(0.3, "#1a1a2e");
        bgGradient.addColorStop(0.7, "#16213e");
        bgGradient.addColorStop(1, "#0c0c0c");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Don't start animation loop if no data
      return;
    }

    let lastFrameTime = performance.now();

    const animate = (currentTime: number) => {
      // Check again during animation - if nodes were cleared, stop animation
      if (!nodes.length || !graphData.nodes.length) {
        return;
      }

      const deltaTime = (currentTime - lastFrameTime) / 1000;
      animationTimeRef.current += deltaTime * 0.6;
      lastFrameTime = currentTime;

      // Much slower, more peaceful orbit speeds - like watching Earth from space
      if (isAutoOrbiting && !isDragging && !isOrbiting) {
        orbitRotationRef.current = {
          x: orbitRotationRef.current.x + deltaTime * 0.03, // Reduced from 0.15 to 0.03 (5x slower)
          y: orbitRotationRef.current.y + deltaTime * 0.05, // Reduced from 0.25 to 0.05 (5x slower)
        };
      }

      const canvasWidth = canvasSize.width;
      const canvasHeight = canvasSize.height;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(canvasWidth, canvasHeight) / 2,
      );
      bgGradient.addColorStop(0, "#2a1810");
      bgGradient.addColorStop(0.3, "#1a1a2e");
      bgGradient.addColorStop(0.7, "#16213e");
      bgGradient.addColorStop(1, "#0c0c0c");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const projectedNodes = nodes
        .map(node => {
          const projected = project3DTo2D(node, orbitRotationRef.current.x, orbitRotationRef.current.y);
          return {
            ...node,
            screenX: projected.screenX,
            screenY: projected.screenY,
            depth: projected.depth,
            perspective: projected.perspective,
          };
        })
        .sort((a, b) => a.depth - b.depth);

      ctx.save();
      ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
      ctx.scale(zoom, zoom);

      // Draw galaxy dust/background - only if we have nodes
      if (projectedNodes.length > 0) {
        projectedNodes.forEach(node => {
          if (node.depth < -300) {
            const dustOpacity = Math.max(0.02, Math.min(0.08, (600 + node.depth) / 1000));
            ctx.beginPath();
            ctx.fillStyle = `rgba(100, 150, 200, ${dustOpacity})`;
            ctx.arc(node.screenX, node.screenY, 0.5 / zoom, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }

      // Draw links with particle system - only if we have links
      if (graphData.links.length > 0) {
        graphData.links.forEach((link, linkIndex) => {
          const sourceNode = projectedNodes.find(n => n.id === link.source);
          const targetNode = projectedNodes.find(n => n.id === link.target);

          if (sourceNode && targetNode) {
            if (sourceNode.depth > -500 && targetNode.depth > -500) {
              ctx.beginPath();

              const avgDepth = (sourceNode.depth + targetNode.depth) / 2;
              let baseOpacity = Math.max(0.1, Math.min(0.5, (500 + avgDepth) / 1000));

              if (sourceNode.galaxyLayer === "core" || targetNode.galaxyLayer === "core") {
                baseOpacity *= 1.5;
              }

              ctx.strokeStyle = `rgba(97, 218, 251, ${baseOpacity})`;
              ctx.lineWidth = 1 / zoom;

              ctx.moveTo(sourceNode.screenX, sourceNode.screenY);
              ctx.lineTo(targetNode.screenX, targetNode.screenY);
              ctx.stroke();

              // Only draw particles if particleMode is not 'off'
              if (particleMode !== "off" && baseOpacity > 0.25) {
                let particlePos;

                if (particleMode === "pulse") {
                  particlePos = (animationTimeRef.current * 0.5) % 1;
                } else {
                  const linkSpeed = 1.2 + ((linkIndex * 0.2) % 0.8);
                  const linkOffset = (linkIndex * 0.7) % 1;
                  particlePos = (animationTimeRef.current * linkSpeed + linkOffset) % 1;
                }

                const px = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * particlePos;
                const py = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * particlePos;

                if (particleMode === "laser") {
                  const numParticles = 2;
                  for (let i = 0; i < numParticles; i++) {
                    const trailOffset = i * 0.15;
                    const trailPos = (particlePos - trailOffset + 1) % 1;
                    if (trailPos >= 0 && trailPos <= 1) {
                      const trailPx = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * trailPos;
                      const trailPy = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * trailPos;
                      const trailOpacity = baseOpacity * (1 - i * 0.4);

                      ctx.beginPath();
                      ctx.fillStyle =
                        sourceNode.galaxyLayer === "core"
                          ? `rgba(255, 100, 100, ${trailOpacity})`
                          : `rgba(100, 255, 255, ${trailOpacity})`;
                      ctx.arc(trailPx, trailPy, (2 - i * 0.5) / zoom, 0, 2 * Math.PI);
                      ctx.fill();
                    }
                  }
                } else {
                  ctx.beginPath();
                  ctx.fillStyle =
                    sourceNode.galaxyLayer === "core"
                      ? `rgba(255, 215, 100, ${baseOpacity})`
                      : `rgba(97, 218, 251, ${baseOpacity})`;
                  ctx.arc(px, py, 1.5 / zoom, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
            }
          }
        });
      }

      // Draw nodes - only if we have nodes
      if (projectedNodes.length > 0) {
        projectedNodes.forEach(node => {
          if (node.depth > -500) {
            let color, baseSize, glowIntensity;

            switch (node.galaxyLayer) {
              case "core":
                color = node.isContract ? "#ff6b6b" : "#ffd93d";
                baseSize = 8;
                glowIntensity = 1.5;
                break;
              case "inner":
                color = "#74b9ff";
                baseSize = 6;
                glowIntensity = 1.2;
                break;
              case "outer":
                color = "#ffffff";
                baseSize = 4;
                glowIntensity = 1.0;
                break;
              case "halo":
                color = "#a0a0a0";
                baseSize = 3;
                glowIntensity = 0.7;
                break;
              default:
                color = "#a0a0a0";
                baseSize = 3;
                glowIntensity = 0.7;
                break;
            }

            const size = (baseSize * node.perspective) / zoom;
            const depthOpacity = Math.max(0.2, Math.min(1, (500 + node.depth) / 700));

            const rotationPhase = animationTimeRef.current * 0.1 + (node.x + node.z) * 0.001;
            const pulse = Math.sin(rotationPhase) * 0.2 + 1;

            const glowSize = size * 4 * glowIntensity;
            const glowGradient = ctx.createRadialGradient(
              node.screenX,
              node.screenY,
              0,
              node.screenX,
              node.screenY,
              glowSize,
            );

            const glowOpacity = depthOpacity * 0.8;
            glowGradient.addColorStop(
              0,
              `${color}${Math.floor(glowOpacity * 255)
                .toString(16)
                .padStart(2, "0")}`,
            );
            glowGradient.addColorStop(
              0.5,
              `${color}${Math.floor(glowOpacity * 100)
                .toString(16)
                .padStart(2, "0")}`,
            );
            glowGradient.addColorStop(1, "transparent");

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(node.screenX, node.screenY, glowSize * pulse, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = `${color}${Math.floor(depthOpacity * 255)
              .toString(16)
              .padStart(2, "0")}`;
            ctx.beginPath();
            ctx.arc(node.screenX, node.screenY, size, 0, 2 * Math.PI);
            ctx.fill();

            // In the node rendering section, replace the label drawing condition:
            if (showNodeLabels && zoom > 1.2 && depthOpacity > 0.6) {
              ctx.font = `${14 / zoom}px Inter, sans-serif`;
              ctx.textAlign = "center";
              ctx.fillStyle = `${color}${Math.floor(depthOpacity * 200)
                .toString(16)
                .padStart(2, "0")}`;
              ctx.fillText(node.label ?? "", node.screenX, node.screenY + size + 18 / zoom);
            }
          }
        });
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    nodes,
    graphData, // Add this
    panOffset,
    zoom,
    particleMode,
    isAutoOrbiting,
    isDragging,
    isOrbiting,
    canvasSize,
    targetNodeId,
    showNodeLabels,
  ]);

  // Also clear nodes when graphData changes to empty
  useEffect(() => {
    if (graphData.nodes.length === 0) {
      setNodes([]);
      setNodePopup(null); // Clear any open popup
      setTargetNodeId(null); // Clear target
    }
  }, [graphData.nodes]);

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setLastMousePos({ x: event.clientX, y: event.clientY });

    // Close popup when starting any interaction (left or right click)
    if (nodePopup) {
      setNodePopup(null);
    }

    if (event.button === 2) {
      setIsOrbiting(true);
    } else {
      setIsDragging(true);
      setDragOffset({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y,
      });
    }
  };

  const updateOrbitRotation = (newRotation: { x: number; y: number }) => {
    setOrbitRotation(newRotation);
    orbitRotationRef.current = newRotation;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isOrbiting) {
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;

      const sensitivity = 0.01;
      updateOrbitRotation({
        x: orbitRotation.x + deltaY * sensitivity,
        y: orbitRotation.y + deltaX * sensitivity,
      });

      setLastMousePos({ x: event.clientX, y: event.clientY });
    } else if (isDragging) {
      setPanOffset({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsOrbiting(false);
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    // Close popup on right-click context menu
    if (nodePopup) {
      setNodePopup(null);
    }
  };

  // Wheel event for zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isHovered) return;
      e.preventDefault();

      // Close popup when user starts zooming
      if (nodePopup) {
        setNodePopup(null);
      }

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [isHovered, nodePopup]);

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

    const projectedNodes = nodes
      .map(node => ({
        ...node,
        ...project3DTo2D(node, orbitRotationRef.current.x, orbitRotationRef.current.y), // Use ref instead of state
      }))
      .map(node => {
        const dx = worldX - node.screenX;
        const dy = worldY - node.screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate dynamic click radius based on node size and zoom
        let baseSize;
        switch (node.galaxyLayer) {
          case "core":
            baseSize = 8;
            break;
          case "inner":
            baseSize = 6;
            break;
          case "outer":
            baseSize = 4;
            break;
          case "halo":
            baseSize = 3;
            break;
          default:
            baseSize = 3;
            break;
        }

        // Calculate node visibility and opacity same as drawing logic
        const depthOpacity = Math.max(0.2, Math.min(1, (500 + node.depth) / 700));
        const size = (baseSize * node.perspective) / zoom;

        // Node is clickable if:
        // 1. It's visible (depth > -500, same as drawing)
        // 2. Has reasonable opacity
        const isVisible = node.depth > -500 && depthOpacity > 0.2;

        // Click radius - slightly larger than visual node
        const clickRadius = isVisible ? Math.max(8, size * 1.8) : 0;

        return {
          ...node,
          distance,
          clickRadius,
          isVisible,
          depthOpacity,
          size,
          isInClickRange: isVisible && distance < clickRadius,
        };
      })
      .filter(node => node.isInClickRange)
      .sort((a, b) => a.distance - b.distance); // Sort by distance to get closest node

    // Get the closest clickable node
    const clickedNode = projectedNodes[0];

    if (clickedNode) {
      setNodePopup({
        node: clickedNode,
        x: canvasX,
        y: canvasY,
      });
    } else {
      setNodePopup(null);
    }
  };

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      const target = event.target as Element;

      if (nodePopup) {
        const popupElement = target.closest(".node-popup");
        if (popupElement) {
          return;
        }
      }

      if (canvas && !canvas.contains(target)) {
        setNodePopup(null);
      }
    };

    if (nodePopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [nodePopup]);

  const handleTargetChange = useCallback(
    (newTargetId: string, source: string = "") => {
      setTargetNodeId(newTargetId);

      if (onSetTarget && source !== "prop") {
        onSetTarget(newTargetId);
      }

      setNodePopup(null);
    },
    [onSetTarget],
  );

  // Handle target node changes
  useEffect(() => {
    if (targetNode && targetNode !== targetNodeId) {
      handleTargetChange(targetNode, "prop");
    }
  }, [targetNode, targetNodeId, handleTargetChange]); // Now handleTargetChange is stable

  // Fallback target node
  useEffect(() => {
    if (graphData.nodes.length > 0 && !targetNodeId && !targetNode) {
      const fallbackNodeId = graphData.nodes[0].id;
      handleTargetChange(fallbackNodeId, "fallback");
    }
  }, [graphData.nodes, targetNodeId, targetNode, handleTargetChange]); // Now handleTargetChange is stable

  // Add this effect to notify parent of view state changes
  useEffect(() => {
    // Debounce the view state updates to avoid excessive calls
    const timeoutId = setTimeout(() => {
      if (onViewStateChange) {
        onViewStateChange({
          zoom,
          panOffset,
          orbitRotation,
        });
      }
    }, 50); // 50ms debounce

    return () => clearTimeout(timeoutId);
  }, [zoom, panOffset, orbitRotation, onViewStateChange]); // Add panOffset and orbitRotation

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing`}
        style={{
          borderRadius: isFullscreen ? "0px" : "12px",
          width: isFullscreen ? "100vw" : "100%",
          height: isFullscreen ? "100vh" : "100%",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
      />

      {/* Fullscreen Button */}
      <FullscreenButton isFullscreen={isFullscreen} onToggle={onFullscreenToggle} />

      <div className="absolute bottom-4 left-4 text-white text-xs opacity-50">
        {isHovered
          ? "Hover active • Scroll to zoom • Left-drag: pan • Right-drag: orbit • Click visible nodes for details"
          : "Hover over graph to enable zoom • Left-drag: pan • Right-drag: orbit • Click nodes for details"}
      </div>

      {/* Node Popup using the component */}
      {nodePopup && (
        <NodePopup
          node={nodePopup.node}
          x={nodePopup.x}
          y={nodePopup.y}
          linkCount={
            graphData.links.filter(link => link.source === nodePopup.node.id || link.target === nodePopup.node.id)
              .length
          }
          selectedChain={selectedChain}
          canvasSize={canvasSize}
          isFullscreen={isFullscreen}
          onClose={() => setNodePopup(null)}
          onSetTarget={onSetTarget ? (address: string) => handleTargetChange(address, "user-click") : undefined}
        />
      )}

      {/* Legend */}
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
