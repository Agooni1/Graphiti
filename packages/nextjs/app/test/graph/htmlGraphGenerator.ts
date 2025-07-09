import { GraphNode, GraphLink } from "../graph-data/types";
import { generateLayout, LayoutConfig, PositionedNode } from './graphLayouts';

interface ViewState {
  zoom: number;
  panOffset: { x: number; y: number };
  orbitRotation: { x: number; y: number };
}

interface GraphConfig {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  targetNode: string;
  layoutMode: 'shell' | 'force' | 'fibonacci';
  particleMode: 'pulse' | 'laser' | 'off';
  isOrbiting: boolean;
  // Add view state
  viewState?: ViewState;
}

export function generateGraphHTML(config: GraphConfig): string {
  const { graphData, targetNode, layoutMode, particleMode, isOrbiting, viewState } = config;
  
  // Generate the layout using your existing function
  const layoutConfig: LayoutConfig = {
    layoutMode,
    targetNodeId: targetNode,
    graphData
  };
  
  const nodes = generateLayout(layoutConfig);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cosmic Graph - ${targetNode.slice(0, 6)}...${targetNode.slice(-4)}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #0c0c0c;
            overflow: hidden;
        }
        
        canvas {
            display: block;
            cursor: grab;
        }
        
        canvas:active {
            cursor: grabbing;
        }
    </style>
</head>
<body>
    <canvas id="cosmicCanvas"></canvas>

    <script>
        // Embedded graph data
        const graphData = ${JSON.stringify(graphData)};
        const nodes = ${JSON.stringify(nodes)};
        const config = ${JSON.stringify(config)};
        
        // Canvas setup
        const canvas = document.getElementById('cosmicCanvas');
        const ctx = canvas.getContext('2d');
        
        // State variables - initialize with user's view state if provided
        let canvasWidth = window.innerWidth;
        let canvasHeight = window.innerHeight;
        let isDragging = false;
        let isOrbiting = false;
        let panOffset = { x: 0, y: 0 }; // Always start centered, ignore user's pan position
        let orbitRotation = config.viewState ? 
            { x: config.viewState.orbitRotation.x, y: config.viewState.orbitRotation.y } : 
            { x: 0, y: 0 };
        let zoom = config.viewState ? config.viewState.zoom : 1;
        let lastMousePos = { x: 0, y: 0 };
        let animationTime = 0;
        
        // Resize canvas
        function resizeCanvas() {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth * window.devicePixelRatio;
            canvas.height = canvasHeight * window.devicePixelRatio;
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        
        // 3D to 2D projection
        function project3DTo2D(node, rotX, rotY) {
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
        }
        
        // Animation loop
        function animate(currentTime) {
            const deltaTime = (currentTime - lastFrameTime) / 1000;
            animationTime += deltaTime * 0.6;
            lastFrameTime = currentTime;
            
            // Continuous slow orbit - always enabled unless user is actively interacting
            if (!isDragging && !isOrbiting) {
                orbitRotation.x += deltaTime * 0.03;
                orbitRotation.y += deltaTime * 0.05;
            }
            
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            // Background gradient
            const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvasWidth, canvasHeight) / 2);
            bgGradient.addColorStop(0, '#2a1810');
            bgGradient.addColorStop(0.3, '#1a1a2e');
            bgGradient.addColorStop(0.7, '#16213e');
            bgGradient.addColorStop(1, '#0c0c0c');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Project nodes
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

            ctx.save();
            ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
            ctx.scale(zoom, zoom);

            // Draw galaxy dust
            projectedNodes.forEach(node => {
                if (node.depth < -300) {
                    const dustOpacity = Math.max(0.02, Math.min(0.08, (600 + node.depth) / 1000));
                    ctx.beginPath();
                    ctx.fillStyle = \`rgba(100, 150, 200, \${dustOpacity})\`;
                    ctx.arc(node.screenX, node.screenY, 0.5 / zoom, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });

            // Draw links (always draw links regardless of particle mode)
            graphData.links.forEach((link, linkIndex) => {
                const sourceNode = projectedNodes.find(n => n.id === link.source);
                const targetNode = projectedNodes.find(n => n.id === link.target);
                
                if (sourceNode && targetNode && sourceNode.depth > -500 && targetNode.depth > -500) {
                    ctx.beginPath();
                    
                    const avgDepth = (sourceNode.depth + targetNode.depth) / 2;
                    let baseOpacity = Math.max(0.1, Math.min(0.5, (500 + avgDepth) / 1000));
                    
                    if (sourceNode.galaxyLayer === 'core' || targetNode.galaxyLayer === 'core') {
                        baseOpacity *= 1.5;
                    }
                    
                    ctx.strokeStyle = \`rgba(97, 218, 251, \${baseOpacity})\`;
                    ctx.lineWidth = 1 / zoom;
                    
                    ctx.moveTo(sourceNode.screenX, sourceNode.screenY);
                    ctx.lineTo(targetNode.screenX, targetNode.screenY);
                    ctx.stroke();

                    // Only draw particles if particleMode is not 'off'
                    if (config.particleMode !== 'off' && baseOpacity > 0.25) {
                        let particlePos;
                        
                        if (config.particleMode === 'pulse') {
                            particlePos = (animationTime * 0.5) % 1;
                        } else {
                            const linkSpeed = 1.2 + (linkIndex * 0.2) % 0.8;
                            const linkOffset = (linkIndex * 0.7) % 1;
                            particlePos = (animationTime * linkSpeed + linkOffset) % 1;
                        }
                        
                        const px = sourceNode.screenX + (targetNode.screenX - sourceNode.screenX) * particlePos;
                        const py = sourceNode.screenY + (targetNode.screenY - sourceNode.screenY) * particlePos;
                        
                        if (config.particleMode === 'laser') {
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
                                        \`rgba(255, 100, 100, \${trailOpacity})\` : 
                                        \`rgba(100, 255, 255, \${trailOpacity})\`;
                                    ctx.arc(trailPx, trailPy, (2 - i * 0.5) / zoom, 0, 2 * Math.PI);
                                    ctx.fill();
                                }
                            }
                        } else {
                            ctx.beginPath();
                            ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                                \`rgba(255, 215, 100, \${baseOpacity})\` : 
                                \`rgba(97, 218, 251, \${baseOpacity})\`;
                            ctx.arc(px, py, 1.5 / zoom, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                }
            });

            // Draw nodes
            projectedNodes.forEach(node => {
                if (node.depth > -500) {
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
                        default:
                            color = '#a0a0a0';
                            baseSize = 3;
                            glowIntensity = 0.7;
                            break;
                    }

                    const size = (baseSize * node.perspective) / zoom;
                    const depthOpacity = Math.max(0.2, Math.min(1, (500 + node.depth) / 700));
                    
                    const rotationPhase = animationTime * 0.1 + (node.x + node.z) * 0.001;
                    const pulse = Math.sin(rotationPhase) * 0.2 + 1;

                    // Glow effect
                    const glowSize = size * 4 * glowIntensity;
                    const glowGradient = ctx.createRadialGradient(
                        node.screenX, node.screenY, 0, 
                        node.screenX, node.screenY, glowSize
                    );
                    
                    const glowOpacity = depthOpacity * 0.8;
                    const hexToRgba = (hex, alpha) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
                    };
                    
                    glowGradient.addColorStop(0, hexToRgba(color, glowOpacity));
                    glowGradient.addColorStop(0.5, hexToRgba(color, glowOpacity * 0.4));
                    glowGradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(node.screenX, node.screenY, glowSize * pulse, 0, 2 * Math.PI);
                    ctx.fill();

                    // Node core
                    ctx.fillStyle = hexToRgba(color, depthOpacity);
                    ctx.beginPath();
                    ctx.arc(node.screenX, node.screenY, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });

            ctx.restore();
            requestAnimationFrame(animate);
        }
        
        // Mouse event handlers
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            lastMousePos = { x: e.clientX, y: e.clientY };

            if (e.button === 2) {
                isOrbiting = true;
            } else {
                isDragging = true;
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isOrbiting) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;
                
                const sensitivity = 0.01;
                orbitRotation.x += deltaY * sensitivity;
                orbitRotation.y += deltaX * sensitivity;
                
                lastMousePos = { x: e.clientX, y: e.clientY };
            } else if (isDragging) {
                const deltaX = e.clientX - lastMousePos.x;
                const deltaY = e.clientY - lastMousePos.y;
                
                panOffset.x += deltaX;
                panOffset.y += deltaY;
                
                lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            isOrbiting = false;
        });
        
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            zoom = Math.max(0.1, Math.min(5, zoom * delta));
        });
        
        // Initialize
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        let lastFrameTime = performance.now();
        requestAnimationFrame(animate);
    </script>
</body>
</html>`;
}

// Helper function to download the HTML file
export function downloadGraphHTML(config: GraphConfig, filename?: string): void {
  const html = generateGraphHTML(config);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `cosmic-graph-${config.targetNode.slice(0, 6)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Function to get HTML string for IPFS upload
export function getGraphHTMLForIPFS(config: GraphConfig): string {
  return generateGraphHTML(config);
}