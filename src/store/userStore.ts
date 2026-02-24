import { create } from 'zustand';
import api from '@/lib/api';
import type { User } from '@/types/user';

interface UserState {
    users: User[];
    loading: boolean;
    error: string | null;

    filterValues: { search: string; roleId: string; branchId: string };
    fetchUsers: (force?: boolean) => Promise<void>;
    addUser: (data: any) => Promise<void>;
    updateUser: (id: string, data: any) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    setFilterValues: (values: Partial<UserState['filterValues']>) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    loading: false,
    error: null,
    filterValues: { search: "", roleId: "", branchId: "" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),

    fetchUsers: async (force = false) => {
        if (!force && get().users.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/users');
            set({ users: response.data, loading: false });
        } catch (error: any) {
            console.error('Fetch users error:', error);
            set({ error: error.message || "Failed to fetch users", loading: false });
        }
    },

    addUser: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/users', data);
            await get().fetchUsers(true);
        } catch (error: any) {
            set({ error: error.message || "Failed to add user", loading: false });
            throw error; // Let UI handle success/fail feedback
        }
    },

    updateUser: async (id, data) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/users/${id}`, data);
            await get().fetchUsers(true);
        } catch (error: any) {
            set({ error: error.message || "Failed to update user", loading: false });
            throw error;
        }
    },

    deleteUser: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/users/${id}`);
            await get().fetchUsers(true);
        } catch (error: any) {
            set({ error: error.message || "Failed to delete user", loading: false });
            throw error;
        }
    }
}));
