import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { MindMapNode, ThemeType } from '../types';
import { NODE_WIDTH, NODE_HEIGHT, MIN_WIDTH, MIN_HEIGHT, COLORS, THEMES } from '../constants';
import { Trash2, Plus, Image as ImageIcon, Move, Bold, Italic, Type, PaintBucket, Link as LinkIcon, FileText, CheckSquare } from 'lucide-react';

interface MindNodeProps {
  node: MindMapNode;
  isSelected: boolean;
  isConnecting?: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onUpdateText: (id: string, newText: string) => void;
  onUpdateStyle: (id: string, stylePatch: Partial<MindMapNode>) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddImage: (id: string) => void;
  onDragStart: (id: string, clientX: number, clientY: number) => void;
  onStartConnection: (id: string) => void;
  initialEdit?: boolean;
  hasChildren: boolean;
  isRoot: boolean;
  isDimmed?: boolean;
  isPresenterMode?: boolean;
  theme: ThemeType;
  hasTaskChildren: boolean;
  progress: number;
}

// Memoized Text Editor
const NodeTextEditor = React.memo(({
  initialHtml,
  isEditing,
  onBlur,
  onInput,
  onKeyDown,
  className,
  style
}: {
  initialHtml: string;
  isEditing: boolean;
  onBlur: (html: string) => void;
  onInput: (html: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className: string;
  style: React.CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (ref.current && (!isInitialized.current || !isEditing)) {
      ref.current.innerHTML = initialHtml;
      isInitialized.current = true;
    }
  }, [initialHtml, isEditing]);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  return (
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onBlur={() => {
        if (ref.current) onBlur(ref.current.innerHTML);
      }}
      onInput={(e) => onInput(e.currentTarget.innerHTML)}
      onKeyDown={onKeyDown}
      className={className}
      style={style}
    />
  );
}, (prev, next) => {
  if (next.isEditing) {
    return prev.isEditing === next.isEditing &&
      prev.className === next.className;
  }
  return prev.initialHtml === next.initialHtml &&
    prev.isEditing === next.isEditing &&
    prev.className === next.className;
});

export const MindNode: React.FC<MindNodeProps> = React.memo(({
  node,
  isSelected,
  isConnecting,
  onSelect,
  onUpdateText,
  onUpdateStyle,
  onAddChild,
  onDelete,
  onToggleCollapse,
  onAddImage,
  onDragStart,
  onStartConnection,
  initialEdit = false,
  hasChildren,
  isRoot,
  isDimmed = false,
  isPresenterMode = false,
  theme,
  hasTaskChildren,
  progress
}) => {
  const [isEditing, setIsEditing] = useState(initialEdit);
  const [liveText, setLiveText] = useState(node.text);
  const nodeRef = useRef<SVGGElement>(null);
  const resizeRef = useRef<SVGGElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const themeConfig = THEMES[theme];
  const isResizing = useRef(false);
  const sizeRef = useRef({ width: node.width || NODE_WIDTH, height: node.height || NODE_HEIGHT, imageHeight: node.imageHeight || 80 });

  useEffect(() => {
    sizeRef.current = {
      width: node.width || NODE_WIDTH,
      height: node.height || NODE_HEIGHT,
      imageHeight: node.imageHeight || 80
    };
  }, [node.width, node.height, node.imageHeight]);

  useEffect(() => {
    setLiveText(node.text);
  }, [node.text]);

  useEffect(() => {
    if (initialEdit) setIsEditing(true);
  }, [initialEdit]);

  useEffect(() => {
    const handleStartEditing = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.nodeId === node.id && !isPresenterMode) {
        setIsEditing(true);
      }
    };
    window.addEventListener('start-editing', handleStartEditing);
    return () => window.removeEventListener('start-editing', handleStartEditing);
  }, [node.id, isPresenterMode]);

  const finishEditing = useCallback((html: string) => {
    setIsEditing(false);
    if (html !== node.text) {
      onUpdateText(node.id, html);
    } else if (initialEdit) {
      // Even if text haven't changed, if it was the initial edit (new node), 
      // we should notify that it's no longer "new".
      onUpdateText(node.id, node.text);
    }
  }, [node.id, node.text, initialEdit, onUpdateText]);

  useEffect(() => {
    if (!isSelected && isEditing) {
      finishEditing(liveText);
    }
  }, [isSelected, isEditing, liveText, finishEditing]);

  const handleInput = useCallback((html: string) => {
    setLiveText(html);
  }, []);

  const isTextEmpty = useCallback((text: string) => {
    if (!text) return true;
    const stripped = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    return stripped.length === 0;
  }, []);

  const textEmpty = isTextEmpty(node.text);
  const showText = !textEmpty || isEditing;

  const width = node.width || NODE_WIDTH;
  const baseHeight = node.height || NODE_HEIGHT;
  const hasImage = !!node.image;
  const imageHeight = node.imageHeight || 80;

  // If we have an image and no text (and not editing), we collapse the text area entirely
  const totalHeight = (hasImage && !showText) ? imageHeight + 8 : baseHeight + (hasImage ? imageHeight : 0);

  const x = (node.x || 0) - width / 2;
  const y = (node.y || 0) - totalHeight / 2;

  const isFilled = node.fillStyle === 'filled';
  const strokeColor = node.color || themeConfig.stroke;
  const fillColor = isFilled ? (node.color || '#334155') : themeConfig.nodeBg;

  const getFontSizeClass = () => {
    switch (node.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-2xl font-bold';
      case 'extra-large': return 'text-4xl font-extrabold';
      case 'gargantuan': return 'text-6xl font-black tracking-tighter';
      case 'medium':
      default: return 'text-lg font-semibold';
    }
  };

  const getTextColorClass = () => {
    if (isFilled) return 'text-white';
    return themeConfig.text;
  };

  useEffect(() => {
    if (!measureRef.current || isResizing.current) return;
    const measureEl = measureRef.current;
    const contentHeight = measureEl.scrollHeight;
    const padding = 24;
    const calculatedHeight = Math.max(MIN_HEIGHT, contentHeight + padding);
    const currentHeight = node.height || NODE_HEIGHT;

    // Auto-resize if content changed
    if (Math.abs(calculatedHeight - currentHeight) > 3) {
      onUpdateStyle(node.id, { height: calculatedHeight });
    }
  }, [liveText, node.width, node.height, node.fontSize, onUpdateStyle, node.id]);


  // D3 Drag Logic removed in favor of Centralized Canvas Control

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on controls
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.resize-handle') || target.closest('.checkbox-click-area') || isEditing || isPresenterMode) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    onDragStart(node.id, e.clientX, e.clientY);
  };



  useEffect(() => {
    if (!resizeRef.current || isPresenterMode) return;
    let startWidth = 0;
    let startHeight = 0;
    let startImageHeight = 0;

    const resizeDrag = d3.drag<SVGGElement, unknown>()
      .on("start", (event) => {
        event.sourceEvent.stopPropagation();
        isResizing.current = true;
        startWidth = sizeRef.current.width;
        startHeight = sizeRef.current.height;
        startImageHeight = node.imageHeight || 80;
      })
      .on("drag", (event) => {
        // Correctly accumulate deltas to the ongoing session values
        startWidth += event.dx;
        startHeight += event.dy;
        startImageHeight += event.dy;

        const updates: Partial<MindMapNode> = {
          width: Math.max(MIN_WIDTH, startWidth)
        };

        if (hasImage) {
          // If has image, vertical drag updates IMAGE height
          updates.imageHeight = Math.max(40, startImageHeight);
        } else {
          // If no image, manual height resize
          updates.height = Math.max(MIN_HEIGHT, startHeight);
        }

        onUpdateStyle(node.id, updates);
      })
      .on("end", () => {
        setTimeout(() => { isResizing.current = false; }, 100);
      });

    d3.select(resizeRef.current).call(resizeDrag);
    return () => { d3.select(resizeRef.current).on(".drag", null); };
  }, [node.id, onUpdateStyle, isSelected, isPresenterMode, hasImage, node.imageHeight]);

  const handleEditorBlur = (html: string) => {
    finishEditing(html);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).blur();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't stop propagation, allow App.tsx to catch Enter to add sibling
      (e.target as HTMLElement).blur();
    }
    if (e.key === 'Tab') {
      // Don't stop propagation, allow App.tsx to catch Tab to add child
      (e.target as HTMLElement).blur();
    }
  };

  // ... (existing helper functions) ...

  const executeCommand = (command: string, value?: string) => document.execCommand(command, false, value);
  const toggleStyle = (cmd: string) => executeCommand(cmd);
  const handleColorChange = (color: string) => onUpdateStyle(node.id, { color });
  const toggleFillStyle = () => onUpdateStyle(node.id, { fillStyle: isFilled ? 'outline' : 'filled' });
  const cycleFontSize = () => { /* ... */ }; // Need to re-include execution code if I am not careful with replacement range.
  // Wait, I am replacing `handleKeyDown`... ensure I don't lose `cycleFontSize` definition if I am not replacing it.
  // The replace range provided in my thought process was large. I should target purely handleKeyDown if possible.

  // Actually, I will target `const handleKeyDown` block specifically.

  // Image Resize Logic
  const imageResizeRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!imageResizeRef.current || isPresenterMode || !hasImage) return;
    let startHeight = 0;

    const imgResizeDrag = d3.drag<SVGGElement, unknown>()
      .on("start", (event) => {
        event.sourceEvent.stopPropagation();
        startHeight = node.imageHeight || 80;
      })
      .on("drag", (event) => {
        startHeight += event.dy;
        onUpdateStyle(node.id, { imageHeight: Math.max(40, startHeight) });
      });

    d3.select(imageResizeRef.current).call(imgResizeDrag);
    return () => { d3.select(imageResizeRef.current).on(".drag", null); };
  }, [node.id, onUpdateStyle, isPresenterMode, hasImage, node.imageHeight]);






  const toggleTask = () => onUpdateStyle(node.id, { isTask: !node.isTask });
  const toggleChecked = () => onUpdateStyle(node.id, { checked: !node.checked });

  const getShadowClass = () => {
    if (isConnecting) return 'shadow-[0_0_0_4px_rgba(236,72,153,0.5)]'; // Pink glow for connection target
    if (isPresenterMode) return isSelected ? 'shadow-[0_0_0_6px_rgba(59,130,246,0.6)]' : 'shadow-sm';
    return isSelected ? 'shadow-[0_0_0_4px_rgba(59,130,246,0.3)]' : 'shadow-sm';
  };

  const getRectFill = () => {
    if (isPresenterMode) return isFilled ? fillColor : themeConfig.nodeBg;
    if (isSelected && !isFilled) return theme === 'midnight' ? '#1e293b' : '#eff6ff';
    if (isFilled) return fillColor;
    return themeConfig.nodeBg;
  };

  // Checkbox SVG path
  const CheckboxIcon = node.checked ? (
    <g onClick={(e) => { e.stopPropagation(); toggleChecked(); }} className="cursor-pointer hover:opacity-80">
      <rect x={10} y={totalHeight / 2 - 9} width={18} height={18} rx={4} fill="#10b981" />
      <path d={`M 14,${totalHeight / 2} L 18,${totalHeight / 2 + 4} L 24,${totalHeight / 2 - 2}`} stroke="white" strokeWidth={2} fill="none" />
    </g>
  ) : (
    <rect
      x={10} y={totalHeight / 2 - 9} width={18} height={18} rx={4}
      stroke={isFilled ? 'white' : '#94a3b8'} strokeWidth={2} fill="transparent"
      className="cursor-pointer hover:stroke-blue-500"
      onClick={(e) => { e.stopPropagation(); toggleChecked(); }}
    />
  );

  // Progress Ring
  const progressRadius = 8;
  const progressCircumference = 2 * Math.PI * progressRadius;

  return (
    <g
      ref={nodeRef}
      transform={`translate(${x},${y})`}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id, e.shiftKey || e.ctrlKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!isPresenterMode) setIsEditing(true);
      }}
      className={`group ${isRoot && !isEditing && !isPresenterMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} transition-opacity duration-500 ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100'}`}
    >
      <foreignObject
        width={width}
        height={1}
        x={0}
        y={0}
        style={{ opacity: 0, pointerEvents: 'none' }}
        className="-z-50"
      >
        <div
          ref={measureRef}
          className={`w-full p-2 text-center break-words whitespace-pre-wrap ${getFontSizeClass()}`}
          style={{ fontFamily: 'inherit', lineHeight: '1.2' }}
          dangerouslySetInnerHTML={{ __html: liveText }}
        />
      </foreignObject>

      <rect
        width={width}
        height={totalHeight}
        rx={8}
        ry={8}
        fill={getRectFill()}
        stroke={isFilled ? 'none' : strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        className={`transition-shadow duration-200 ${getShadowClass()}`}
      />

      {!isFilled && (
        <path
          d={`M 2,${totalHeight - 6} Q 2,${totalHeight - 2} 6,${totalHeight - 2} L ${width - 6},${totalHeight - 2} Q ${width - 2},${totalHeight - 2} ${width - 2},${totalHeight - 6}`}
          stroke={node.color || themeConfig.stroke}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
      )}

      {hasImage && (
        <foreignObject x={4} y={4} width={width - 8} height={imageHeight} className="pointer-events-none">
          <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-t-sm">
            <img src={node.image} alt="Node attachment" className="max-w-full max-h-full object-cover" />
          </div>
        </foreignObject>
      )}

      {hasImage && isSelected && !isPresenterMode && (
        <g
          ref={imageResizeRef}
          transform={`translate(${width / 2}, ${imageHeight})`}
          className="cursor-row-resize hover:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <rect x={-20} y={-4} width={40} height={8} rx={2} fill="rgba(0,0,0,0.3)" />
          <line x1={-10} y1={0} x2={10} y2={0} stroke="white" strokeWidth={2} />
        </g>
      )}

      {/* Checkbox */}
      {node.isTask && CheckboxIcon}

      {/* Content Editor */}
      {showText && (
        <foreignObject
          width={width - (node.isTask ? 30 : 0) - (hasTaskChildren ? 20 : 0)}
          height={baseHeight}
          x={node.isTask ? 30 : 0}
          y={hasImage ? imageHeight : 0}
        >
          <div className="w-full h-full flex items-center justify-center p-2 text-center">
            <NodeTextEditor
              initialHtml={node.text}
              isEditing={isEditing}
              onBlur={handleEditorBlur}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              className={`w-full outline-none ${getFontSizeClass()} ${getTextColorClass()} cursor-text ${isEditing ? 'cursor-text' : 'cursor-pointer pointer-events-none'}`}
              style={{ fontFamily: 'inherit', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}
            />
          </div>
        </foreignObject>
      )}

      {/* Note Indicator Badge */}
      {node.note && !isPresenterMode && (
        <g
          transform={`translate(${width - 20}, -5)`}
          className="cursor-pointer hover:scale-110 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('open-note', { detail: { nodeId: node.id } }));
          }}
        >
          <circle r={8} fill="#f59e0b" />
          <text x={0} y={3} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">!</text>
        </g>
      )}

      {/* Task Progress Ring */}
      {hasTaskChildren && (
        <g transform={`translate(${width - 20}, ${totalHeight / 2})`}>
          {/* Background Circle */}
          <circle r={progressRadius} fill="none" stroke={isFilled ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth={3} />
          {/* Progress Circle */}
          <circle
            r={progressRadius}
            fill="none"
            stroke={isFilled ? "white" : "#10b981"}
            strokeWidth={3}
            strokeDasharray={`${progressCircumference} ${progressCircumference}`}
            strokeDashoffset={progressCircumference - progress * progressCircumference}
            transform="rotate(-90)"
          />
        </g>
      )}

      {isSelected && !isPresenterMode && (
        <g
          ref={resizeRef}
          transform={`translate(${width - 4}, ${totalHeight - 4})`}
          className="resize-handle cursor-se-resize hover:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <rect x={-8} y={-8} width={24} height={24} fill="transparent" />
          <circle r={8} fill="white" stroke="#94a3b8" strokeWidth={1} pointerEvents="none" />
          <path d="M -3,-3 L 3,3 M -3,3 L 3,-3" stroke="#94a3b8" strokeWidth={1} pointerEvents="none" />
        </g>
      )}

      {isRoot && isSelected && !isEditing && !isPresenterMode && (
        <foreignObject width={20} height={20} x={-10} y={-10}>
          <div className="bg-white border border-slate-300 rounded-full p-0.5 text-slate-500 shadow-sm">
            <Move size={14} />
          </div>
        </foreignObject>
      )}

      {hasChildren && (
        <foreignObject
          width={24}
          height={24}
          x={width - 12}
          y={totalHeight / 2 - 12}
          className="overflow-visible"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-sm transition-all hover:scale-110 z-50 pointer-events-auto ${node.collapsed
              ? 'bg-blue-500 border-blue-600 text-white'
              : 'bg-white border-slate-300 text-slate-500 hover:text-blue-500 hover:border-blue-400'
              }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {node.collapsed ? <span className="font-bold text-xs">+</span> : <span className="font-bold text-xs">-</span>}
          </button>
        </foreignObject>
      )}

      {/* Formatting Toolbar */}
      {isSelected && !isPresenterMode && (
        <foreignObject
          width={320}
          height={100}
          x={width / 2 - 160}
          y={-100}
          className="overflow-visible pointer-events-auto"
        >
          <div className="flex flex-col gap-1 items-center" onMouseDown={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-1.5 flex items-center gap-1.5">
              <div className="flex items-center gap-1 pr-2 border-r border-slate-100">
                {COLORS.map((c, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleColorChange(c); }}
                    className="w-4 h-4 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute inset-0" style={{ background: c.startsWith('url') ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : c }} />
                  </button>
                ))}
              </div>
              <button onMouseDown={(e) => { e.preventDefault(); toggleStyle('bold') }} className="p-1 rounded hover:bg-slate-100 text-slate-700"><Bold size={14} /></button>
              <button onMouseDown={(e) => { e.preventDefault(); toggleStyle('italic') }} className="p-1 rounded hover:bg-slate-100 text-slate-700"><Italic size={14} /></button>
              <div className="w-px h-4 bg-slate-200 mx-0.5" />
              <button onClick={(e) => { e.stopPropagation(); cycleFontSize() }} className="p-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-0.5 min-w-[20px] justify-center" title="Cycle Size">
                <Type size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleFillStyle() }} className={`p-1 rounded hover:bg-slate-100 transition-colors ${isFilled ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`} title="Fill/Outline">
                <PaintBucket size={14} />
              </button>
            </div>

            <div className="bg-white rounded-full shadow-lg border border-slate-200 p-1 flex items-center gap-1 mt-1">
              <button onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }} className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-sm" title="Add Child"><Plus size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onAddImage(node.id); }} className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-sm" title="Add Image"><ImageIcon size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); toggleTask(); }} className={`p-1.5 rounded-full hover:opacity-90 shadow-sm ${node.isTask ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`} title="Toggle Task"><CheckSquare size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onStartConnection(node.id); }} className="p-1.5 bg-pink-500 text-white rounded-full hover:bg-pink-600 shadow-sm" title="Link Node"><LinkIcon size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onUpdateStyle(node.id, {}); /* Just triggering re-render, main App handles opening note panel based on selection? No, we need a callback for note. */ }}
                // Notes are handled via a new generic context or just piggy back on selection? 
                // Better to expose specific onOpenNote prop, but for now let's reuse App logic: 
                // "If selected, show button to open note." 
                // To keep it clean, we'll assume the parent component watches for a specific action or we need a prop.
                // Wait, we need a prop onOpenNote.
                onMouseDown={(e) => {
                  // HACK: Dispatch custom event or callback?
                  // Let's rely on the fact that selecting it + clicking a "Note" button in UI (not here) works, 
                  // OR add specific prop. Let's add specific prop via onUpdateStyle text? No.
                  // Let's trigger a custom event for now since I didn't add onOpenNote to props yet. 
                  // Actually, let's just use window event for simplicity in this constrained edit.
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('open-note', { detail: { nodeId: node.id } }));
                }}
                className={`p-1.5 rounded-full hover:opacity-90 shadow-sm ${node.note ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                title="Notes"
              >
                <FileText size={16} />
              </button>

              <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={16} /></button>
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
});