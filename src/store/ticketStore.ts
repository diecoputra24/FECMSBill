import { create } from 'zustand';
import api from '@/lib/api';

export interface TicketUpdate {
    id: number;
    ticketId: number;
    updatedBy: string;
    updatedByRole: string;
    note: string;
    images?: string;
    statusBefore?: string;
    statusAfter?: string;
    isEscalation: boolean;
    createdAt: string;
}

export interface Ticket {
    id: number;
    ticketNumber: string;
    category: string; // INCIDENT | COMPLAINT
    customerId?: number;
    subject: string;
    description: string;
    priority: string;
    source: string;
    status: string;
    isEscalated: boolean;
    needDispatch: boolean;
    createdBy?: string;
    createdByRole?: string;
    assignedTo?: string;
    dispatchedTo?: string;
    claimedBy?: string;
    claimedByName?: string;
    claimedAt?: string;
    resolvedBy?: string;
    closedBy?: string;
    slaCsDays: number;
    slaTechDays: number;
    slaDeadlineCs?: string;
    slaDeadlineTech?: string;
    dispatchedAt?: string;
    resolvedAt?: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: number;
        idPelanggan: string;
        namaPelanggan: string;
        teleponPelanggan: string;
        alamatPelanggan: string;
        areaId: number;
        area?: {
            namaArea: string;
            branchId: number;
            branch?: { namaBranch: string };
        };
    };
    updates?: TicketUpdate[];
    _count?: { updates: number };
}

export interface CreateTicketData {
    category: string;
    customerId?: number;
    subject: string;
    description: string;
    priority?: string;
    source?: string;
    needDispatch?: boolean;
}

interface FilterValues {
    search: string;
    branchId: string;
    status: string;
    priority: string;
}

interface TicketFormState {
    subject: string;
    description: string;
    images: string[];
    selectedCustomer: any | null;
    searchResults: any[];
    filterValues: { searchType: string; searchValue: string; branchId: string };
}

interface TicketState {
    tickets: Ticket[];
    currentTicket: Ticket | null;
    loading: boolean;
    error: string | null;
    stats: { open: number; dispatched: number; claimed: number; inProgress: number; resolved: number; closed: number; total: number } | null;

    // List states
    incidentList: {
        filterValues: FilterValues;
        appliedFilters: FilterValues;
        pagination: { currentPage: number; pageSize: number };
    };
    complaintList: {
        filterValues: FilterValues;
        appliedFilters: FilterValues;
        pagination: { currentPage: number; pageSize: number };
    };

    fetchTickets: (category?: string, force?: boolean) => Promise<void>;
    fetchTicket: (id: number) => Promise<void>;
    fetchStats: () => Promise<void>;
    createTicket: (data: CreateTicketData, images?: string) => Promise<Ticket>;
    addUpdate: (id: number, data: { note: string; images?: string; isEscalation?: boolean }) => Promise<void>;
    dispatchTicket: (id: number, data: { priority?: string; slaTechDays?: number; note?: string }) => Promise<void>;
    claimTicket: (id: number) => Promise<void>;
    startWork: (id: number) => Promise<void>;
    resolveTicket: (id: number, data: { note: string; images?: string }) => Promise<void>;
    resolveDirectly: (id: number, data: { note: string; images?: string }) => Promise<void>;
    closeTicket: (id: number, data: { note?: string }) => Promise<void>;
    changeCategory: (id: number, category: string) => Promise<void>;

    setFilterValues: (category: 'INCIDENT' | 'COMPLAINT', values: Partial<FilterValues>) => void;
    setAppliedFilters: (category: 'INCIDENT' | 'COMPLAINT', values: FilterValues) => void;
    setPagination: (category: 'INCIDENT' | 'COMPLAINT', values: Partial<{ currentPage: number; pageSize: number }>) => void;
    resetFilters: (category: 'INCIDENT' | 'COMPLAINT') => void;

    // Form persistence
    incidentForm: TicketFormState;
    complaintForm: TicketFormState;
    setFormValues: (category: 'INCIDENT' | 'COMPLAINT', values: Partial<TicketFormState>) => void;
    resetForm: (category: 'INCIDENT' | 'COMPLAINT') => void;
}

const initialFilters: FilterValues = {
    search: "",
    branchId: "",
    status: "all",
    priority: "all",
};

const initialForm: TicketFormState = {
    subject: "",
    description: "",
    images: [],
    selectedCustomer: null,
    searchResults: [],
    filterValues: { searchType: "idPelanggan", searchValue: "", branchId: "all" }
};

export const useTicketStore = create<TicketState>((set, get) => ({
    tickets: [],
    currentTicket: null,
    loading: false,
    error: null,
    stats: null,

    incidentList: {
        filterValues: initialFilters,
        appliedFilters: initialFilters,
        pagination: { currentPage: 1, pageSize: 10 },
    },
    complaintList: {
        filterValues: initialFilters,
        appliedFilters: initialFilters,
        pagination: { currentPage: 1, pageSize: 10 },
    },

    setFilterValues: (category, values) => {
        const key = category === 'INCIDENT' ? 'incidentList' : 'complaintList';
        set((state) => ({
            [key]: { ...state[key], filterValues: { ...state[key].filterValues, ...values } }
        }));
    },
    setAppliedFilters: (category, values) => {
        const key = category === 'INCIDENT' ? 'incidentList' : 'complaintList';
        set((state) => ({
            [key]: { ...state[key], appliedFilters: values }
        }));
    },
    setPagination: (category, values) => {
        const key = category === 'INCIDENT' ? 'incidentList' : 'complaintList';
        set((state) => ({
            [key]: { ...state[key], pagination: { ...state[key].pagination, ...values } }
        }));
    },
    resetFilters: (category) => {
        const key = category === 'INCIDENT' ? 'incidentList' : 'complaintList';
        set({
            [key]: {
                filterValues: initialFilters,
                appliedFilters: initialFilters,
                pagination: { currentPage: 1, pageSize: 10 },
            }
        });
    },

    fetchTickets: async (category, force = false) => {
        if (!force && get().tickets.length > 0) return;
        set({ loading: true, error: null });
        try {
            const params = category ? { category } : {};
            const res = await api.get('/tickets', { params });
            set({ tickets: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchTicket: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/tickets/${id}`);
            set({ currentTicket: res.data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchStats: async () => {
        try {
            const res = await api.get('/tickets/stats');
            set({ stats: res.data });
        } catch (error: any) {
            console.error('Failed to fetch stats', error);
        }
    },

    createTicket: async (data, images) => {
        set({ loading: true, error: null });
        try {
            const payload = images ? { ...data, images } : data;
            const res = await api.post('/tickets', payload);
            await get().fetchTickets(data.category, true);
            set({ loading: false });
            return res.data;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    addUpdate: async (id, data) => {
        try {
            await api.post(`/tickets/${id}/updates`, data);
            await get().fetchTicket(id);
        } catch (error: any) {
            throw error;
        }
    },

    dispatchTicket: async (id, data) => {
        try {
            await api.patch(`/tickets/${id}/dispatch`, data);
            await get().fetchTickets(undefined, true);
        } catch (error: any) {
            throw error;
        }
    },

    claimTicket: async (id) => {
        try {
            await api.patch(`/tickets/${id}/claim`);
            await get().fetchTickets(undefined, true);
        } catch (error: any) {
            throw error;
        }
    },

    startWork: async (id) => {
        try {
            await api.patch(`/tickets/${id}/start`);
            await get().fetchTicket(id);
        } catch (error: any) {
            throw error;
        }
    },

    resolveTicket: async (id, data) => {
        try {
            await api.patch(`/tickets/${id}/resolve`, data);
            await get().fetchTickets(undefined, true);
        } catch (error: any) {
            throw error;
        }
    },

    resolveDirectly: async (id, data) => {
        try {
            await api.patch(`/tickets/${id}/resolve-direct`, data);
            await get().fetchTickets(undefined, true);
        } catch (error: any) {
            throw error;
        }
    },

    closeTicket: async (id, data) => {
        try {
            await api.patch(`/tickets/${id}/close`, data);
            await get().fetchTickets(undefined, true);
        } catch (error: any) {
            throw error;
        }
    },

    changeCategory: async (id, category) => {
        try {
            await api.patch(`/tickets/${id}/change-category`, { category });
            await get().fetchTickets(undefined, true);
        } catch (error: any) {
            throw error;
        }
    },

    // Form persistence
    incidentForm: { ...initialForm },
    complaintForm: { ...initialForm },
    setFormValues: (category, values) => {
        const key = category === 'INCIDENT' ? 'incidentForm' : 'complaintForm';
        set((state) => ({
            [key]: { ...state[key], ...values }
        }));
    },
    resetForm: (category) => {
        const key = category === 'INCIDENT' ? 'incidentForm' : 'complaintForm';
        set({ [key]: { ...initialForm } });
    },
}));
