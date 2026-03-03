import { create } from 'zustand';
import api from '@/lib/api';

export interface CustomerStatusRequest {
    id: number;
    customerId: number;
    currentStatus: string;
    newStatus: string;
    reason: string | null;
    status: string; // PENDING, APPROVED, REJECTED
    requestNote: string | null;
    approvalNote: string | null;
    requestedBy: string | null;
    approvedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FilterValues {
    search: string;
    branchId: string;
    areaId: string;
    status: string;
}

export interface Pagination {
    currentPage: number;
    pageSize: number;
}

interface CustomerStatusRequestState {
    requests: CustomerStatusRequest[];
    loading: boolean;
    error: string | null;

    // Filter & Pagination State
    filterValues: FilterValues;
    appliedFilters: FilterValues;
    pagination: Pagination;

    // History-specific State
    historyFilterValues: FilterValues;
    appliedHistoryFilters: FilterValues;
    historyPagination: Pagination;

    setFilterValues: (values: Partial<FilterValues>) => void;
    setAppliedFilters: (values: FilterValues) => void;
    setPagination: (values: Partial<Pagination>) => void;

    setHistoryFilterValues: (values: Partial<FilterValues>) => void;
    setAppliedHistoryFilters: (values: FilterValues) => void;
    setHistoryPagination: (values: Partial<Pagination>) => void;

    selectedIds: (string | number)[];
    setSelectedIds: (ids: (string | number)[]) => void;
    fetchRequests: (force?: boolean) => Promise<void>;
    createRequest: (data: {
        customerId: number;
        currentStatus: string;
        newStatus: string;
        reason?: string;
        requestNote?: string;
        requestedBy?: string;
    }) => Promise<CustomerStatusRequest>;
    approveRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    rejectRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
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

export const useCustomerStatusRequestStore = create<CustomerStatusRequestState>((set, get) => ({
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

    setSelectedIds: (ids) => set({ selectedIds: ids }),

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setPagination: (values) => set((state) => ({ pagination: { ...state.pagination, ...values } })),

    setHistoryFilterValues: (values) => set((state) => ({ historyFilterValues: { ...state.historyFilterValues, ...values } })),
    setAppliedHistoryFilters: (values) => set({ appliedHistoryFilters: values }),
    setHistoryPagination: (values) => set((state) => ({ historyPagination: { ...state.historyPagination, ...values } })),

    fetchRequests: async (force = false) => {
        if (!force && get().requests.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/customer-status-request');
            set({ requests: response.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/customer-status-request', data);
            await get().fetchRequests(true);
            set({ loading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    approveRequest: async (id, approvalNote, approvedBy) => {
        set({ loading: true, error: null });
        try {
            await api.post(`/customer-status-request/${id}/approve`, {
                approvalNote,
                approvedBy,
            });
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    rejectRequest: async (id, approvalNote, approvedBy) => {
        set({ loading: true, error: null });
        try {
            await api.post(`/customer-status-request/${id}/reject`, {
                approvalNote,
                approvedBy,
            });
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    resetFilters: () => set({
        filterValues: initialFilters,
        appliedFilters: initialFilters,
        pagination: { currentPage: 1, pageSize: 10 },
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
}));
