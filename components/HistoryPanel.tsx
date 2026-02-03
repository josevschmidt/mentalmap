import React from 'react';
import { HistoryEntry } from '../types';
import { RotateCcw, X, Clock } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onRestore }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2 text-slate-800">
          <Clock size={20} className="text-orange-500" />
          <h2 className="font-semibold text-lg">Version History</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">No history yet. Make some changes!</div>
        ) : (
          [...history].reverse().map((entry, index) => (
            <div key={entry.id} className="group relative border border-slate-100 rounded-lg p-3 hover:bg-slate-50 hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-700 text-sm capitalize">{entry.action}</span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {entry.nodes.length} nodes
              </div>
              <button
                onClick={() => onRestore(entry)}
                className="w-full py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw size={12} />
                Restore this version
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};