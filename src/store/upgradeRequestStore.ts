import { create } from 'zustand';
import api from '@/lib/api';

export interface UpgradeRequest {
    id: number;
    connectionId: number;
    customerId: number;
    currentPaketId: number;
    newPaketId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestNote?: string;
    approvalNote?: string;
    requestedBy?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

interface UpgradeRequestState {
    requests: UpgradeRequest[];
    loading: boolean;
    error: string | null;

    fetchRequests: (force?: boolean) => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    createRequest: (data: Omit<UpgradeRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    approveRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    rejectRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    deleteRequest: (id: number) => Promise<void>;
}

export const useUpgradeRequestStore = create<UpgradeRequestState>((set, get) => ({
    requests: [],
    loading: false,
    error: null,

    fetchRequests: async (force = false) => {
        if (!force && get().requests.length > 0) return;
        set({ loading: true, error: null });
        try {
            const res = await api.get('/upgrade-request');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPendingRequests: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/upgrade-request/pending');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/upgrade-request', data);
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
            await api.patch(`/upgrade-request/${id}/approve`, { approvalNote, approvedBy });
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
            await api.patch(`/upgrade-request/${id}/reject`, { approvalNote, approvedBy });
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
            await api.delete(`/upgrade-request/${id}`);
            set((state) => ({
                requests: state.requests.filter((r) => r.id !== id),
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },
}));
