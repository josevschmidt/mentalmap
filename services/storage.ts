import { MindMapNode, Relationship } from '../types';
import { supabase } from './supabase';

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

export const saveMap = async (userId: string, nodes: MindMapNode[], relationships: Relationship[]): Promise<StorageResult> => {
    const data = { nodes, relationships };
    const size = calculateSize(data);

    if (size > STORAGE_LIMIT) {
        return {
            success: false,
            message: `Limit exceeded. Map size: ${(size / 1024 / 1024).toFixed(2)}MB. Limit: 1MB.`,
            usage: 100
        };
    }

    try {
        const { error } = await supabase
            .from('user_maps')
            .upsert({
                user_id: userId,
                data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return {
            success: true,
            usage: (size / STORAGE_LIMIT) * 100
        };
    } catch (e: any) {
        console.error('Save failed:', e.message);
        return {
            success: false,
            message: 'Failed to save to cloud storage: ' + e.message
        };
    }
};

export const loadMap = async (userId: string): Promise<{ nodes: MindMapNode[], relationships: Relationship[] } | null> => {
    try {
        const { data, error } = await supabase
            .from('user_maps')
            .select('data')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No row found
            throw error;
        }

        return data.data;
    } catch (e: any) {
        console.error('Load failed:', e.message);
        return null;
    }
};

export const getStorageUsage = async (userId: string): Promise<number> => {
    const data = await loadMap(userId);
    if (!data) return 0;
    return (calculateSize(data) / STORAGE_LIMIT) * 100;
};
