import { create } from 'zustand';
import api from '@/lib/api';

export interface DiscountRequest {
    id: number;
    customerId: number;
    currentDiscount: number;
    newDiscount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestNote?: string;
    approvalNote?: string;
    requestedBy?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDiscountRequestData {
    customerId: number;
    currentDiscount: number;
    newDiscount: number;
    requestNote?: string;
    requestedBy?: string;
}

interface FilterValues {
    search: string;
    branchId: string;
    areaId: string;
    status: string;
}

interface DiscountRequestState {
    requests: DiscountRequest[];
    loading: boolean;
    error: string | null;

    filterValues: FilterValues;
    appliedFilters: FilterValues;
    pagination: { currentPage: number; pageSize: number };

    historyFilterValues: FilterValues;
    appliedHistoryFilters: FilterValues;
    historyPagination: { currentPage: number; pageSize: number };

    selectedIds: (string | number)[];

    fetchRequests: (force?: boolean) => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    createRequest: (data: CreateDiscountRequestData) => Promise<void>;
    approveRequest: (id: number, approvalNote?: string) => Promise<void>;
    rejectRequest: (id: number, approvalNote?: string) => Promise<void>;

    setFilterValues: (values: Partial<FilterValues>) => void;
    setAppliedFilters: (values: FilterValues) => void;
    setPagination: (values: Partial<{ currentPage: number; pageSize: number }>) => void;

    setHistoryFilterValues: (values: Partial<FilterValues>) => void;
    setAppliedHistoryFilters: (values: FilterValues) => void;
    setHistoryPagination: (values: Partial<{ currentPage: number; pageSize: number }>) => void;

    setSelectedIds: (ids: (string | number)[]) => void;
    resetFilters: () => void;
    resetHistoryFilters: () => void;
}

const initialFilters: FilterValues = {
    search: "",
    branchId: "",
    areaId: "",
    status: "PENDING"
};

const initialHistoryFilters: FilterValues = {
    search: "",
    branchId: "",
    areaId: "",
    status: "all"
};

export const useDiscountRequestStore = create<DiscountRequestState>((set, get) => ({
    requests: [],
    loading: false,
    error: null,

    filterValues: initialFilters,
    appliedFilters: initialFilters,
    pagination: { currentPage: 1, pageSize: 10 },

    historyFilterValues: initialHistoryFilters,
    appliedHistoryFilters: initialHistoryFilters,
    historyPagination: { currentPage: 1, pageSize: 10 },

    selectedIds: [],

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setPagination: (values) => set((state) => ({ pagination: { ...state.pagination, ...values } })),

    setHistoryFilterValues: (values) => set((state) => ({ historyFilterValues: { ...state.historyFilterValues, ...values } })),
    setAppliedHistoryFilters: (values) => set({ appliedHistoryFilters: values }),
    setHistoryPagination: (values) => set((state) => ({ historyPagination: { ...state.historyPagination, ...values } })),

    setSelectedIds: (ids) => set({ selectedIds: ids }),

    resetFilters: () => set({
        filterValues: initialFilters,
        appliedFilters: initialFilters,
        pagination: { currentPage: 1, pageSize: 10 },
        selectedIds: [],
        requests: [],
        loading: false,
        error: null
    }),

    resetHistoryFilters: () => set({
        historyFilterValues: initialHistoryFilters,
        appliedHistoryFilters: initialHistoryFilters,
        historyPagination: { currentPage: 1, pageSize: 10 },
        requests: [],
        loading: false,
        error: null
    }),

    fetchRequests: async (force = false) => {
        if (!force && get().requests.length > 0) return;
        set({ loading: true, error: null });
        try {
            const res = await api.get('/discount-requests');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPendingRequests: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/discount-requests/pending');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/discount-requests', data);
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    approveRequest: async (id, approvalNote) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/discount-requests/${id}/approve`, { approvalNote });
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    rejectRequest: async (id, approvalNote) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/discount-requests/${id}/reject`, { approvalNote });
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

}));
