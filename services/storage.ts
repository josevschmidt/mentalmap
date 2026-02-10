import { MindMapNode, Relationship } from '../types';

const STORAGE_LIMIT = 1 * 1024 * 1024; // 1MB in bytes

export interface StorageResult {
    success: boolean;
    message?: string;
    usage?: number; // Usage in percentage
}

export const calculateSize = (data: any): number => {
    const jsonString = JSON.stringify(data);
    return new TextEncoder().encode(jsonString).length;
};

export const saveMap = (userId: string, nodes: MindMapNode[], relationships: Relationship[]): StorageResult => {
    const data = { nodes, relationships, updatedAt: Date.now() };
    const size = calculateSize(data);

    if (size > STORAGE_LIMIT) {
        return {
            success: false,
            message: `Limit exceeded. Map size: ${(size / 1024 / 1024).toFixed(2)}MB. Limit: 1MB.`,
            usage: 100
        };
    }

    try {
        localStorage.setItem(`mentalmap_data_${userId}`, JSON.stringify(data));
        return {
            success: true,
            usage: (size / STORAGE_LIMIT) * 100
        };
    } catch (e) {
        return {
            success: false,
            message: 'Failed to save to local storage (disk full?)'
        };
    }
};

export const loadMap = (userId: string): { nodes: MindMapNode[], relationships: Relationship[] } | null => {
    const data = localStorage.getItem(`mentalmap_data_${userId}`);
    if (!data) return null;
    return JSON.parse(data);
};

export const getStorageUsage = (userId: string): number => {
    const data = localStorage.getItem(`mentalmap_data_${userId}`);
    if (!data) return 0;
    return (calculateSize(data) / STORAGE_LIMIT) * 100;
};
