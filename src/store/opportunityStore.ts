import { create } from 'zustand';
import type { Customer } from '@/types/customer';

interface ListFilterValues {
    search: string;
    branchId: string;
    areaId: string;
    paketId: string;
    status: string;
}

interface OpportunityState {
    // Detail Page State
    filterValues: {
        branchId: string;
        searchType: string;
        searchValue: string;
    };
    activeTab: string;
    selectedCustomer: Customer | null;

    // List Page State
    listFilterValues: ListFilterValues;
    appliedListFilters: ListFilterValues;

    // Actions
    setFilterValues: (values: OpportunityState['filterValues']) => void;
    setActiveTab: (tab: string) => void;
    setSelectedCustomer: (customer: Customer | null) => void;

    setListFilterValues: (values: Partial<ListFilterValues>) => void;
    setAppliedListFilters: (values: ListFilterValues) => void;

    resetFilters: () => void;
    resetListFilters: () => void;
}

const initialListFilters: ListFilterValues = {
    search: "",
    branchId: "",
    areaId: "",
    paketId: "",
    status: "all"
};

export const useOpportunityStore = create<OpportunityState>((set) => ({
    // Detail Page initial state
    filterValues: {
        branchId: "",
        searchType: "idPelanggan",
        searchValue: ""
    },
    activeTab: "layanan",
    selectedCustomer: null,

    // List Page initial state
    listFilterValues: initialListFilters,
    appliedListFilters: initialListFilters,

    setFilterValues: (values) => set({ filterValues: values }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

    setListFilterValues: (values) => set((state) => ({
        listFilterValues: { ...state.listFilterValues, ...values }
    })),
    setAppliedListFilters: (values) => set({ appliedListFilters: values }),

    resetFilters: () => set({
        filterValues: { branchId: "", searchType: "idPelanggan", searchValue: "" },
        activeTab: "layanan",
        selectedCustomer: null
    }),
    resetListFilters: () => set({
        listFilterValues: initialListFilters,
        appliedListFilters: initialListFilters
    })
}));
