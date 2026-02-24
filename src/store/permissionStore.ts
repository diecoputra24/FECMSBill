import { create } from 'zustand';
import api from '@/lib/api';
import type { Permission } from '@/types/permission';

interface PermissionState {
    permissions: Permission[];
    loading: boolean;
    error: string | null;

    fetchPermissions: (force?: boolean) => Promise<void>;
    addPermission: (permission: Partial<Permission>) => Promise<void>;
    updatePermission: (id: number, permission: Partial<Permission>) => Promise<void>;
    deletePermission: (id: number) => Promise<void>;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
    permissions: [],
    loading: false,
    error: null,

    fetchPermissions: async (force = false) => {
        if (!force && get().permissions.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/permissions');
            set({ permissions: response.data, loading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },

    addPermission: async (permission) => {
        set({ loading: true, error: null });
        try {
            await api.post('/permissions', permission);
            await get().fetchPermissions(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },

    updatePermission: async (id, permission) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/permissions/${id}`, permission);
            await get().fetchPermissions(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },

    deletePermission: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/permissions/${id}`);
            await get().fetchPermissions(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },
}));
