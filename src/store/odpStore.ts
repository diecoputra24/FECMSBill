import { create } from 'zustand';
import api from '@/lib/api';

export interface ODP {
    id: number;
    areaId: number;
    namaOdp: string;
    portOdp: number;
    latOdp: number;
    longOdp: number;
    area?: {
        id: number;
        namaArea: string;
        branchId: number;
    };
}

// Define Form Data Interface
export interface OdpFormData {
    branchId: string; // Helper for UI filtering
    areaId: string;
    namaOdp: string;
    portOdp: string; // Keep as string for input compatibility, parse when sending
    latOdp: string;
    longOdp: string;
}

interface OdpState {
    odps: ODP[];
    loading: boolean;
    error: string | null;

    // Form State (Persistent)
    createFormData: OdpFormData;

    filterValues: { search: string; branchId: string; areaId: string };
    appliedFilters: { search: string; branchId: string; areaId: string };
    sortConfig: { key: keyof ODP; order: "asc" | "desc" };

    setFilterValues: (values: Partial<OdpState['filterValues']>) => void;
    setAppliedFilters: (values: OdpState['appliedFilters']) => void;
    setSortConfig: (config: OdpState['sortConfig']) => void;

    fetchOdps: (force?: boolean) => Promise<void>;
    addOdp: (odp: Partial<ODP>) => Promise<void>;
    updateOdp: (id: number, odp: Partial<ODP>) => Promise<void>;
    deleteOdp: (id: number) => Promise<void>;

    setCreateFormData: (data: Partial<OdpFormData>) => void;
    resetCreateFormData: () => void;
    resetFilters: () => void;
}

const initialFormData: OdpFormData = {
    branchId: "",
    areaId: "",
    namaOdp: "",
    portOdp: "8",
    latOdp: "-6.2088",
    longOdp: "106.8456"
};

export const useOdpStore = create<OdpState>((set, get) => ({
    odps: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "", branchId: "", areaId: "" },
    appliedFilters: { search: "", branchId: "", areaId: "" },
    sortConfig: { key: "namaOdp", order: "asc" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setSortConfig: (config) => set({ sortConfig: config }),
    resetFilters: () => set({ filterValues: { search: "", branchId: "", areaId: "" }, appliedFilters: { search: "", branchId: "", areaId: "" } }),

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    fetchOdps: async (force = false) => {
        // Only fetch if forced or the list is empty
        if (!force && get().odps.length > 0) return;

        set({ loading: true, error: null });
        try {


            const response = await api.get('/odp');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ odps: data, loading: false });
        } catch (error: any) {
            console.error('Fetch odps error:', error);
            set({ error: error.message, loading: false });
        }
    },

    addOdp: async (odp) => {
        set({ loading: true, error: null });
        try {
            await api.post('/odp', odp);
            await get().fetchOdps(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateOdp: async (id, odp) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/odp/${id}`, odp);
            await get().fetchOdps(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteOdp: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/odp/${id}`);
            await get().fetchOdps(true);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
}));
