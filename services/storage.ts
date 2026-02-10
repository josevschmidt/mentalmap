import { MindMapNode, Relationship } from '../types';
import { supabase } from './supabase';

const STORAGE_LIMIT = 1 * 1024 * 1024; // 1MB in bytes

export interface MindMap {
    id: string;
    user_id: string;
    name: string;
    data: {
        nodes: MindMapNode[];
        relationships: Relationship[];
    };
    updated_at: string;
}

export interface StorageResult {
    success: boolean;
    message?: string;
    usage?: number; // Usage in percentage
    mapId?: string;
}

export const calculateSize = (data: any): number => {
    const jsonString = JSON.stringify(data);
    return new TextEncoder().encode(jsonString).length;
};

export const listMaps = async (userId: string): Promise<MindMap[]> => {
    try {
        const { data, error } = await supabase
            .from('user_maps')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (e: any) {
        console.error('List maps failed:', e.message);
        return [];
    }
};

export const saveMap = async (
    userId: string,
    nodes: MindMapNode[],
    relationships: Relationship[],
    mapId?: string,
    name: string = 'Untitled Map'
): Promise<StorageResult> => {
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
        const payload: any = {
            user_id: userId,
            name: name,
            data,
            updated_at: new Date().toISOString()
        };

        if (mapId) payload.id = mapId;

        const { data: resultData, error } = await supabase
            .from('user_maps')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            usage: (size / STORAGE_LIMIT) * 100,
            mapId: resultData?.id
        };
    } catch (e: any) {
        console.error('Save failed:', e.message);
        return {
            success: false,
            message: 'Failed to save to cloud storage: ' + e.message
        };
    }
};

export const loadMap = async (mapId: string): Promise<MindMap | null> => {
    try {
        const { data, error } = await supabase
            .from('user_maps')
            .select('*')
            .eq('id', mapId)
            .single();

        if (error) throw error;
        return data;
    } catch (e: any) {
        console.error('Load failed:', e.message);
        return null;
    }
};

export const deleteMap = async (mapId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_maps')
            .delete()
            .eq('id', mapId);

        if (error) throw error;
        return true;
    } catch (e: any) {
        console.error('Delete failed:', e.message);
        return false;
    }
};

export const updateMapName = async (mapId: string, name: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_maps')
            .update({ name, updated_at: new Date().toISOString() })
            .eq('id', mapId);

        if (error) throw error;
        return true;
    } catch (e: any) {
        console.error('Update name failed:', e.message);
        return false;
    }
};

export const getStorageUsage = async (userId: string): Promise<number> => {
    try {
        const maps = await listMaps(userId);
        const totalSize = maps.reduce((sum, map) => sum + calculateSize(map.data), 0);
        return Math.min((totalSize / STORAGE_LIMIT) * 100, 100);
    } catch (e) {
        console.error('Get storage usage failed:', e);
        return 0;
    }
};
