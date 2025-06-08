//Purpose:
// Defines how each node looks on the canvas, and how big the pointer area should be.
//Key Exports:
// 	•	drawNode(node, ctx, globalScale)
// ➜ Renders a styled white rectangle with optional text (e.g., address, balance, contract status)
// 	•	paintNodePointerArea(node, color, ctx)
// ➜ Expands the pointer hitbox to match the full box area, not just the center point

import { GraphNode } from "../graph-data/types";

export function drawNode(node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) {
  // Dynamic scaling
  const baseFont = 13;
  const basePadding = 10;
  const baseBoxWidth = 140;
  const minFont = 9;
  const scale = Math.max(0.7, Math.min(1.5, 1 / globalScale));

  const fontSize = Math.max(minFont, baseFont * scale);
  const padding = basePadding * scale;
  const boxWidth = baseBoxWidth * scale;
  const lineHeight = fontSize + 4 * scale;

  // Colors (daisyUI/scaffold-eth2 inspired)
  const bgColor = "#fff";
  const borderColor = node.isContract ? "#6366f1" : "#d1d5db"; // Indigo for contracts, gray for EOA
  const textColor = "#222";
  const iconColor = node.isContract ? "#6366f1" : "#3b82f6"; // Indigo or blue

  // Address and balance
  const label = (node.label ?? node.id) || "Unknown";
  const shortAddr = `${label.slice(0, 6)}...${label.slice(-4)}`;
  const icon = node.isContract ? "📄" : "👤";
  const lines = [
    `${icon} ${shortAddr}`,
    `Ξ ${node.balance || "0.0"} ETH`,
  ];

  const boxHeight = lines.length * lineHeight + padding * 2;

  ctx.save();

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.10)";
  ctx.shadowBlur = 6 * scale;

  // Rounded rectangle
  const x = node.x! - boxWidth / 2;
  const y = node.y! - boxHeight / 2;
  const radius = 12 * scale;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + boxWidth - radius, y);
  ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
  ctx.lineTo(x + boxWidth, y + boxHeight - radius);
  ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
  ctx.lineTo(x + radius, y + boxHeight);
  ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Icon (draw separately for color)
  ctx.save();
  ctx.font = `bold ${fontSize + 2}px Inter, sans-serif`;
  ctx.fillStyle = iconColor;
  ctx.fillText(icon, x + padding, y + padding - 1 * scale);
  ctx.restore();

  // Address (next to icon)
  ctx.fillText(shortAddr, x + padding + fontSize * 1.6, y + padding);

  // Balance (below)
  ctx.font = `normal ${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = "#666";
  ctx.fillText(lines[1], x + padding, y + padding + lineHeight);

  ctx.restore();
}

// Pointer area (keep as is, but match box shape if you want)
export function paintNodePointerArea(node: GraphNode, color: string, ctx: CanvasRenderingContext2D) {
  const baseFont = 13;
  const basePadding = 10;
  const baseBoxWidth = 140;
  const minFont = 9;
  const scale = 1; // Use 1 for pointer area

  const fontSize = Math.max(minFont, baseFont * scale);
  const padding = basePadding * scale;
  const boxWidth = baseBoxWidth * scale;
  const lineHeight = fontSize + 4 * scale;
  const boxHeight = 2 * lineHeight + padding * 2;

  const x = node.x! - boxWidth / 2;
  const y = node.y! - boxHeight / 2;
  const radius = 12 * scale;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + boxWidth - radius, y);
  ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
  ctx.lineTo(x + boxWidth, y + boxHeight - radius);
  ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
  ctx.lineTo(x + radius, y + boxHeight);
  ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}