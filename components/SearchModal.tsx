import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { MindMapNode } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MindMapNode[];
  onSelectNode: (id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, nodes, onSelectNode }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    setQuery('');
    setActiveIndex(0);
  }, [isOpen]);

  const filteredNodes = nodes.filter(n => 
    n.text.replace(/<[^>]*>/g, '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8); // Limit to 8 results

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredNodes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredNodes.length) % filteredNodes.length);
    } else if (e.key === 'Enter') {
      if (filteredNodes.length > 0) {
        onSelectNode(filteredNodes[activeIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-start justify-center pt-[15vh]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search ideas..."
            className="flex-1 outline-none text-lg text-slate-800 placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
          {filteredNodes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No matching nodes found</div>
          ) : (
            filteredNodes.map((node, i) => (
              <button
                key={node.id}
                onClick={() => {
                  onSelectNode(node.id);
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 flex items-center justify-between group transition-colors ${i === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className={`w-2 h-2 rounded-full shrink-0 ${node.color ? '' : 'bg-slate-300'}`} style={{ backgroundColor: node.color }} />
                   <span className="truncate text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: node.text }} />
                </div>
                {i === activeIndex && <CornerDownLeft size={16} className="text-slate-400" />}
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
           <span>Select to jump</span>
           <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
};