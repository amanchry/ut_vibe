"use client";

import { useState, useRef, useEffect } from "react";

export default function ResizableSplitView({ left, right, defaultLeftWidth = 50 }) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [showMap, setShowMap] = useState(true); // For mobile toggle - default to map view
  const containerRef = useRef(null);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleTouchStart = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      if (!clientX) return;

      const newLeftWidth = ((clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleMouseMove, { passive: false });
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {/* Mobile: Stack vertically with toggle */}
      <div className="lg:hidden flex flex-col h-full">
        {/* Mobile Toggle Button */}
        <div className="flex gap-2 p-2 bg-white border-b border-gray-200">
          <button
            onClick={() => setShowMap(false)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !showMap
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setShowMap(true)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showMap
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Map
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {!showMap ? (
            <div className="h-full overflow-y-auto">{left}</div>
          ) : (
            <div className="h-full w-full" key={`mobile-map-${showMap}`}>
              {right}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Side-by-side with resizer */}
      <div ref={containerRef} className="hidden lg:flex h-full relative">
        {/* Left Panel */}
        <div
          className="overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          {left}
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors ${
            isResizing ? "bg-blue-600" : ""
          }`}
          style={{ userSelect: "none", touchAction: "none" }}
        >
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="overflow-hidden flex-1"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {right}
        </div>
      </div>
    </>
  );
}
