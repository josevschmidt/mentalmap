import React, { useRef } from 'react';
import { MindMapNode, ThemeType } from '../types';

interface MinimapProps {
  nodes: MindMapNode[];
  width: number;
  height: number;
  viewTransform: { x: number; y: number; k: number };
  onNavigate: (x: number, y: number) => void;
  theme: ThemeType;
}

export const Minimap: React.FC<MinimapProps> = ({ nodes, width, height, viewTransform, onNavigate, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate bounding box of the entire graph
  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.x || 0),
      maxX: Math.max(acc.maxX, node.x || 0),
      minY: Math.min(acc.minY, node.y || 0),
      maxY: Math.max(acc.maxY, node.y || 0),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  );

  // Default bounds if no nodes
  if (bounds.minX === Infinity) {
      bounds.minX = 0; bounds.maxX = 100;
      bounds.minY = 0; bounds.maxY = 100;
  }

  // Add padding
  const padding = 100;
  const mapContentWidth = (bounds.maxX - bounds.minX) + padding * 2;
  const mapContentHeight = (bounds.maxY - bounds.minY) + padding * 2;

  // Container dimensions
  const containerW = 240;
  const containerH = 160;

  // Calculate scale to fit content into container
  const scale = Math.min(containerW / mapContentWidth, containerH / mapContentHeight);
  
  // Calculate rendered size
  const renderedW = mapContentWidth * scale;
  const renderedH = mapContentHeight * scale;

  // Calculate centering offsets (letterboxing)
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  // Viewport calculation
  // viewTransform: Screen = World * k + t
  // World = (Screen - t) / k
  // Viewport rect (in World Coords)
  const viewportWorldX = -viewTransform.x / viewTransform.k;
  const viewportWorldY = -viewTransform.y / viewTransform.k;
  const viewportWorldW = width / viewTransform.k;
  const viewportWorldH = height / viewTransform.k;

  const handleMinimapClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Click coordinates relative to the SVG container (0..240, 0..160)
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Adjust for centering offset
    const clickXInsideMap = clickX - offsetX;
    const clickYInsideMap = clickY - offsetY;

    // Convert to World Coordinates
    // mapX = (WorldX - bounds.minX + padding) * scale
    // WorldX = (mapX / scale) - padding + bounds.minX
    const worldX = (clickXInsideMap / scale) - padding + bounds.minX;
    const worldY = (clickYInsideMap / scale) - padding + bounds.minY;

    // We want to center the camera on worldX, worldY
    // t = CenterScreen - World * k
    const newX = width / 2 - worldX * viewTransform.k;
    const newY = height / 2 - worldY * viewTransform.k;
    
    onNavigate(newX, newY);
  };

  const isDark = theme === 'midnight';

  return (
    <div 
        className={`absolute bottom-6 right-6 border shadow-xl rounded-xl overflow-hidden z-40 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        style={{ width: containerW, height: containerH }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="cursor-pointer"
        onClick={handleMinimapClick}
      >
        {/* We apply offsets to center the map content */}
        <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-bounds.minX + padding}, ${-bounds.minY + padding})`}>
           {/* Background area representing the map bounds */}
           <rect 
              x={bounds.minX - padding} 
              y={bounds.minY - padding} 
              width={mapContentWidth} 
              height={mapContentHeight} 
              fill="transparent"
           />

           {nodes.map(n => (
             <rect
                key={n.id}
                x={(n.x || 0) - (n.width || 100) / 2}
                y={(n.y || 0) - (n.height || 40) / 2}
                width={n.width || 100}
                height={n.height || 40}
                fill={isDark ? '#64748b' : '#cbd5e1'}
                rx={20}
             />
           ))}
           
           {/* Viewport Indicator */}
           <rect
              x={viewportWorldX}
              y={viewportWorldY}
              width={viewportWorldW}
              height={viewportWorldH}
              fill={isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.1)'}
              stroke={isDark ? '#3b82f6' : '#ef4444'}
              strokeWidth={Math.max(2 / scale, 4)} // Ensure stroke stays visible
           />
        </g>
      </svg>
    </div>
  );
};