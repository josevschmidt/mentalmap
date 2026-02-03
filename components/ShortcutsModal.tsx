import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Tab'], desc: 'Add Child Node' },
    { keys: ['Enter'], desc: 'Add Sibling Node' },
    { keys: ['Del', 'Bksp'], desc: 'Delete Node' },
    { keys: ['Space'], desc: 'Toggle Collapse' },
    { keys: ['F'], desc: 'Toggle Focus Mode' },
    { keys: ['Ctrl', 'K'], desc: 'Search / Jump' },
    { keys: ['Dbl Click'], desc: 'Edit Text' },
    { keys: ['Esc'], desc: 'Exit Edit Mode' },
    { keys: ['Drag'], desc: 'Pan Canvas' },
    { keys: ['Scroll'], desc: 'Zoom In/Out' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <Keyboard size={20} className="text-blue-500" />
            <h2 className="font-semibold text-lg">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid gap-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">{s.desc}</span>
                <div className="flex gap-1">
                  {s.keys.map(k => (
                    <kbd key={k} className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-slate-700 font-mono shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          MindSpark AI v1.0
        </div>
      </div>
    </div>
  );
};