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

interface CustomerStatusRequestState {
    requests: CustomerStatusRequest[];
    loading: boolean;
    error: string | null;
    fetchRequests: (pendingOnly?: boolean) => Promise<void>;
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
}

export const useCustomerStatusRequestStore = create<CustomerStatusRequestState>((set, get) => ({
    requests: [],
    loading: false,
    error: null,

    fetchRequests: async (pendingOnly = false) => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/customer-status-request', {
                params: pendingOnly ? { pending: 'true' } : undefined,
            });
            set({ requests: response.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    createRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/customer-status-request', data);
            await get().fetchRequests();
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
            await get().fetchRequests();
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
            await get().fetchRequests();
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
}));
