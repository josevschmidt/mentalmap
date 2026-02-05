import React from 'react';
import { Search, MousePointer2, Plus, CornerDownRight, Maximize2 } from 'lucide-react';

interface KeyProps {
  children: React.ReactNode;
  className?: string;
}

const Key: React.FC<KeyProps> = ({ children, className = "" }) => (
  <kbd className={`
    inline-flex items-center justify-center px-1.5 py-0.5 
    bg-white border-b-4 border-slate-300 rounded-md 
    text-[10px] font-bold text-slate-700 font-mono 
    shadow-sm min-w-[24px]
    ${className}
  `}>
    {children}
  </kbd>
);

const HintItem: React.FC<{ icon: React.ReactNode, keys: string[], label: string }> = ({ icon, keys, label }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 backdrop-blur-md border border-white/50 rounded-full shadow-sm group hover:bg-white/60 transition-all duration-300">
    <div className="flex -space-x-1">
      {keys.map((k, i) => (
        <Key key={i} className={i > 0 ? "transform translate-y-[1px]" : ""}>{k}</Key>
      ))}
    </div>
    <div className="h-3 w-px bg-slate-200 mx-0.5" />
    <div className="flex items-center gap-1.5 text-slate-600">
      <span className="scale-75 opacity-70 group-hover:opacity-100 group-hover:scale-90 transition-all">
        {icon}
      </span>
      <span className="text-[11px] font-semibold tracking-tight uppercase">{label}</span>
    </div>
  </div>
);

export const ShortcutHints: React.FC = () => {
  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 pointer-events-none select-none">
      <div className="flex flex-col gap-1.5 transform hover:scale-[1.02] transition-transform duration-500 pointer-events-auto origin-bottom-left">
        <HintItem 
          keys={['Tab']} 
          icon={<Plus size={14} />} 
          label="Child" 
        />
        <HintItem 
          keys={['Ent']} 
          icon={<Plus size={14} className="rotate-90" />} 
          label="Sibling" 
        />
        <HintItem 
          keys={['Sft', 'Tab']} 
          icon={<MousePointer2 size={12} />} 
          label="Parent" 
        />
        <HintItem 
          keys={['Ctrl', 'K']} 
          icon={<Search size={14} />} 
          label="Search" 
        />
        <HintItem 
          keys={['F']} 
          icon={<Maximize2 size={14} />} 
          label="Focus" 
        />
      </div>
    </div>
  );
};
