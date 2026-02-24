import { create } from 'zustand';
import api from '@/lib/api';

export interface Router {
    id: number;
    uuid: string;
    namaRouter: string;
    hostAddress: string;
    username: string;
    password?: string; // Optional because we might not want to display it or always send it
    apiPort: number;
    isActive: boolean;
    isolir: boolean;
    isolirProfile?: string;
    isolirScheme: string; // 'DISABLE' or 'CHANGE_PROFILE'
    createdAt?: string;
    updatedAt?: string;
}

export interface RouterFormData {
    namaRouter: string;
    hostAddress: string;
    apiPort: string;
    username: string;
    password: string;
    isActive: boolean;
    isolir: boolean;
    isolirProfile: string;
    isolirScheme: string;
}

interface RouterState {
    routers: Router[];
    loading: boolean;
    error: string | null;

    // Form State
    createFormData: RouterFormData;

    filterValues: { search: string; status: string; selectedRouterId: string };
    appliedFilters: { search: string; status: string; selectedRouterId: string };
    sortConfig: { key: keyof Router; order: "asc" | "desc" };
    setFilterValues: (values: Partial<RouterState['filterValues']>) => void;
    setAppliedFilters: (values: RouterState['appliedFilters']) => void;
    setSortConfig: (config: RouterState['sortConfig']) => void;
    fetchRouters: (force?: boolean) => Promise<void>;
    addRouter: (router: Partial<Router>) => Promise<void>;
    updateRouter: (id: string | number, router: Partial<Router>) => Promise<void>;
    deleteRouter: (id: string | number) => Promise<void>;
    testConnection: (uuid: string) => Promise<any>;
    getPppProfiles: (uuid: string) => Promise<any[]>;

    setCreateFormData: (data: Partial<RouterFormData>) => void;
    resetCreateFormData: () => void;
    resetFilters: () => void;
}

const initialFormData: RouterFormData = {
    namaRouter: "",
    hostAddress: "",
    apiPort: "8728",
    username: "",
    password: "",
    isActive: true,
    isolir: false,
    isolirProfile: "",
    isolirScheme: "DISABLE"
};

export const useRouterStore = create<RouterState>((set, get) => ({
    routers: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "", status: "all", selectedRouterId: "" },
    appliedFilters: { search: "", status: "all", selectedRouterId: "" },
    sortConfig: { key: "namaRouter", order: "asc" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setSortConfig: (config) => set({ sortConfig: config }),
    resetFilters: () => set({ filterValues: { search: "", status: "all", selectedRouterId: "" }, appliedFilters: { search: "", status: "all", selectedRouterId: "" } }),

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    fetchRouters: async (force = false) => {
        if (!force && get().routers.length > 0) return;

        set({ loading: true, error: null });
        try {
            const response = await api.get('/router');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ routers: data, loading: false });
        } catch (error: any) {
            console.error('Fetch routers error:', error);
            set({ error: error.message, loading: false });
        }
    },

    addRouter: async (router) => {
        set({ loading: true, error: null });
        try {
            await api.post('/router', router);
            await get().fetchRouters(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateRouter: async (id, router) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/router/${id}`, router);
            await get().fetchRouters(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteRouter: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/router/${id}`);
            await get().fetchRouters(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    testConnection: async (uuid: string) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/router/test/${uuid}`);
            set({ loading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    getPppProfiles: async (uuid: string) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get(`/router/profiles/${uuid}`);
            set({ loading: false });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            set({ error: error.message, loading: false });
            // Don't throw, just return empty array and log error? Or throw?
            // Throwing allows UI to show error message
            throw error;
        }
    },
}));
