import React from 'react';
import { MindMapNode } from '../types';
import { getLinkPath } from '../utils/treeLayout';

interface ConnectionProps {
  source: MindMapNode;
  target: MindMapNode;
  isDimmed?: boolean;
}

export const Connection: React.FC<ConnectionProps> = ({ source, target, isDimmed }) => {
  const d = getLinkPath(source, target);

  return (
    <path
      d={d}
      fill="none"
      stroke={'#9ca3af'}
      strokeWidth="2"
      strokeOpacity={isDimmed ? 0.1 : 0.6}
      className={`transition-all duration-500 ease-in-out ${isDimmed ? 'grayscale' : ''}`}
    />
  );
};