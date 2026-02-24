import { create } from 'zustand';
import type { Customer } from '@/types/customer';

interface CustomerStatusFilterValues {
    branchId: string;
    searchType: string;
    searchValue: string;
}

interface CustomerStatusState {
    filterValues: CustomerStatusFilterValues;
    selectedCustomer: Customer | any | null;
    selectedAction: 'AKTIF' | 'NONAKTIF' | 'BERHENTI' | '';
    reason: string;
    isInfoCollapsed: boolean;

    setFilterValues: (values: CustomerStatusFilterValues) => void;
    setSelectedCustomer: (customer: Customer | any | null) => void;
    setSelectedAction: (action: 'AKTIF' | 'NONAKTIF' | 'BERHENTI' | '') => void;
    setReason: (reason: string) => void;
    setIsInfoCollapsed: (collapsed: boolean) => void;
    resetState: () => void;
}

const initialFilterValues: CustomerStatusFilterValues = {
    branchId: "",
    searchType: "idPelanggan",
    searchValue: ""
};

export const useCustomerStatusStore = create<CustomerStatusState>((set) => ({
    filterValues: initialFilterValues,
    selectedCustomer: null,
    selectedAction: '',
    reason: '',
    isInfoCollapsed: false,

    setFilterValues: (values) => set({ filterValues: values }),
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
    setSelectedAction: (action) => set({ selectedAction: action }),
    setReason: (reason) => set({ reason: reason }),
    setIsInfoCollapsed: (collapsed) => set({ isInfoCollapsed: collapsed }),
    resetState: () => set({
        filterValues: initialFilterValues,
        selectedCustomer: null,
        selectedAction: '',
        reason: '',
        isInfoCollapsed: false
    })
}));
