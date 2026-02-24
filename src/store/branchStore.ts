import { create } from 'zustand';
import api from '@/lib/api';
import type { Branch } from '@/types/branch';


export interface BranchFormData {
    namaBranch: string;
    alamatBranch: string;
}

interface BranchState {
    branches: Branch[];
    loading: boolean;
    error: string | null;

    // Form State
    createFormData: BranchFormData;

    filterValues: { search: string; status: string; sortBy: string };
    appliedFilters: { search: string; status: string; sortBy: string } | null;
    sortConfig: { key: keyof Branch; order: "asc" | "desc" };
    setFilterValues: (values: Partial<BranchState['filterValues']>) => void;
    setAppliedFilters: (values: BranchState['appliedFilters']) => void;
    setSortConfig: (config: BranchState['sortConfig']) => void;
    fetchBranches: (force?: boolean) => Promise<void>;
    addBranch: (branch: Partial<Branch>) => Promise<void>;
    updateBranch: (id: number, branch: Partial<Branch>) => Promise<void>;
    deleteBranch: (id: number) => Promise<void>;

    setCreateFormData: (data: Partial<BranchFormData>) => void;
    resetCreateFormData: () => void;
    resetFilters: () => void;
}

const initialFormData: BranchFormData = {
    namaBranch: "",
    alamatBranch: ""
};

export const useBranchStore = create<BranchState>((set, get) => ({
    branches: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "", status: "active", sortBy: "latest" },
    appliedFilters: null,
    sortConfig: { key: "namaBranch", order: "asc" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setSortConfig: (config) => set({ sortConfig: config }),
    resetFilters: () => set({ filterValues: { search: "", status: "active", sortBy: "latest" }, appliedFilters: null }),

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    fetchBranches: async (force = false) => {
        // Only fetch if forced or the list is empty
        if (!force && get().branches.length > 0) return;

        set({ loading: true, error: null });
        try {


            const response = await api.get('/branch');
            // Check if data is nested under a property, common in some APIs
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ branches: data, loading: false });
        } catch (error: any) {
            console.error('Fetch branches error:', error);
            set({ error: error.message, loading: false });
        }
    },

    addBranch: async (branch) => {
        set({ loading: true, error: null });
        try {
            await api.post('/branch', branch);
            await get().fetchBranches(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    updateBranch: async (id, branch) => {
        set({ loading: true, error: null });
        try {
            await api.put(`/branch/${id}`, branch);
            await get().fetchBranches(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    deleteBranch: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/branch/${id}`);
            await get().fetchBranches(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
}));
