// components/Tooltip.tsx
import { ReactNode, useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  disabled?: boolean;
}

export const Tooltip = ({ content, children, disabled = false }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  }, [isVisible]);

  if (!disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={wrapperRef}
      className="flex-1 relative" // 🔧 CHANGED: Remove display: contents, use flex-1
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          className="fixed z-50 pointer-events-none" // 🔧 CHANGED: Use fixed positioning
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 8}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-slate-600 shadow-lg">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};