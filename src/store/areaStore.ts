import { create } from 'zustand';
import api from '@/lib/api';
import type { Area } from '@/types/area';

export interface AreaFormData {
    namaArea: string;
    kodeArea: string;
    branchId: string;
}

interface AreaState {
    areas: Area[];
    loading: boolean;
    error: string | null;

    // Form State
    createFormData: AreaFormData;

    filterValues: { search: string; branchId: string };
    appliedFilters: { search: string; branchId: string };
    sortConfig: { key: keyof Area; order: "asc" | "desc" };
    setFilterValues: (values: Partial<AreaState['filterValues']>) => void;
    setAppliedFilters: (values: AreaState['appliedFilters']) => void;
    setSortConfig: (config: AreaState['sortConfig']) => void;
    fetchAreas: (force?: boolean) => Promise<void>;
    addArea: (area: Partial<Area>) => Promise<void>;
    updateArea: (id: number, area: Partial<Area>) => Promise<void>;
    deleteArea: (id: number) => Promise<void>;

    setCreateFormData: (data: Partial<AreaFormData>) => void;
    resetCreateFormData: () => void;
    resetFilters: () => void;
}

const initialFormData: AreaFormData = {
    namaArea: "",
    kodeArea: "",
    branchId: ""
};

export const useAreaStore = create<AreaState>((set, get) => ({
    areas: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "", branchId: "" },
    appliedFilters: { search: "", branchId: "" },
    sortConfig: { key: "namaArea", order: "asc" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setSortConfig: (config) => set({ sortConfig: config }),
    resetFilters: () => set({ filterValues: { search: "", branchId: "" }, appliedFilters: { search: "", branchId: "" } }),

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    fetchAreas: async (force = false) => {
        // Only fetch if forced or the list is empty
        if (!force && get().areas.length > 0) return;

        set({ loading: true, error: null });
        try {


            const response = await api.get('/area');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ areas: data, loading: false });
        } catch (error: any) {
            console.error('Fetch areas error:', error);
            set({ error: error.message, loading: false });
        }
    },

    addArea: async (area) => {
        set({ loading: true, error: null });
        try {
            await api.post('/area', area);
            await get().fetchAreas(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateArea: async (id, area) => {
        set({ loading: true, error: null });
        try {
            await api.put(`/area/${id}`, area);
            await get().fetchAreas(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteArea: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/area/${id}`);
            await get().fetchAreas(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
}));
