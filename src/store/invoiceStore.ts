import { create } from 'zustand';
import api from '@/lib/api';
import type { Invoice } from '@/types/invoice';

export interface CreateInvoiceData {
    customerId: number;
    period: string; // YYYY-MM-DD
    items: {
        description: string;
        itemType: string;
        amount: number;
    }[];
}

interface InvoiceState {
    invoices: Invoice[];
    loading: boolean;
    error: string | null;

    filterValues: { search: string; status: string; month: string; year: string; branchId: string; areaId: string };
    appliedFilters: { search: string; status: string; month: string; year: string; branchId: string; areaId: string };

    setFilterValues: (values: Partial<InvoiceState['filterValues']>) => void;
    setAppliedFilters: (values: InvoiceState['appliedFilters']) => void;
    resetFilters: () => void;

    fetchInvoices: (force?: boolean) => Promise<void>;
    createInvoice: (data: CreateInvoiceData) => Promise<void>;
    generateNextMonth: (customerId: number) => Promise<void>;
    generateBatch: () => Promise<any>;
    getBatchInfo: () => Promise<any>;
    deleteInvoice: (id: number) => Promise<void>;
    recalculateInvoice: (id: number) => Promise<void>;
    payInvoice: (invoiceIds: number[], amountPaid: number, method: string, adminId: string, customerId: number, proofImage?: string) => Promise<void>;
    runIsolation: () => Promise<any>;
    createPromise: (data: { customerId: number; invoiceId?: number; promiseDate: string; note?: string; adminId: string }) => Promise<void>;
    fetchPromises: () => Promise<any[]>;
    deletePromise: (id: number) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
    invoices: [],
    loading: false,
    error: null,

    filterValues: { search: "", status: "", month: "", year: "", branchId: "", areaId: "" },
    appliedFilters: { search: "", status: "", month: "", year: "", branchId: "", areaId: "" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    resetFilters: () => set({
        filterValues: { search: "", status: "", month: "", year: "", branchId: "", areaId: "" },
        appliedFilters: { search: "", status: "", month: "", year: "", branchId: "", areaId: "" }
    }),

    fetchInvoices: async (force = false) => {
        if (!force && get().invoices.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/invoice');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ invoices: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createInvoice: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/invoice', data);
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    generateNextMonth: async (customerId) => {
        set({ loading: true, error: null });
        try {
            await api.post(`/invoice/generate-next-month/${customerId}`);
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    generateBatch: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/invoice/generate-batch');
            await get().fetchInvoices(true);
            set({ loading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    getBatchInfo: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/invoice/batch-info');
            set({ loading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteInvoice: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/invoice/${id}`);
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    recalculateInvoice: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.post(`/invoice/${id}/recalculate`);
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    payInvoice: async (invoiceIds, amountPaid, method, adminId, customerId, proofImage) => {
        set({ loading: true, error: null });
        try {
            await api.post('/transaction', {
                invoiceIds,
                amountPaid,
                paymentMethod: method,
                adminId,
                customerId,
                ...(proofImage ? { proofImage } : {})
            });
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    runIsolation: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/invoice/run-isolation');
            await get().fetchInvoices(true);
            set({ loading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    createPromise: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/promise-to-pay', data);
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchPromises: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/promise-to-pay');
            set({ loading: false });
            return response.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deletePromise: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/promise-to-pay/${id}`);
            await get().fetchInvoices(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));
