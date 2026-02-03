import React, { useState } from 'react';
import { X, FileText, Image as ImageIcon, FileJson, Loader2, FileCode } from 'lucide-react';
import { exportToPdf, exportToPng, exportToText, exportToJson } from '../utils/export';
import { MindMapNode } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MindMapNode[];
  canvasId: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, nodes, canvasId }) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (type: 'pdf' | 'png' | 'text' | 'json') => {
    setLoading(type);
    try {
      if (type === 'text') {
        const text = exportToText(nodes);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.txt';
        a.click();
      } else if (type === 'png') {
        await exportToPng(canvasId);
      } else if (type === 'pdf') {
        await exportToPdf(canvasId);
      } else if (type === 'json') {
        exportToJson(nodes);
      }
    } catch (e) {
      console.error(e);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-lg text-slate-800">Export Mind Map</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 grid gap-3">
          <button
            onClick={() => handleExport('json')}
            disabled={!!loading}
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-purple-200 hover:shadow-sm transition-all group"
          >
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200">
               {loading === 'json' ? <Loader2 size={20} className="animate-spin" /> : <FileCode size={20} />}
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-700">JSON File</div>
              <div className="text-xs text-slate-500">Save for later import</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={!!loading}
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-red-200 hover:shadow-sm transition-all group"
          >
            <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-200">
               {loading === 'pdf' ? <Loader2 size={20} className="animate-spin" /> : <FileJson size={20} />}
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-700">PDF Document</div>
              <div className="text-xs text-slate-500">Best for printing and sharing</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('png')}
            disabled={!!loading}
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-200 hover:shadow-sm transition-all group"
          >
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200">
              {loading === 'png' ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-700">PNG Image</div>
              <div className="text-xs text-slate-500">High quality image for presentations</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('text')}
            disabled={!!loading}
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-200">
               {loading === 'text' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-700">Plain Text</div>
              <div className="text-xs text-slate-500">Structured text outline</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};