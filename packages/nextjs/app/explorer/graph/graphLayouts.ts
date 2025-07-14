import { GraphNode } from "../graph-data/types";

export type GalaxyLayer = "core" | "inner" | "outer" | "halo";
export type LayoutMode = "shell" | "force" | "fibonacci";

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  depth: number;
  galaxyLayer: GalaxyLayer;
}

export interface LayoutConfig {
  layoutMode: LayoutMode;
  targetNodeId: string;
  graphData: { nodes: GraphNode[]; links: any[] };
}

// Helper functions
const getShellRadius = (balance: number, isContract: boolean): number => {
  if (isContract || balance > 10) return 40;
  if (balance > 1) return 100;
  if (balance > 0.1) return 180;
  return 280;
};

const getGalaxyLayer = (balance: number, isContract: boolean): GalaxyLayer => {
  if (isContract || balance > 10) return "core";
  if (balance > 1) return "inner";
  if (balance > 0.1) return "outer";
  return "halo";
};

// Shell-based Layout
const createShellLayout = (graphData: { nodes: GraphNode[] }, targetNodeId: string): PositionedNode[] => {
  const targetNodeData = graphData.nodes.find(node => node.id === targetNodeId) || graphData.nodes[0];

  return graphData.nodes.map((node, index) => {
    // Target node is always at the center
    if (node.id === targetNodeData.id) {
      return {
        ...node,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        depth: 0,
        galaxyLayer: getGalaxyLayer(parseFloat(node.balance || "0"), !!node.isContract),
      };
    }

    const balance = parseFloat(node.balance || "0");
    let galaxyLayer: GalaxyLayer;
    let shellRadius: number;
    let shellThickness: number;

    if (node.isContract || balance > 10) {
      galaxyLayer = "core";
      shellRadius = 40;
      shellThickness = 20;
    } else if (balance > 1) {
      galaxyLayer = "inner";
      shellRadius = 100;
      shellThickness = 30;
    } else if (balance > 0.1) {
      galaxyLayer = "outer";
      shellRadius = 180;
      shellThickness = 40;
    } else {
      galaxyLayer = "halo";
      shellRadius = 280;
      shellThickness = 60;
    }

    const numOrbitals = Math.ceil(Math.sqrt(index + 1));
    const orbitalIndex = index % numOrbitals;

    const orbitalTilt = (orbitalIndex / numOrbitals) * Math.PI;
    const orbitalRotation = Math.random() * 2 * Math.PI;

    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const radiusInShell = shellRadius + (Math.random() - 0.5) * shellThickness;

    const x = radiusInShell * Math.sin(phi) * Math.cos(theta);
    const y = radiusInShell * Math.sin(phi) * Math.sin(theta);
    const z = radiusInShell * Math.cos(phi);

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
      galaxyLayer,
    };
  });
};

// Force-based Layout
const createForceLayout = (graphData: { nodes: GraphNode[] }, targetNodeId: string): PositionedNode[] => {
  const targetNodeData = graphData.nodes.find(node => node.id === targetNodeId) || graphData.nodes[0];

  // Initial random placement
  const workingNodes: PositionedNode[] = graphData.nodes.map(node => {
    // Target node starts at center
    if (node.id === targetNodeData.id) {
      return {
        ...node,
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        depth: 0,
        galaxyLayer: getGalaxyLayer(parseFloat(node.balance || "0"), !!node.isContract),
      };
    }

    const balance = parseFloat(node.balance || "0");
    const shellRadius = getShellRadius(balance, !!node.isContract);

    // Start with random positions around center
    const angle = Math.random() * 2 * Math.PI;
    const radius = shellRadius * (0.5 + Math.random() * 0.5);

    return {
      ...node,
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * radius,
      z: Math.sin(angle) * radius,
      screenX: 0,
      screenY: 0,
      depth: 0,
      galaxyLayer: getGalaxyLayer(balance, !!node.isContract),
    };
  });

  // Apply force simulation with target node fixed at center
  const iterations = 100;
  const repulsionStrength = 2000;
  const centerAttraction = 0.05;

  for (let iter = 0; iter < iterations; iter++) {
    workingNodes.forEach((node, i) => {
      // Keep target node fixed at center
      if (node.id === targetNodeData.id) {
        node.x = 0;
        node.y = 0;
        node.z = 0;
        return;
      }

      let fx = 0,
        fy = 0,
        fz = 0;
      const balance = parseFloat(node.balance || "0");
      const targetRadius = getShellRadius(balance, !!node.isContract);

      // Repulsion from other nodes
      workingNodes.forEach((other, j) => {
        if (i !== j) {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dz = node.z - other.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1;
          const force = repulsionStrength / (distance * distance);

          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
          fz += (dz / distance) * force;
        }
      });

      // Attraction to target shell radius (around center)
      const currentRadius = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
      if (currentRadius > 0) {
        const radiusForce = (targetRadius - currentRadius) * centerAttraction;
        fx += (node.x / currentRadius) * radiusForce;
        fy += (node.y / currentRadius) * radiusForce;
        fz += (node.z / currentRadius) * radiusForce;
      }

      // Apply forces with damping
      const damping = 0.02;
      node.x += fx * damping;
      node.y += fy * damping;
      node.z += fz * damping;
    });
  }

  return workingNodes;
};

// Fibonacci Spiral Layout
const createFibonacciLayout = (graphData: { nodes: GraphNode[] }, targetNodeId: string): PositionedNode[] => {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const targetNodeData = graphData.nodes.find(node => node.id === targetNodeId) || graphData.nodes[0];

  // Put target node first, then sort others by importance
  const otherNodes = graphData.nodes.filter(node => node.id !== targetNodeData.id);
  const sortedOtherNodes = otherNodes.sort((a, b) => {
    const balanceA = parseFloat(a.balance || "0");
    const balanceB = parseFloat(b.balance || "0");
    const scoreA = a.isContract ? 1000 + balanceA : balanceA;
    const scoreB = b.isContract ? 1000 + balanceB : balanceB;
    return scoreB - scoreA;
  });

  // Target node at center
  const targetPositionedNode: PositionedNode = {
    ...targetNodeData,
    x: 0,
    y: 0,
    z: 0,
    screenX: 0,
    screenY: 0,
    depth: 0,
    galaxyLayer: getGalaxyLayer(parseFloat(targetNodeData.balance || "0"), !!targetNodeData.isContract),
  };

  // Other nodes in spiral around target
  const otherPositionedNodes = sortedOtherNodes.map((node, index) => {
    const balance = parseFloat(node.balance || "0");
    const baseRadius = getShellRadius(balance, !!node.isContract);

    // Fibonacci spiral distribution (starting from index 1 since target is at 0)
    const spiralIndex = index + 1;
    const t = spiralIndex / graphData.nodes.length;
    const y = (1 - 2 * t) * baseRadius * 0.8;
    const radiusAtY = Math.sqrt(Math.max(0, baseRadius * baseRadius - y * y));
    const angle = goldenAngle * spiralIndex;

    // Add some controlled randomness
    const randomScale = 1 + (Math.random() - 0.5) * 0.3;
    const x = Math.cos(angle) * radiusAtY * randomScale;
    const z = Math.sin(angle) * radiusAtY * randomScale;

    return {
      ...node,
      x,
      y,
      z,
      screenX: 0,
      screenY: 0,
      depth: 0,
      galaxyLayer: getGalaxyLayer(balance, !!node.isContract),
    };
  });

  return [targetPositionedNode, ...otherPositionedNodes];
};

// Main layout generator function
export const generateLayout = (config: LayoutConfig): PositionedNode[] => {
  const { layoutMode, targetNodeId, graphData } = config;

  if (!graphData.nodes.length) {
    return [];
  }

  switch (layoutMode) {
    case "force":
      return createForceLayout(graphData, targetNodeId);
    case "fibonacci":
      return createFibonacciLayout(graphData, targetNodeId);
    case "shell":
    default:
      return createShellLayout(graphData, targetNodeId);
  }
};

// Utility function to check if layout needs regeneration
export const shouldRegenerateLayout = (prevConfig: LayoutConfig | null, newConfig: LayoutConfig): boolean => {
  if (!prevConfig) return true;

  return (
    prevConfig.layoutMode !== newConfig.layoutMode ||
    prevConfig.targetNodeId !== newConfig.targetNodeId ||
    prevConfig.graphData.nodes.length !== newConfig.graphData.nodes.length ||
    JSON.stringify(prevConfig.graphData.nodes.map(n => n.id)) !==
      JSON.stringify(newConfig.graphData.nodes.map(n => n.id))
  );
};
