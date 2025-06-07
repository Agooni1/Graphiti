//Purpose:
// Defines how each node looks on the canvas, and how big the pointer area should be.
//Key Exports:
// 	•	drawNode(node, ctx, globalScale)
// ➜ Renders a styled white rectangle with optional text (e.g., address, balance, contract status)
// 	•	paintNodePointerArea(node, color, ctx)
// ➜ Expands the pointer hitbox to match the full box area, not just the center point

import { BOX_WIDTH, FONT_SIZE, PADDING, LINE_HEIGHT } from "./graphConstants";
import { GraphNode } from "../graph-data/types"

export function drawNode(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) {
  const fontSize = Math.max(FONT_SIZE / globalScale, 8);
  const lineHeight = fontSize + 4;
  const padding = PADDING;
  const label = (node.label ?? node.id) || "Unknown";
  const lines = [
    `${node.isContract ? "📄" : "👤"} ${label.slice(0, 6)}...${label.slice(-4)}`,
    `Ξ ${node.balance || "0.0"} ETH`,
    // `Contract: ${node.isContract ? "Yes" : "No"}`,
    // `Contract: ${node.isContract === undefined ? "Loading..." : node.isContract ? "Yes" : "No"}`,
  ];

  const boxHeight = lines.length * lineHeight + padding * 2;

  ctx.save();
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(node.x! - BOX_WIDTH / 2, node.y! - boxHeight / 2, BOX_WIDTH, boxHeight);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  lines.forEach((line, i) => {
    ctx.fillText(line, node.x! - BOX_WIDTH / 2 + padding, node.y! - boxHeight / 2 + padding + i * lineHeight);
  });

  ctx.restore();
}

export function paintNodePointerArea(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) {
  const boxHeight = 3 * LINE_HEIGHT + PADDING * 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.rect(node.x! - BOX_WIDTH / 2, node.y! - boxHeight / 2, BOX_WIDTH, boxHeight);
  ctx.fill();
}