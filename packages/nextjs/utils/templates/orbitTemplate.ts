export const orbitTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cosmic Graph NFT - {{ADDRESS_SHORT}}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #000;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      user-select: none;
    }
    
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
      cursor: grab;
    }
    
    canvas:active {
      cursor: grabbing;
    }
    
    .controls {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    
    .btn-group {
      display: flex;
      gap: 2px;
    }
    
    .btn {
      padding: 4px 8px;
      font-size: 11px;
      border: none;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
      white-space: nowrap;
    }
    
    .btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    
    .btn.active {
      background: rgba(116, 185, 255, 0.8);
      color: #000;
    }
    
    .btn-secondary.active {
      background: rgba(255, 193, 7, 0.8);
      color: #000;
    }
    
    .btn-primary.active {
      background: rgba(0, 123, 255, 0.8);
      color: white;
    }
    
    .btn-accent.active {
      background: rgba(255, 107, 107, 0.8);
      color: #000;
    }
    
    .info {
      position: absolute;
      top: 16px;
      left: 16px;
      color: white;
      font-size: 14px;
      opacity: 0.7;
      z-index: 10;
    }
    
    .legend {
      position: absolute;
      bottom: 16px;
      right: 16px;
      color: white;
      font-size: 12px;
      opacity: 0.6;
      z-index: 10;
    }
    
    .nft-metadata {
      position: absolute;
      bottom: 16px;
      left: 16px;
      color: white;
      font-size: 11px;
      opacity: 0.8;
      background: rgba(0, 0, 0, 0.3);
      padding: 8px 12px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(97, 218, 251, 0.2);
      z-index: 10;
    }
    
    .zoom-indicator {
      position: absolute;
      bottom: 50px;
      left: 16px;
      color: white;
      font-size: 10px;
      opacity: 0.5;
      z-index: 10;
    }
  </style>
</head>
<body>
  <canvas id="cosmicCanvas"></canvas>
  
  <div class="info">
    🌌 {{ADDRESS_SHORT}} Universe
  </div>
  
  <div class="controls">
    <div class="btn-group">
      <button class="btn btn-secondary active" id="shellBtn" title="Shell-based layout">🌌 Shell</button>
      <button class="btn btn-secondary" id="forceBtn" title="Force-directed layout">⚡ Force</button>
      <button class="btn btn-secondary" id="spiralBtn" title="Fibonacci spiral layout">🌀 Spiral</button>
    </div>
    
    <div class="btn-group">
      <button class="btn btn-primary active" id="pulseBtn">🌊 Pulse</button>
      <button class="btn btn-primary" id="laserBtn">⚡ Laser</button>
    </div>
    
    <button class="btn btn-accent" id="orbitBtn">🪐 Orbit</button>
    <button class="btn" id="resetBtn">Reset</button>
  </div>
  
  <div class="nft-metadata">
    <div><strong>Address:</strong> {{TARGET_ADDRESS_SHORT}}</div>
    <div><strong>Nodes:</strong> {{NODE_COUNT}}</div>
    <div><strong>Links:</strong> {{LINK_COUNT}}</div>
    <div><strong>Balance:</strong> {{TARGET_BALANCE}} ETH</div>
    <div><strong>Layout:</strong> <span id="currentLayout">Shell</span></div>
    <div><strong>Generated:</strong> <span id="timestamp">{{TIMESTAMP}}</span></div>
  </div>
  
  <div class="zoom-indicator" id="zoomIndicator">
    Zoom: 100%
  </div>
  
  <div class="legend">
    <div style="display: flex; gap: 16px;">
      <span>🔴 Contracts</span>
      <span>🟡 Whale Nodes</span>
      <span>🔵 Active Nodes</span>
      <span>⚪ Regular Nodes</span>
    </div>
  </div>

  <script>
    // === DATA INJECTION POINT ===
    console.log('🚀 Starting data injection...');
    
    // Direct data injection - no JSON parsing needed
    const REAL_ADDRESS = "{{TARGET_ADDRESS}}";
    const REAL_BALANCE = {{TARGET_BALANCE_RAW}};
    const REAL_NODE_DATA = {{NODE_DATA_JSON}};
    const REAL_LINK_DATA = {{LINK_DATA_JSON}};
    const REAL_TIMESTAMP = "{{TIMESTAMP}}";
    
    console.log('Raw data check:', {
      address: REAL_ADDRESS,
      addressLength: REAL_ADDRESS ? REAL_ADDRESS.length : 0,
      balance: REAL_BALANCE,
      nodeCount: REAL_NODE_DATA ? REAL_NODE_DATA.length : 0,
      linkCount: REAL_LINK_DATA ? REAL_LINK_DATA.length : 0
    });
    
    // Check if data was properly injected
    const hasValidData = REAL_ADDRESS && 
                        REAL_ADDRESS.length === 42 && 
                        REAL_NODE_DATA && 
                        Array.isArray(REAL_NODE_DATA) && 
                        REAL_NODE_DATA.length > 0;
    
    let INJECTED_DATA;
    
    if (hasValidData) {
      INJECTED_DATA = {
        address: REAL_ADDRESS,
        balance: REAL_BALANCE || 0,
        nodes: REAL_NODE_DATA,
        links: REAL_LINK_DATA || [],
        timestamp: REAL_TIMESTAMP
      };
      console.log('✅ Using REAL blockchain data:', {
        address: INJECTED_DATA.address,
        nodeCount: INJECTED_DATA.nodes.length,
        linkCount: INJECTED_DATA.links.length,
        sampleNode: INJECTED_DATA.nodes[0]
      });
    } else {
      console.log('❌ Real data invalid, using fallback');
      INJECTED_DATA = {
        address: null,
        balance: 0,
        nodes: [],
        links: [],
        timestamp: new Date().toISOString()
      };
    }
    
    const hasInjectedData = hasValidData;
    
    // Initialize canvas and context - COPIED FROM WORKING HTML
    const canvas = document.getElementById('cosmicCanvas');
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    
    // Simulation parameters - COPIED FROM WORKING HTML
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let animationTime = 0;
    let particleMode = 'pulse';
    let layoutMode = 'shell';
    let isAutoOrbiting = false;
    let orbitRotation = { x: 0, y: 0 };
    let zoom = 1;
    let panOffset = { x: 0, y: 0 };
    
    // Mouse interaction - COPIED FROM WORKING HTML
    let isDragging = false;
    let isOrbiting = false;
    let lastMousePos = { x: 0, y: 0 };
    let dragOffset = { x: 0, y: 0 };
    
    // Current nodes and links
    let nodes = [];
    let links = [];
    // FIXED: Target node ID should match the injected address exactly
    const targetNodeId = hasInjectedData ? INJECTED_DATA.address : 'target-0x742d35b8';
    
    console.log('🎯 Target node ID set to:', targetNodeId);
    
    // COPIED FROM SimpleCosmicGraph - Enhanced layout algorithms
    const getGalaxyLayer = (balance, isContract) => {
      if (isContract || balance > 10) return 'core';
      if (balance > 1) return 'inner';
      if (balance > 0.1) return 'outer';
      return 'halo';
    };
    
    const getShellRadius = (balance, isContract) => {
      if (isContract || balance > 10) return 40;
      if (balance > 1) return 100;
      if (balance > 0.1) return 180;
      return 280;
    };
    
    // FIXED - Generate cosmic graph data with proper target finding
    const generateCosmicData = () => {
      if (hasInjectedData) {
        console.log('🌌 Using injected real blockchain data');
        console.log('Looking for target node:', targetNodeId);
        
        const convertedNodes = INJECTED_DATA.nodes.map(node => ({
          id: node.id,
          balance: parseFloat(node.balance) || 0,
          isContract: node.isContract || false,
          x: node.x || 0,
          y: node.y || 0,
          z: node.z || 0,
          galaxyLayer: node.galaxyLayer || getGalaxyLayer(parseFloat(node.balance) || 0, node.isContract || false)
        }));
        
        const convertedLinks = INJECTED_DATA.links.map(link => ({
          source: link.source,
          target: link.target
        }));
        
        // VERIFY target node exists
        const foundTarget = convertedNodes.find(n => n.id === targetNodeId);
        console.log('Target node found in data:', foundTarget ? 'YES' : 'NO', foundTarget?.id);
        
        return applyLayoutToNodes(convertedNodes, convertedLinks);
        
      } else {
        console.log('🎭 Using demo data generation');
        return generateDemoData();
      }
    };
    
    // COMPLETELY REWRITTEN - Apply layout matching SimpleCosmicGraph exactly
    const applyLayoutToNodes = (nodeData, linkData) => {
      console.log('🔧 Applying layout:', layoutMode, 'to', nodeData.length, 'nodes');
      console.log('🎯 Target node ID:', targetNodeId);
      
      // CRITICAL: Find target node in the data
      const targetNodeData = nodeData.find(n => n.id === targetNodeId);
      if (!targetNodeData) {
        console.error('❌ Target node not found in data!', {
          targetNodeId,
          availableIds: nodeData.map(n => n.id).slice(0, 5)
        });
        // Fallback to first node
        const fallbackTarget = nodeData[0];
        console.log('Using fallback target:', fallbackTarget?.id);
      }
      
      const actualTarget = targetNodeData || nodeData[0];
      
      if (layoutMode === 'shell') {
        console.log('🌌 Applying Shell layout - matching SimpleCosmicGraph');
        
        const positionedNodes = nodeData.map((node, index) => {
          // TARGET NODE: Always at exact origin (0,0,0) - MATCHING SimpleCosmicGraph
          if (node.id === actualTarget.id) {
            console.log('✅ Shell: Positioning target at origin:', node.id);
            return { 
              ...node, 
              x: 0, 
              y: 0, 
              z: 0, 
              galaxyLayer: getGalaxyLayer(parseFloat(node.balance || '0'), node.isContract || false)
            };
          }

          const balance = parseFloat(node.balance || '0');
          let galaxyLayer, shellRadius, shellThickness;
          
          // EXACT SAME LOGIC as SimpleCosmicGraph
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

          // EXACT SAME orbital mechanics as SimpleCosmicGraph
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
          
          // Apply orbital transformations - EXACT SAME as SimpleCosmicGraph
          const cosT = Math.cos(orbitalTilt);
          const sinT = Math.sin(orbitalTilt);
          const cosR = Math.cos(orbitalRotation);
          const sinR = Math.sin(orbitalRotation);
          
          const y1 = y * cosT - z * sinT;
          const z1 = y * sinT + z * cosT;
          
          const x2 = x * cosR + z1 * sinR;
          const z2 = -x * sinR + z1 * cosR;
          
          return { ...node, x: x2, y: y1, z: z2, galaxyLayer };
        });
        
        return { nodes: positionedNodes, links: linkData };
        
      } else if (layoutMode === 'force') {
        console.log('🌊 Applying Force layout - matching SimpleCosmicGraph');
        
        // EXACT SAME initial placement as SimpleCosmicGraph
        const positionedNodes = nodeData.map((node, index) => {
          if (node.id === actualTarget.id) {
            console.log('✅ Force: Target at origin:', node.id);
            return { 
              ...node, 
              x: 0, y: 0, z: 0, 
              vx: 0, vy: 0, vz: 0,
              galaxyLayer: getGalaxyLayer(parseFloat(node.balance || '0'), node.isContract || false)
            };
          }

          const balance = parseFloat(node.balance || '0');
          const shellRadius = balance > 10 || node.isContract ? 40 : 
                              balance > 1 ? 100 : 
                              balance > 0.1 ? 180 : 280;
          
          // EXACT SAME starting positions as SimpleCosmicGraph
          const angle = Math.random() * 2 * Math.PI;
          const radius = shellRadius * (0.5 + Math.random() * 0.5);
          
          return { 
            ...node, 
            x: Math.cos(angle) * radius,
            y: (Math.random() - 0.5) * radius,
            z: Math.sin(angle) * radius,
            vx: 0, vy: 0, vz: 0,
            galaxyLayer: getGalaxyLayer(parseFloat(node.balance || '0'), node.isContract || false)
          };
        });

        // EXACT SAME force simulation as SimpleCosmicGraph
        const iterations = 100;
        const repulsionStrength = 2000;
        const centerAttraction = 0.05;
        
        for (let iter = 0; iter < iterations; iter++) {
          positionedNodes.forEach((node, i) => {
            // CRITICAL: Keep target node absolutely fixed at origin
            if (node.id === actualTarget.id) {
              node.x = 0;
              node.y = 0;
              node.z = 0;
              node.vx = 0;
              node.vy = 0;
              node.vz = 0;
              return;
            }

            let fx = 0, fy = 0, fz = 0;
            const balance = parseFloat(node.balance || '0');
            const targetRadius = balance > 10 || node.isContract ? 40 : 
                               balance > 1 ? 100 : 
                               balance > 0.1 ? 180 : 280;
            
            // EXACT SAME repulsion logic
            positionedNodes.forEach((other, j) => {
              if (i !== j) {
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const dz = node.z - other.z;
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz) + 1;
                const force = repulsionStrength / (distance * distance);
                
                fx += (dx / distance) * force;
                fy += (dy / distance) * force;
                fz += (dz / distance) * force;
              }
            });
            
            // EXACT SAME center attraction
            const currentRadius = Math.sqrt(node.x*node.x + node.y*node.y + node.z*node.z);
            if (currentRadius > 0) {
              const radiusForce = (targetRadius - currentRadius) * centerAttraction;
              fx += (node.x / currentRadius) * radiusForce;
              fy += (node.y / currentRadius) * radiusForce;
              fz += (node.z / currentRadius) * radiusForce;
            }
            
            // EXACT SAME force application
            const damping = 0.02;
            node.vx = (node.vx + fx * damping) * 0.9;
            node.vy = (node.vy + fy * damping) * 0.9;
            node.vz = (node.vz + fz * damping) * 0.9;
            
            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;
          });
        }
        
        return { nodes: positionedNodes, links: linkData };
        
      } else if (layoutMode === 'spiral') {
        console.log('🌀 Applying Spiral layout - matching SimpleCosmicGraph');
        
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        
        // EXACT SAME sorting as SimpleCosmicGraph
        const otherNodes = nodeData.filter(n => n.id !== actualTarget.id);
        const sortedOtherNodes = otherNodes.sort((a, b) => {
          const balanceA = parseFloat(a.balance || '0');
          const balanceB = parseFloat(b.balance || '0');
          const scoreA = a.isContract ? 1000 + balanceA : balanceA;
          const scoreB = b.isContract ? 1000 + balanceB : balanceB;
          return scoreB - scoreA;
        });
        
        // TARGET NODE: Always at exact origin - MATCHING SimpleCosmicGraph
        const targetPositioned = {
          ...actualTarget,
          x: 0, y: 0, z: 0,
          galaxyLayer: getGalaxyLayer(parseFloat(actualTarget.balance || '0'), actualTarget.isContract || false)
        };
        
        console.log('✅ Spiral: Target at origin:', targetPositioned.id);
        
        // EXACT SAME spiral positioning as SimpleCosmicGraph  
        const otherPositioned = sortedOtherNodes.map((node, index) => {
          const balance = parseFloat(node.balance || '0');
          const baseRadius = balance > 10 || node.isContract ? 40 : 
                           balance > 1 ? 100 : 
                           balance > 0.1 ? 180 : 280;
          
          // EXACT SAME Fibonacci spiral logic
          const spiralIndex = index + 1;
          const t = spiralIndex / nodeData.length;
          const y = (1 - 2 * t) * baseRadius * 0.8;
          const radiusAtY = Math.sqrt(Math.max(0, baseRadius * baseRadius - y * y));
          const angle = goldenAngle * spiralIndex;
          
          // EXACT SAME randomness
          const randomScale = 1 + (Math.random() - 0.5) * 0.3;
          const x = Math.cos(angle) * radiusAtY * randomScale;
          const z = Math.sin(angle) * radiusAtY * randomScale;
          
          return {
            ...node, x, y, z,
            galaxyLayer: getGalaxyLayer(balance, node.isContract || false)
          };
        });
        
        return { nodes: [targetPositioned, ...otherPositioned], links: linkData };
      }
      
      // Fallback
      console.log('⚠️ Using fallback shell layout');
      return { nodes: nodeData, links: linkData };
    };
    
    // EXACT SAME 3D projection as SimpleCosmicGraph
    const project3DTo2D = (node, rotX, rotY) => {
      // CRITICAL: Use node coordinates directly since target is already at origin
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
    
    // COPIED FROM WORKING HTML - Main animation loop with target-centered rotation
    const animate = (currentTime) => {
      animationTime = currentTime * 0.001;
      
      // Auto-orbit rotation
      if (isAutoOrbiting && !isDragging && !isOrbiting) {
        orbitRotation.x += 0.0015;
        orbitRotation.y += 0.0025;
      }
      
      // Enhanced cosmic background
      const maxDimension = Math.max(window.innerWidth, window.innerHeight);
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY, 0, 
        centerX, centerY, maxDimension / 2
      );
      bgGradient.addColorStop(0, '#2a1810');
      bgGradient.addColorStop(0.3, '#1a1a2e');
      bgGradient.addColorStop(0.7, '#16213e');
      bgGradient.addColorStop(1, '#0c0c0c');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      
      // Find the target node
      const targetNode = nodes.find(n => n.id === targetNodeId);
      
      // Project all nodes to 2D and sort by depth - MATCHING SimpleCosmicGraph
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
      
      // Apply transforms - SIMPLIFIED to match SimpleCosmicGraph
      ctx.save();
      ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
      ctx.scale(zoom, zoom);
      
      // IMPORTANT: No additional target offset needed here because:
      // 1. Target node is already at (0,0,0) in 3D space
      // 2. project3DTo2D will project it to (0,0) in screen space
      // 3. The translate above centers (0,0) at screen center
      
      // Draw galaxy dust for very distant nodes
      projectedNodes.forEach(node => {
        if (node.depth < -300) {
          const dustOpacity = Math.max(0.02, Math.min(0.08, (600 + node.depth) / 1000));
          ctx.beginPath();
          ctx.fillStyle = 'rgba(100, 150, 200, ' + dustOpacity + ')';
          ctx.arc(node.screenX, node.screenY, 0.5 / zoom, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      
      // Draw links with particles
      links.forEach((link, linkIndex) => {
        const sourceNode = projectedNodes.find(n => n.id === link.source);
        const targetNodeFound = projectedNodes.find(n => n.id === link.target);
        
        if (sourceNode && targetNodeFound) {
          if (sourceNode.depth > -500 && targetNodeFound.depth > -500) {
            ctx.beginPath();
            
            const avgDepth = (sourceNode.depth + targetNodeFound.depth) / 2;
            let baseOpacity = Math.max(0.1, Math.min(0.5, (500 + avgDepth) / 1000));
            
            if (sourceNode.galaxyLayer === 'core' || targetNodeFound.galaxyLayer === 'core') {
              baseOpacity *= 1.5;
            }
            
            ctx.strokeStyle = 'rgba(97, 218, 251, ' + baseOpacity + ')';
            ctx.lineWidth = 1 / zoom;
            
            ctx.moveTo(sourceNode.screenX, sourceNode.screenY);
            ctx.lineTo(targetNodeFound.screenX, targetNodeFound.screenY);
            ctx.stroke();

            // Particle system
            if (baseOpacity > 0.25) {
              let particlePos;
              
              if (particleMode === 'pulse') {
                particlePos = (animationTime * 0.5) % 1;
              } else {
                const linkSpeed = 1.2 + (linkIndex * 0.2) % 0.8;
                const linkOffset = (linkIndex * 0.7) % 1;
                particlePos = (animationTime * linkSpeed + linkOffset) % 1;
              }
              
              const px = sourceNode.screenX + (targetNodeFound.screenX - sourceNode.screenX) * particlePos;
              const py = sourceNode.screenY + (targetNodeFound.screenY - sourceNode.screenY) * particlePos;
              
              if (particleMode === 'laser') {
                const numParticles = 2;
                for (let i = 0; i < numParticles; i++) {
                  const trailOffset = i * 0.15;
                  const trailPos = (particlePos - trailOffset + 1) % 1;
                  if (trailPos >= 0 && trailPos <= 1) {
                    const trailPx = sourceNode.screenX + (targetNodeFound.screenX - sourceNode.screenX) * trailPos;
                    const trailPy = sourceNode.screenY + (targetNodeFound.screenY - sourceNode.screenY) * trailPos;
                    const trailOpacity = baseOpacity * (1 - i * 0.4);
                    
                    ctx.beginPath();
                    ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                      'rgba(255, 100, 100, ' + trailOpacity + ')' : 
                      'rgba(100, 255, 255, ' + trailOpacity + ')';
                    ctx.arc(trailPx, trailPy, (2 - i * 0.5) / zoom, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                }
              } else {
                ctx.beginPath();
                ctx.fillStyle = sourceNode.galaxyLayer === 'core' ? 
                  'rgba(255, 215, 100, ' + baseOpacity + ')' : 
                  'rgba(97, 218, 251, ' + baseOpacity + ')';
                ctx.arc(px, py, 1.5 / zoom, 0, 2 * Math.PI);
                ctx.fill();
              }
            }
          }
        }
      });
      
      // Draw nodes with full 3D effects
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
          }
          
          // Make target node extra prominent and centered
          if (node.id === targetNodeId) {
            baseSize = 12; // Larger target node
            glowIntensity = 2.0; // Extra glow
            color = '#ff4444'; // Special target color
            
            // DEBUG: Log target node position to verify centering
            if (Math.floor(animationTime) % 2 === 0 && Math.floor(animationTime * 10) % 10 === 0) {
              console.log('Target node screen position:', {
                screenX: node.screenX.toFixed(1),
                screenY: node.screenY.toFixed(1),
                shouldBe: '(0, 0)',
                centerX: centerX,
                centerY: centerY
              });
            }
          }
          
          const size = (baseSize * node.perspective) / zoom;
          const depthOpacity = Math.max(0.2, Math.min(1, (500 + node.depth) / 700));

          // Pulsing effect
          const rotationPhase = animationTime * 0.1 + (node.x + node.z) * 0.001;
          const pulse = Math.sin(rotationPhase) * 0.2 + 1;

          // Glow effect
          const glowSize = Math.max(1, size * 4 * glowIntensity);
          if (isFinite(glowSize)) {
            const glowGradient = ctx.createRadialGradient(
              node.screenX, node.screenY, 0, 
              node.screenX, node.screenY, glowSize
            );

            const glowOpacity = depthOpacity * 0.8;
            const glowHex = Math.floor(glowOpacity * 255).toString(16).padStart(2, '0');
            glowGradient.addColorStop(0, color + glowHex);
            glowGradient.addColorStop(0.5, color + Math.floor(glowOpacity * 100).toString(16).padStart(2, '0'));
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(node.screenX, node.screenY, glowSize * pulse, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Node core
          const nodeHex = Math.floor(depthOpacity * 255).toString(16).padStart(2, '0');
          ctx.fillStyle = color + nodeHex;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, size, 0, 2 * Math.PI);
          ctx.fill();
          
          // Target node label - always show for target
          if (node.id === targetNodeId) {
            ctx.fillStyle = 'white';
            ctx.font = (16 / zoom) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TARGET', node.screenX, node.screenY + size + 20 / zoom);
            
            // Also show the address
            ctx.font = (12 / zoom) + 'px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            const shortAddr = node.id.slice(0, 6) + '...' + node.id.slice(-4);
            ctx.fillText(shortAddr, node.screenX, node.screenY + size + 35 / zoom);
          }
        }
      });
      
      ctx.restore();
      
      // Update zoom indicator
      document.getElementById('zoomIndicator').textContent = 'Zoom: ' + (zoom * 100).toFixed(0) + '%';
      
      requestAnimationFrame(animate);
    };
    
    // COPIED FROM WORKING HTML - Mouse interaction handlers
    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      lastMousePos = { x: e.clientX, y: e.clientY };
      
      if (e.button === 2) {
        isOrbiting = true;
      } else {
        isDragging = true;
        dragOffset = {
          x: e.clientX - panOffset.x,
          y: e.clientY - panOffset.y
        };
      }
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (isOrbiting) {
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;
        
        const sensitivity = 0.012;
        orbitRotation.x += deltaY * sensitivity;
        orbitRotation.y += deltaX * sensitivity;
        
        lastMousePos = { x: e.clientX, y: e.clientY };
      } else if (isDragging) {
        panOffset = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      isOrbiting = false;
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoom = Math.max(0.1, Math.min(5, zoom * delta));
    });
    
    // Control functions
    const generateLayout = () => {
      const result = generateCosmicData();
      nodes = result.nodes;
      links = result.links;
      console.log('Generated ' + layoutMode + ' layout with ' + nodes.length + ' nodes and ' + links.length + ' links');
    };
    
    const updateLayoutButtons = () => {
      document.querySelectorAll('.btn-secondary').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(layoutMode + 'Btn');
      if (activeBtn) activeBtn.classList.add('active');
      
      const layoutNames = { shell: 'Shell', force: 'Force', spiral: 'Spiral' };
      const layoutElement = document.getElementById('currentLayout');
      if (layoutElement) layoutElement.textContent = layoutNames[layoutMode];
    };
    
    const updateParticleButtons = () => {
      document.querySelectorAll('.btn-primary').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(particleMode + 'Btn');
      if (activeBtn) activeBtn.classList.add('active');
    };
    
    // Event listeners
    document.getElementById('shellBtn').addEventListener('click', () => {
      layoutMode = 'shell';
      generateLayout();
      updateLayoutButtons();
    });
    
    document.getElementById('forceBtn').addEventListener('click', () => {
      layoutMode = 'force';
      generateLayout();
      updateLayoutButtons();
    });
    
    document.getElementById('spiralBtn').addEventListener('click', () => {
      layoutMode = 'spiral';
      generateLayout();
      updateLayoutButtons();
    });
    
    document.getElementById('pulseBtn').addEventListener('click', () => {
      particleMode = 'pulse';
      updateParticleButtons();
    });
    
    document.getElementById('laserBtn').addEventListener('click', () => {
      particleMode = 'laser';
      updateParticleButtons();
    });
    
    document.getElementById('orbitBtn').addEventListener('click', (e) => {
      isAutoOrbiting = !isAutoOrbiting;
      e.target.classList.toggle('active');
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      panOffset = { x: 0, y: 0 };
      orbitRotation = { x: 0, y: 0 };
      zoom = 1;
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    });
    
    // Set timestamp
    const timestampElement = document.getElementById('timestamp');
    if (timestampElement) {
      timestampElement.textContent = hasInjectedData ? 
        INJECTED_DATA.timestamp : 
        new Date().toLocaleString();
    }
    
    // Initialize and start
    console.log('🚀 Starting cosmic visualization...');
    generateLayout();
    requestAnimationFrame(animate);
    
    console.log('✅ Cosmic NFT Interactive initialized with', hasInjectedData ? 'real blockchain data' : 'demo data');
  </script>
</body>
</html>`;