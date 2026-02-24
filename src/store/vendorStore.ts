import { create } from 'zustand';
import api from '@/lib/api';
import type { Vendor } from '@/types/vendor';

interface VendorState {
    vendors: Vendor[];
    loading: boolean;
    error: string | null;

    fetchVendors: () => Promise<void>;
    createVendor: (data: Partial<Vendor>) => Promise<Vendor>;
    updateVendor: (id: number, data: Partial<Vendor>) => Promise<Vendor>;
    deleteVendor: (id: number) => Promise<void>;
}

export const useVendorStore = create<VendorState>((set) => ({
    vendors: [],
    loading: false,
    error: null,

    fetchVendors: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/vendor');
            set({ vendors: response.data, loading: false });
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to fetch vendors', loading: false });
        }
    },

    createVendor: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/vendor', data);
            set((state) => ({ vendors: [response.data, ...state.vendors], loading: false }));
            return response.data;
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to create vendor', loading: false });
            throw err;
        }
    },

    updateVendor: async (id, data) => {
        set({ loading: true, error: null });
        try {
            const response = await api.patch(`/vendor/${id}`, data);
            set((state) => ({
                vendors: state.vendors.map((v) => (v.id === id ? response.data : v)),
                loading: false,
            }));
            return response.data;
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to update vendor', loading: false });
            throw err;
        }
    },

    deleteVendor: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/vendor/${id}`);
            set((state) => ({
                vendors: state.vendors.filter((v) => v.id !== id),
                loading: false,
            }));
        } catch (err: any) {
            set({ error: err.response?.data?.message || 'Failed to delete vendor', loading: false });
            throw err;
        }
    },
}));
