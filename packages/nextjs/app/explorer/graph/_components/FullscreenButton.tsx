"use client";

import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export default function FullscreenButton({ isFullscreen, onToggle }: FullscreenButtonProps) {
  return (
    <div className="absolute top-4 right-4 z-30">
      <button
        onClick={onToggle}
        className="bg-slate-900/95 hover:bg-blue-600/90 border border-blue-400/40 rounded-lg px-3 py-2 shadow-xl transition-all hover:scale-105"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        <div className="flex items-center gap-2">
          {isFullscreen ? (
            <ArrowsPointingInIcon className="w-4 h-4 text-blue-200" />
          ) : (
            <ArrowsPointingOutIcon className="w-4 h-4 text-blue-200" />
          )}
          <span className="text-xs text-blue-200 font-medium">{isFullscreen ? "Exit" : "Fullscreen"}</span>
        </div>
      </button>
    </div>
  );
}
