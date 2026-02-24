import { create } from 'zustand';
import api from '@/lib/api';
import type { Role } from '@/types/role';

interface CreateRoleInput {
    name: string;
    description?: string;
    permissionIds?: number[];
}

interface RoleState {
    roles: Role[];
    loading: boolean;
    error: string | null;

    fetchRoles: (force?: boolean) => Promise<void>;
    addRole: (role: CreateRoleInput) => Promise<void>;
    updateRole: (id: number, role: Partial<CreateRoleInput>) => Promise<void>;
    deleteRole: (id: number) => Promise<void>;
}

export const useRoleStore = create<RoleState>((set, get) => ({
    roles: [],
    loading: false,
    error: null,

    fetchRoles: async (force = false) => {
        if (!force && get().roles.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/roles');
            set({ roles: response.data, loading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },

    addRole: async (role) => {
        set({ loading: true, error: null });
        try {
            await api.post('/roles', role);
            await get().fetchRoles(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },

    updateRole: async (id, role) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/roles/${id}`, role);
            await get().fetchRoles(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },

    deleteRole: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/roles/${id}`);
            await get().fetchRoles(true);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            set({ error: message, loading: false });
        }
    },
}));
