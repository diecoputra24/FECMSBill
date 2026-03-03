import { create } from 'zustand';
import api from '@/lib/api';

export interface ConnectionChangeRequest {
    id: number;
    connectionId: number;
    customerId: number;

    // Current values
    currentPppUsername?: string;
    currentPppPassword?: string;
    currentPppService?: string;
    currentSecretMode?: string;
    currentPaketId?: number;

    // New values
    newPppUsername?: string;
    newPppPassword?: string;
    newPppService?: string;
    newSecretMode?: string;
    newPaketId?: number;

    // Workflow
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestNote?: string;
    approvalNote?: string;
    requestedBy?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateConnectionChangeRequestData {
    connectionId: number;
    customerId: number;

    currentPppUsername?: string;
    currentPppPassword?: string;
    currentPppService?: string;
    currentSecretMode?: string;
    currentPaketId?: number;

    newPppUsername?: string;
    newPppPassword?: string;
    newPppService?: string;
    newSecretMode?: string;
    newPaketId?: number;

    requestNote?: string;
    requestedBy?: string;
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

interface ConnectionChangeRequestState {
    requests: ConnectionChangeRequest[];
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
    fetchPendingRequests: () => Promise<void>;
    createRequest: (data: CreateConnectionChangeRequestData) => Promise<void>;
    approveRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    rejectRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    deleteRequest: (id: number) => Promise<void>;
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

export const useConnectionChangeRequestStore = create<ConnectionChangeRequestState>((set, get) => ({
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
            const res = await api.get('/connection-change-request');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPendingRequests: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/connection-change-request/pending');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/connection-change-request', data);
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    approveRequest: async (id, approvalNote, approvedBy) => {
        set({ loading: true, error: null });
        try {
            await api.patch(`/connection-change-request/${id}/approve`, { approvalNote, approvedBy });
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
            await api.patch(`/connection-change-request/${id}/reject`, { approvalNote, approvedBy });
            await get().fetchRequests(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteRequest: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/connection-change-request/${id}`);
            set((state) => ({
                requests: state.requests.filter((r) => r.id !== id),
                loading: false,
            }));
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
