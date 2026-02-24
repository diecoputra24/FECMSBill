import { create } from 'zustand';
import api from '@/lib/api';
import type { Addon } from '@/types/addon';

interface AddonFormData {
    name: string;
    price: string;
    description: string;
}

interface AddonState {
    addons: Addon[];
    loading: boolean;
    error: string | null;

    // Form State
    createFormData: AddonFormData;

    // Filter & Sort State
    filterValues: { search: string };
    appliedFilters: { search: string };
    sortConfig: { key: keyof Addon; order: "asc" | "desc" };

    // Actions
    fetchAddons: (force?: boolean) => Promise<void>;
    addAddon: (data: AddonFormData) => Promise<void>;
    updateAddon: (id: number, data: Partial<AddonFormData>) => Promise<void>;
    deleteAddon: (id: number) => Promise<void>;

    setCreateFormData: (data: Partial<AddonFormData>) => void;
    resetCreateFormData: () => void;

    setFilterValues: (values: Partial<AddonState['filterValues']>) => void;
    setAppliedFilters: (values: AddonState['appliedFilters']) => void;
    setSortConfig: (config: AddonState['sortConfig']) => void;
    resetFilters: () => void;
}

const initialFormData: AddonFormData = {
    name: "",
    price: "",
    description: ""
};

export const useAddonStore = create<AddonState>((set, get) => ({
    addons: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "" },
    appliedFilters: { search: "" },
    sortConfig: { key: "name", order: "asc" },

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setSortConfig: (config) => set({ sortConfig: config }),
    resetFilters: () => set({
        filterValues: { search: "" },
        appliedFilters: { search: "" }
    }),

    fetchAddons: async (force = false) => {
        if (!force && get().addons.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/addon');
            set({ addons: response.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    addAddon: async (formData) => {
        set({ loading: true, error: null });
        try {
            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description
            };
            await api.post('/addon', payload);
            await get().fetchAddons(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateAddon: async (id, formData) => {
        set({ loading: true, error: null });
        try {
            const payload: any = {};
            if (formData.name) payload.name = formData.name;
            if (formData.price) payload.price = parseFloat(formData.price);
            if (formData.description !== undefined) payload.description = formData.description;

            await api.patch(`/addon/${id}`, payload);
            await get().fetchAddons(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteAddon: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/addon/${id}`);
            await get().fetchAddons(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));
