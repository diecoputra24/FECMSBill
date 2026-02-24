import { create } from 'zustand';
import api from '@/lib/api';
import type { Customer, Connection } from '@/types/customer';

export interface CustomerFormData {
    // Customer Info
    idPelanggan: string;
    namaPelanggan: string;
    alamatPelanggan: string;
    teleponPelanggan: string;
    identitasPelanggan: string;
    tanggalAktif: string;
    tanggalAkhir: string;
    tanggalToleransi: string;

    // Location Info
    branchId: string;
    areaId: string;
    odpId: string;
    odpPortId: string;
    latitude: string;
    longitude: string;
    autoAddress: boolean;

    // Connection Info
    paketId: string;
    secretMode: 'NEW' | 'EXISTING' | 'NONE';
    pppUsername: string;
    pppPassword: string;
    pppService: string;

    // Discount Info (manual - in Rupiah)
    diskon: string;

    // PPN Info
    useTax: boolean;
    taxId: string;

    // Addons
    addonIds: string[];
}

interface CustomerState {
    customers: Customer[];
    connections: Connection[];
    loading: boolean;
    error: string | null;

    createFormData: CustomerFormData;

    // Filter & Sort State
    filterValues: { search: string; branchId: string; areaId: string; paketId: string; status: string };
    appliedFilters: { search: string; branchId: string; areaId: string; paketId: string; status: string };
    sortConfig: { key: keyof Customer; order: "asc" | "desc" };

    setFilterValues: (values: Partial<CustomerState['filterValues']>) => void;
    setAppliedFilters: (values: CustomerState['appliedFilters']) => void;
    setSortConfig: (config: CustomerState['sortConfig']) => void;
    resetFilters: () => void;

    fetchCustomers: (force?: boolean) => Promise<void>;
    fetchConnections: (force?: boolean) => Promise<void>;
    addCustomer: (data: CustomerFormData) => Promise<void>;

    setCreateFormData: (data: Partial<CustomerFormData>) => void;
    resetCreateFormData: () => void;

    deleteCustomer: (id: number) => Promise<void>;
    updateCustomer: (id: number, data: CustomerFormData) => Promise<void>;
}

const initialFormData: CustomerFormData = {
    idPelanggan: "",
    namaPelanggan: "",
    alamatPelanggan: "",
    teleponPelanggan: "",
    identitasPelanggan: "",
    tanggalAktif: "",
    tanggalAkhir: "",
    tanggalToleransi: "",
    branchId: "",
    areaId: "",
    odpId: "",
    odpPortId: "",
    latitude: "",
    longitude: "",
    paketId: "",
    secretMode: "NEW",
    pppUsername: "",
    pppPassword: "",
    pppService: "pppoe",
    diskon: "0",
    useTax: false,
    taxId: "",
    addonIds: [],
    autoAddress: false
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
    customers: [],
    connections: [],
    loading: false,
    error: null,

    createFormData: initialFormData,

    filterValues: { search: "", branchId: "", areaId: "", paketId: "", status: "" },
    appliedFilters: { search: "", branchId: "", areaId: "", paketId: "", status: "" },
    sortConfig: { key: "namaPelanggan", order: "asc" },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    setSortConfig: (config) => set({ sortConfig: config }),
    resetFilters: () => set({
        filterValues: { search: "", branchId: "", areaId: "", paketId: "", status: "" },
        appliedFilters: { search: "", branchId: "", areaId: "", paketId: "", status: "" }
    }),

    setCreateFormData: (data) => set((state) => ({
        createFormData: { ...state.createFormData, ...data }
    })),
    resetCreateFormData: () => set({ createFormData: initialFormData }),

    fetchCustomers: async (force = false) => {
        if (!force && get().customers.length > 0) return;
        set({ loading: true, error: null });
        try {
            const response = await api.get('/customer');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ customers: data, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchConnections: async (force = false) => {
        if (!force && get().connections.length > 0) return;
        try {
            const response = await api.get('/connection');
            const data = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];
            set({ connections: data });
        } catch (error: any) {
            console.error(error);
        }
    },

    addCustomer: async (formData) => {
        set({ loading: true, error: null });
        try {
            // 1. Create Customer
            const customerPayload = {
                idPelanggan: formData.idPelanggan,
                namaPelanggan: formData.namaPelanggan,
                alamatPelanggan: formData.alamatPelanggan,
                teleponPelanggan: formData.teleponPelanggan,
                identitasPelanggan: formData.identitasPelanggan,
                areaId: parseInt(formData.areaId),
                odpId: formData.odpId ? parseInt(formData.odpId) : null,
                odpPortId: formData.odpPortId ? parseInt(formData.odpPortId) : null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                statusPelanggan: "AKTIF",
                tanggalAktif: formData.tanggalAktif || null,
                tanggalAkhir: formData.tanggalAkhir || null,
                tanggalToleransi: formData.tanggalToleransi || formData.tanggalAkhir || null,
                diskon: parseFloat(formData.diskon) || 0,
                useTax: formData.useTax,
                taxId: formData.taxId ? parseInt(formData.taxId) : null,
                addonIds: formData.addonIds.map(id => parseInt(id)),
            };

            const customerRes = await api.post('/customer', customerPayload);
            const newCustomer = customerRes.data;

            // 2. Create Connection if packet is selected
            if (formData.paketId) {
                const connectionPayload: any = {
                    pelangganId: newCustomer.id,
                    paketId: parseInt(formData.paketId),
                    secretMode: formData.secretMode || 'NEW',
                };

                // Only include PPP fields if not NONE mode
                if (formData.secretMode !== 'NONE') {
                    connectionPayload.pppUsername = formData.pppUsername;
                    connectionPayload.pppPassword = formData.pppPassword;
                    connectionPayload.pppService = formData.pppService;
                }

                await api.post('/connection', connectionPayload);
            }

            // Refresh data
            await get().fetchCustomers(true);
            await get().fetchConnections(true);
            set({ loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteCustomer: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/customer/${id}`);
            // Also remove related connection from state locally to avoid stale data
            set(state => ({
                customers: state.customers.filter(c => c.id !== id),
                connections: state.connections.filter(c => c.pelangganId !== id),
                loading: false
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateCustomer: async (id, formData) => {
        set({ loading: true, error: null });
        try {
            // 1. Update Customer
            const customerPayload = {
                namaPelanggan: formData.namaPelanggan,
                alamatPelanggan: formData.alamatPelanggan,
                teleponPelanggan: formData.teleponPelanggan,
                identitasPelanggan: formData.identitasPelanggan,
                areaId: formData.areaId ? parseInt(formData.areaId) : undefined,
                odpId: formData.odpId ? parseInt(formData.odpId) : null,
                odpPortId: formData.odpPortId ? parseInt(formData.odpPortId) : null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                tanggalAktif: formData.tanggalAktif || null,
                tanggalAkhir: formData.tanggalAkhir || null,
                tanggalToleransi: formData.tanggalToleransi || formData.tanggalAkhir || null,
                diskon: parseFloat(formData.diskon) || 0,
                useTax: formData.useTax,
                taxId: formData.taxId ? parseInt(formData.taxId) : null,
                addonIds: formData.addonIds.map(id => parseInt(id)),
            };

            await api.patch(`/customer/${id}`, customerPayload);

            // 2. Update Connection (Best effort find and update)
            const connection = get().connections.find(c => c.pelangganId === id);
            if (connection && formData.paketId) {
                const connectionPayload: any = {
                    paketId: parseInt(formData.paketId),
                    secretMode: formData.secretMode || connection.secretMode || 'NEW',
                };

                // Only include PPP fields if not NONE mode
                if (formData.secretMode !== 'NONE') {
                    connectionPayload.pppUsername = formData.pppUsername;
                    connectionPayload.pppPassword = formData.pppPassword;
                    connectionPayload.pppService = formData.pppService;
                }

                await api.patch(`/connection/${connection.id}`, connectionPayload);
            }

            // Refresh data
            await get().fetchCustomers(true);
            await get().fetchConnections(true);
            set({ loading: false });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ error: errorMessage, loading: false });
            throw new Error(errorMessage);
        }
    }
}));
