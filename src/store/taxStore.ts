import { create } from 'zustand';
import api from '@/lib/api';
import type { Tax } from '@/types/tax';

interface TaxFormData {
    name: string;
    value: string;
    isActive: boolean;
}

interface TaxState {
    taxes: Tax[];
    loading: boolean;
    error: string | null;

    // Form State
    createFormData: TaxFormData;

    // Filter State
    filterValues: { search: string };
    appliedFilters: { search: string };

    // Actions
    fetchTaxes: (force?: boolean) => Promise<void>;
    addTax: (data: TaxFormData) => Promise<void>;
    updateTax: (id: number, data: Partial<TaxFormData>) => Promise<void>;
    deleteTax: (id: number) => Promise<void>;

    setCreateFormData: (data: Partial<TaxFormData>) => void;
    resetCreateFormData: () => void;

    setFilterValues: (values: Partial<TaxState['filterValues']>) => void;
    setAppliedFilters: (values: TaxState['appliedFilters']) => void;
    resetFilters: () => void;
}

const initialFormData: TaxFormData = {
    name: "",
    value: "",
    isActive: true
};

export const useTaxStore = create<TaxState>((set, get) => ({
    taxes: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "" },
    appliedFilters: { search: "" },

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    resetFilters: () => set({
        filterValues: { search: "" },
        appliedFilters: { search: "" }
    }),

    fetchTaxes: async (force = false) => {
        if (!force && get().taxes.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/tax');
            set({ taxes: response.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    addTax: async (formData) => {
        set({ loading: true, error: null });
        try {
            const payload = {
                name: formData.name,
                value: parseInt(formData.value),
                isActive: formData.isActive
            };
            await api.post('/tax', payload);
            await get().fetchTaxes(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateTax: async (id, formData) => {
        set({ loading: true, error: null });
        try {
            const payload: any = {};
            if (formData.name) payload.name = formData.name;
            if (formData.value) payload.value = parseInt(formData.value);
            if (formData.isActive !== undefined) payload.isActive = formData.isActive;

            await api.patch(`/tax/${id}`, payload);
            await get().fetchTaxes(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteTax: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/tax/${id}`);
            await get().fetchTaxes(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));
