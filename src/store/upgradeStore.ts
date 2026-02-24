import { create } from 'zustand';
import type { Customer } from '@/types/customer';

interface UpgradeFilterValues {
    branchId: string;
    searchType: string;
    searchValue: string;
}

interface UpgradeState {
    filterValues: UpgradeFilterValues;
    selectedCustomer: Customer | null;
    newPaketId: string;
    isInfoCollapsed: boolean;

    setFilterValues: (values: UpgradeFilterValues) => void;
    setSelectedCustomer: (customer: Customer | null) => void;
    setNewPaketId: (id: string) => void;
    setIsInfoCollapsed: (collapsed: boolean) => void;
    resetState: () => void;
}

const initialFilterValues: UpgradeFilterValues = {
    branchId: "",
    searchType: "idPelanggan",
    searchValue: ""
};

export const useUpgradeStore = create<UpgradeState>((set) => ({
    filterValues: initialFilterValues,
    selectedCustomer: null,
    newPaketId: "",
    isInfoCollapsed: false,

    setFilterValues: (values) => set({ filterValues: values }),
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
    setNewPaketId: (id) => set({ newPaketId: id }),
    setIsInfoCollapsed: (collapsed) => set({ isInfoCollapsed: collapsed }),
    resetState: () => set({
        filterValues: initialFilterValues,
        selectedCustomer: null,
        newPaketId: "",
        isInfoCollapsed: false
    })
}));
