//Purpose:
// Controls how links look between nodes, particularly for directional edges and curved lines.

import { GraphNode, GraphLink } from "../graph-data/types";
import { HUES } from "./graphConstants";

export function getLinkCurvature(link: GraphLink, allLinks: GraphLink[]): number {
  const i = link.curvatureIndex ?? 0;
  const sourceId = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
  const targetId = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;

  const relatedLinks = allLinks.filter(l => {
    const lSource = typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
    const lTarget = typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
    return lSource === sourceId && lTarget === targetId;
  });

  const total = relatedLinks.length;
  if (total === 1) return 0;

  const mid = Math.floor(total / 2);
  const offset = i - mid;

  if (total % 2 === 1 && i === mid) return 0;

  const direction = offset < 0 ? -1 : 1;
  return direction * (0.15 + Math.abs(offset) * 0.15);
}

export function getLinkColor(link: GraphLink): string {
  const hue = HUES[(link.curvatureIndex ?? 0) % HUES.length];
  return `hsl(${hue}, 100%, 50%)`;
}