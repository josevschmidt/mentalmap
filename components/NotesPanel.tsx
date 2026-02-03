import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { MindMapNode, ThemeType } from '../types';

interface NotesPanelProps {
  nodeId: string | null;
  nodes: MindMapNode[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (id: string, note: string) => void;
  theme: ThemeType;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ nodeId, nodes, isOpen, onClose, onUpdateNote, theme }) => {
  const node = nodes.find(n => n.id === nodeId);
  const [text, setText] = useState('');

  useEffect(() => {
    if (node) {
      setText(node.note || '');
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const isDark = theme === 'midnight';
  const bgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const textareaClass = isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-700';

  return (
    <div className={`fixed inset-y-0 right-0 w-96 shadow-2xl z-[55] flex flex-col animate-in slide-in-from-right duration-200 border-l ${bgClass}`}>
      <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <FileText size={20} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
          <div className="font-semibold truncate max-w-[200px]" dangerouslySetInnerHTML={{ __html: node.text }} />
        </div>
        <button onClick={onClose} className="p-1 hover:opacity-70 rounded-full transition-opacity">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 p-4 flex flex-col gap-2">
        <textarea
          className={`w-full h-full p-4 rounded-lg resize-none outline-none focus:ring-2 focus:ring-blue-500/50 ${textareaClass}`}
          placeholder="Write your notes, ideas, or details here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => onUpdateNote(node.id, text)}
        />
      </div>
      
      <div className={`p-3 border-t text-xs text-center opacity-50 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
         Notes are auto-saved
      </div>
    </div>
  );
};