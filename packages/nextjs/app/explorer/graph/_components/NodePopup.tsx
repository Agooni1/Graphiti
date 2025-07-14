"use client";

import { PositionedNode } from "../graphLayouts";
import { BlockieAvatar } from "~~/components/scaffold-eth";

interface NodePopupProps {
  node: PositionedNode;
  x: number;
  y: number;
  linkCount: number; // Pass this instead of calculating it
  selectedChain: "ethereum" | "sepolia" | "arbitrum" | "base";
  canvasSize: { width: number; height: number };
  isFullscreen: boolean;
  onClose: () => void;
  onSetTarget?: (address: string) => void;
}

const EXPLORER_URLS: Record<string, string> = {
  ethereum: "https://etherscan.io/address/",
  sepolia: "https://sepolia.etherscan.io/address/",
  arbitrum: "https://arbiscan.io/address/",
  base: "https://basescan.org/address/",
};

const EXPLORER_NAMES = {
  ethereum: "Etherscan",
  sepolia: "Etherscan",
  arbitrum: "Arbiscan",
  base: "BaseScan",
};

export default function NodePopup({
  node,
  x,
  y,
  linkCount, // Use the passed value
  selectedChain,
  canvasSize,
  isFullscreen,
  onClose,
  onSetTarget,
}: NodePopupProps) {
  const formatBalance = (balance: string | undefined): string => {
    if (!balance) return "0";
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.001) return num.toExponential(2);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    if (num < 1000000) return (num / 1000).toFixed(1) + "K";
    return (num / 1000000).toFixed(1) + "M";
  };

  const getNodeColor = (node: PositionedNode): string => {
    switch (node.galaxyLayer) {
      case "core":
        return node.isContract ? "#ff6b6b" : "#ffd93d";
      case "inner":
        return "#74b9ff";
      case "outer":
        return "#ffffff";
      case "halo":
        return "#a0a0a0";
      default:
        return "#a0a0a0";
    }
  };

  const handleExplorerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${EXPLORER_URLS[selectedChain]}${node.id}`, "_blank");
  };

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSetTarget) {
      onSetTarget(node.id);
    }
    onClose();
  };

  const indicatorColor = getNodeColor(node);

  return (
    <div
      className="absolute z-50 pointer-events-auto node-popup"
      style={{
        left: Math.min(x, (isFullscreen ? window.innerWidth : canvasSize.width) - 220),
        top: Math.max(10, Math.min(y - 80, (isFullscreen ? window.innerHeight : canvasSize.height) - 160)),
      }}
    >
      <div
        className="relative rounded-lg shadow-2xl p-3 w-[200px] border"
        style={{
          background:
            "linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(42, 24, 16, 0.95) 100%)",
          borderColor: "rgba(97, 218, 251, 0.3)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 0 30px rgba(97, 218, 251, 0.2), 0 0 60px rgba(97, 218, 251, 0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: "rgba(97, 218, 251, 0.2)" }}>
          <div
            className="w-2 h-2 rounded-full relative"
            style={{
              backgroundColor: indicatorColor,
              boxShadow: `0 0 8px ${indicatorColor}, 0 0 16px ${indicatorColor}40`,
            }}
          >
            <div
              className="absolute inset-0 w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: indicatorColor,
                filter: "blur(1px)",
                opacity: 0.6,
              }}
            />
          </div>

          <BlockieAvatar address={node.id} size={16} />

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "#e1e5f2" }}>
              {node.id.slice(0, 6)}...{node.id.slice(-4)}
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle p-0 min-h-4 h-4 w-4 hover:bg-white/10"
            style={{ color: "rgba(225, 229, 242, 0.5)" }}
          >
            ✕
          </button>
        </div>

        {/* Balance */}
        <div className="mb-3">
          <div className="text-[10px] mb-1" style={{ color: "rgba(97, 218, 251, 0.7)" }}>
            Balance
          </div>
          <div
            className="text-sm font-bold"
            style={{
              color: "#e1e5f2",
              textShadow: "0 0 10px rgba(97, 218, 251, 0.5)",
            }}
          >
            {formatBalance(node.balance)} ETH
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1 mb-3 text-[10px]">
          <div
            className="rounded p-1.5 border"
            style={{
              background: "rgba(97, 218, 251, 0.05)",
              borderColor: "rgba(97, 218, 251, 0.2)",
            }}
          >
            <div style={{ color: "rgba(97, 218, 251, 0.7)" }}>Type</div>
            <div className="font-semibold text-xs" style={{ color: "#e1e5f2" }}>
              {node.isContract ? "Contract" : "Wallet"}
            </div>
          </div>
          <div
            className="rounded p-1.5 border"
            style={{
              background: "rgba(97, 218, 251, 0.05)",
              borderColor: "rgba(97, 218, 251, 0.2)",
            }}
          >
            <div style={{ color: "rgba(97, 218, 251, 0.7)" }}>Links</div>
            <div className="font-semibold text-xs" style={{ color: "#e1e5f2" }}>
              {linkCount}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            onClick={handleExplorerClick}
            className="flex-1 text-[10px] h-6 rounded transition-all duration-200 font-medium cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(97, 218, 251, 0.8) 0%, rgba(116, 185, 255, 0.8) 100%)",
              color: "#0a0a0a",
              border: "1px solid rgba(97, 218, 251, 0.5)",
              boxShadow: "0 0 10px rgba(97, 218, 251, 0.3)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 15px rgba(97, 218, 251, 0.5)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 0 10px rgba(97, 218, 251, 0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {EXPLORER_NAMES[selectedChain]}
          </button>

          {onSetTarget && (
            <button
              onClick={handleTargetClick}
              className="flex-1 text-[10px] h-6 rounded transition-all duration-200 font-medium cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(255, 215, 100, 0.8) 0%, rgba(255, 107, 107, 0.8) 100%)",
                color: "#0a0a0a",
                border: "1px solid rgba(255, 215, 100, 0.5)",
                boxShadow: "0 0 10px rgba(255, 215, 100, 0.3)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 215, 100, 0.5)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 0 10px rgba(255, 215, 100, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Target
            </button>
          )}
        </div>

        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 0%, rgba(97, 218, 251, 0.1) 50%, transparent 100%)",
            zIndex: -1,
          }}
        />
      </div>
    </div>
  );
}
