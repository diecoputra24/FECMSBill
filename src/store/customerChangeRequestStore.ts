import { create } from 'zustand';
import api from '@/lib/api';

export interface CustomerChangeRequest {
    id: number;
    customerId: number;

    // Current values
    currentNama: string;
    currentAlamat: string;
    currentTelepon: string;
    currentIdentitas: string;
    currentAreaId: number;
    currentOdpId?: number;
    currentOdpPortId?: number;
    currentLatitude?: number;
    currentLongitude?: number;

    // New values
    newNama: string;
    newAlamat: string;
    newTelepon: string;
    newIdentitas: string;
    newAreaId: number;
    newOdpId?: number;
    newOdpPortId?: number;
    newLatitude?: number;
    newLongitude?: number;

    // Workflow
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestNote?: string;
    approvalNote?: string;
    requestedBy?: string;
    approvedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerChangeRequestData {
    customerId: number;

    currentNama: string;
    currentAlamat: string;
    currentTelepon: string;
    currentIdentitas: string;
    currentAreaId: number;
    currentOdpId?: number;
    currentOdpPortId?: number;
    currentLatitude?: number;
    currentLongitude?: number;

    newNama: string;
    newAlamat: string;
    newTelepon: string;
    newIdentitas: string;
    newAreaId: number;
    newOdpId?: number;
    newOdpPortId?: number;
    newLatitude?: number;
    newLongitude?: number;

    requestNote?: string;
    requestedBy?: string;
}

interface CustomerChangeRequestState {
    requests: CustomerChangeRequest[];
    loading: boolean;
    error: string | null;

    fetchRequests: (force?: boolean) => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    createRequest: (data: CreateCustomerChangeRequestData) => Promise<void>;
    approveRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    rejectRequest: (id: number, approvalNote?: string, approvedBy?: string) => Promise<void>;
    deleteRequest: (id: number) => Promise<void>;
}

export const useCustomerChangeRequestStore = create<CustomerChangeRequestState>((set, get) => ({
    requests: [],
    loading: false,
    error: null,

    fetchRequests: async (force = false) => {
        if (!force && get().requests.length > 0) return;
        set({ loading: true, error: null });
        try {
            const res = await api.get('/customer-change-request');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchPendingRequests: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/customer-change-request/pending');
            set({ requests: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createRequest: async (data) => {
        set({ loading: true, error: null });
        try {
            await api.post('/customer-change-request', data);
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
            await api.patch(`/customer-change-request/${id}/approve`, { approvalNote, approvedBy });
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
            await api.patch(`/customer-change-request/${id}/reject`, { approvalNote, approvedBy });
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
            await api.delete(`/customer-change-request/${id}`);
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
