import { create } from 'zustand';
import api from '@/lib/api';
import type { Invoice } from '@/types/invoice';

export interface Transaction {
    id: number;
    referenceNo: string;
    amountPaid: number;
    paymentMethod: string;
    adminId: number;
    customerId: number;
    createdAt: string;
    updatedAt: string;
    proofImage?: string;

    // Relations
    customer?: {
        id: number;
        idPelanggan: string;
        namaPelanggan: string;
    };
    invoices?: Invoice[];
    admin?: {
        id: number;
        username: string; // Assuming admin has username
    };
}

interface TransactionState {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;

    filterValues: { search: string; startDate: string; endDate: string; method: string; branchId: string; areaId: string };
    appliedFilters: { search: string; startDate: string; endDate: string; method: string; branchId: string; areaId: string };

    // Pagination
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };

    setFilterValues: (values: Partial<TransactionState['filterValues']>) => void;
    setAppliedFilters: (values: TransactionState['appliedFilters']) => void;
    resetFilters: () => void;

    fetchTransactions: (page?: number, limit?: number) => Promise<void>;
    deleteTransactions: (ids: number[]) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    loading: false,
    error: null,

    filterValues: { search: "", startDate: "", endDate: "", method: "", branchId: "", areaId: "" },
    appliedFilters: { search: "", startDate: "", endDate: "", method: "", branchId: "", areaId: "" },

    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    },

    setFilterValues: (values) => set((state) => ({ filterValues: { ...state.filterValues, ...values } })),
    setAppliedFilters: (values) => set({ appliedFilters: values }),
    resetFilters: () => set({
        filterValues: { search: "", startDate: "", endDate: "", method: "", branchId: "", areaId: "" },
        appliedFilters: { search: "", startDate: "", endDate: "", method: "", branchId: "", areaId: "" }
    }),

    fetchTransactions: async (page = 1, limit = 10) => {
        set({ loading: true, error: null });
        try {
            // Note: Adjust endpoint if your backend supports pagination/filtering
            // Assuming simplified fetchAll for now based on existing controller
            const response = await api.get('/transaction');
            const allData = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data : [];

            // Client-side filtering/pagination for now if backend doesn't support params yet
            // In a real large app, move this logic to backend
            const { appliedFilters } = get();

            let filtered = allData;

            if (appliedFilters.search) {
                const search = appliedFilters.search.toLowerCase();
                filtered = filtered.filter((t: Transaction) =>
                    t.referenceNo.toLowerCase().includes(search) ||
                    t.customer?.namaPelanggan.toLowerCase().includes(search) ||
                    t.customer?.idPelanggan.toLowerCase().includes(search)
                );
            }

            if (appliedFilters.method && appliedFilters.method !== 'all') {
                filtered = filtered.filter((t: any) => t.paymentMethod === appliedFilters.method);
            }

            // Branch Filtering (Client-side fallback)
            if (appliedFilters.branchId && appliedFilters.branchId !== 'all') {
                filtered = filtered.filter((t: any) => t.customer?.area?.branchId?.toString() === appliedFilters.branchId);
            }

            // Area Filtering (Client-side fallback)
            if (appliedFilters.areaId && appliedFilters.areaId !== 'all') {
                filtered = filtered.filter((t: any) => t.customer?.areaId?.toString() === appliedFilters.areaId);
            }

            // Date filtering
            if (appliedFilters.startDate || appliedFilters.endDate) {
                filtered = filtered.filter((t: Transaction) => {
                    const txDate = new Date(t.createdAt);
                    txDate.setHours(0, 0, 0, 0);

                    if (appliedFilters.startDate && appliedFilters.endDate) {
                        const start = new Date(appliedFilters.startDate);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(appliedFilters.endDate);
                        end.setHours(23, 59, 59, 999);
                        return txDate >= start && txDate <= end;
                    } else if (appliedFilters.startDate) {
                        const start = new Date(appliedFilters.startDate);
                        start.setHours(0, 0, 0, 0);
                        return txDate.getTime() === start.getTime();
                    }
                    return true;
                });
            }

            // Sort by Date Descending
            filtered.sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // Pagination Logic
            const total = filtered.length;
            const totalPages = Math.ceil(total / limit);
            const start = (page - 1) * limit;
            const paginatedData = filtered.slice(start, start + limit);

            set({
                transactions: paginatedData,
                loading: false,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
    deleteTransactions: async (ids: number[]) => {
        set({ loading: true, error: null });
        try {
            await api.post('/transaction/bulk-delete', { ids });
            const { pagination } = get();
            await get().fetchTransactions(pagination.page, pagination.limit);
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));
