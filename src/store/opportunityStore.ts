import { create } from 'zustand';
import type { Customer } from '@/types/customer';

interface FilterValues {
    branchId: string;
    searchType: string;
    searchValue: string;
}

interface OpportunityState {
    filterValues: FilterValues;
    activeTab: string;
    selectedCustomer: Customer | null;

    setFilterValues: (values: FilterValues) => void;
    setActiveTab: (tab: string) => void;
    setSelectedCustomer: (customer: Customer | null) => void;
    resetFilters: () => void;
}

export const useOpportunityStore = create<OpportunityState>((set) => ({
    filterValues: {
        branchId: "",
        searchType: "idPelanggan",
        searchValue: ""
    },
    activeTab: "layanan",
    selectedCustomer: null,

    setFilterValues: (values) => set({ filterValues: values }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
    resetFilters: () => set({
        filterValues: { branchId: "", searchType: "idPelanggan", searchValue: "" },
        activeTab: "layanan",
        selectedCustomer: null
    })
}));
