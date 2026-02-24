import { create } from 'zustand';
import api from '@/lib/api';

export interface Package {
    id: number;
    routerId: number;
    namaPaket: string;
    hargaPaket: number;
    mikrotikProfile: string;
    displayPaket: boolean;
    deskripsi?: string;
    router?: {
        namaRouter: string;
        hostAddress: string;
    };
    createdAt?: string;
    updatedAt?: string;
}
// Define Form Data Interface
export interface PackageFormData {
    routerId: string;
    namaPaket: string;
    hargaPaket: string;
    mikrotikProfile: string;
    deskripsi: string;
    displayPaket: boolean;
}

interface PackageState {
    packages: Package[];
    loading: boolean;
    error: string | null;

    // Form State (Persistent)
    createFormData: PackageFormData;

    // UI State
    filterValues: {
        search: string;
        routerId: string;
        status: string; // 'all' | 'active' | 'inactive'
    };
    appliedFilters: {
        search: string;
        routerId: string;
        status: string;
    };
    sortConfig: {
        key: keyof Package;
        order: 'asc' | 'desc';
    };

    // Actions
    fetchPackages: (force?: boolean) => Promise<void>;
    addPackage: (pkg: Partial<Package>) => Promise<void>;
    updatePackage: (id: number, pkg: Partial<Package>) => Promise<void>;
    deletePackage: (id: number) => Promise<void>;

    setCreateFormData: (data: Partial<PackageFormData>) => void;
    resetCreateFormData: () => void;

    setFilterValues: (values: Partial<PackageState['filterValues']>) => void;
    setAppliedFilters: (values: Partial<PackageState['appliedFilters']>) => void;
    setSortConfig: (config: PackageState['sortConfig']) => void;
    resetFilters: () => void;
}

const initialFormData: PackageFormData = {
    routerId: "",
    namaPaket: "",
    hargaPaket: "",
    mikrotikProfile: "",
    deskripsi: "",
    displayPaket: true
};

export const usePackageStore = create<PackageState>((set, get) => ({
    packages: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: {
        search: "",
        routerId: "", // Forced selection
        status: "all"
    },
    appliedFilters: {
        search: "",
        routerId: "", // Forced selection
        status: "all"
    },
    sortConfig: {
        key: "namaPaket",
        order: "asc"
    },

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    fetchPackages: async (force = false) => {
        // Only fetch if forced or the list is empty
        if (!force && get().packages.length > 0) return;

        set({ loading: true, error: null });
        try {
            const response = await api.get('/package');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ packages: data, loading: false });
        } catch (error: any) {
            console.error('Fetch packages error:', error);
            set({ error: error.message, loading: false });
        }
    },

    addPackage: async (pkg) => {
        set({ loading: true, error: null });
        try {
            await api.post('/package', pkg);
            await get().fetchPackages(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updatePackage: async (id, pkg) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/package/${id}`, pkg);
            await get().fetchPackages(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deletePackage: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/package/${id}`);
            await get().fetchPackages(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    setFilterValues: (values) => set((state) => ({
        filterValues: { ...state.filterValues, ...values }
    })),

    setAppliedFilters: (values) => set((state) => ({
        appliedFilters: { ...state.appliedFilters, ...values }
    })),

    setSortConfig: (config) => set({ sortConfig: config }),

    resetFilters: () => set({
        filterValues: { search: "", routerId: "", status: "all" },
        appliedFilters: { search: "", routerId: "", status: "all" },
        sortConfig: { key: "namaPaket", order: "asc" }
    })
}));
