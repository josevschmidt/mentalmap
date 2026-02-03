import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MindMapNode } from '../types';
import { ROOT_NODE_ID } from '../constants';

export const exportToText = (nodes: MindMapNode[]): string => {
  let output = '';
  
  const buildText = (nodeId: string, depth: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const indent = '  '.repeat(depth);
    output += `${indent}- ${node.text}\n`;
    
    const children = nodes.filter(n => n.parentId === nodeId);
    children.forEach(c => buildText(c.id, depth + 1));
  };

  buildText(ROOT_NODE_ID, 0);
  return output;
};

export const exportToJson = (nodes: MindMapNode[]): void => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `mindmap-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link); // Required for FF
  link.click();
  link.remove();
};

export const exportToPng = async (elementId: string): Promise<void> => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');
  
  try {
    const dataUrl = await toPng(el, { backgroundColor: '#f8fafc', cacheBust: true });
    const link = document.createElement('a');
    link.download = `mindmap-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('PNG Export failed', err);
    throw err;
  }
};

export const exportToPdf = async (elementId: string): Promise<void> => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Element not found');

  try {
    const dataUrl = await toPng(el, { backgroundColor: '#f8fafc', cacheBust: true });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px' });
    
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Scale image to fit page maintaining aspect ratio
    const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
    const width = imgProps.width * ratio;
    const height = imgProps.height * ratio;
    
    // Center logic
    const x = (pdfWidth - width) / 2;
    const y = (pdfHeight - height) / 2;

    pdf.addImage(dataUrl, 'PNG', x, y, width, height);
    pdf.save(`mindmap-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('PDF Export failed', err);
    throw err;
  }
};