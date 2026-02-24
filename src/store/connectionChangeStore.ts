import { create } from 'zustand';

interface ConnectionChangeFilterState {
    filterValues: {
        branchId: string;
        searchType: string;
        searchValue: string;
    };
    selectedCustomer: any | null;
    isInfoCollapsed: boolean;

    // Form data for the connection change
    formData: {
        pppUsername: string;
        pppPassword: string;
        pppService: string;
        secretMode: string;
    } | null;

    setFilterValues: (values: ConnectionChangeFilterState['filterValues']) => void;
    setSelectedCustomer: (customer: any | null) => void;
    setIsInfoCollapsed: (collapsed: boolean) => void;
    setFormData: (data: ConnectionChangeFilterState['formData']) => void;
    resetFormData: () => void;
    resetState: () => void;
}

export const useConnectionChangeStore = create<ConnectionChangeFilterState>((set) => ({
    filterValues: {
        branchId: '',
        searchType: 'idPelanggan',
        searchValue: '',
    },
    selectedCustomer: null,
    isInfoCollapsed: false,
    formData: null,

    setFilterValues: (values) => set({ filterValues: values }),
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
    setIsInfoCollapsed: (collapsed) => set({ isInfoCollapsed: collapsed }),
    setFormData: (data) => set({ formData: data }),
    resetFormData: () => set({ formData: null }),
    resetState: () => set({
        filterValues: {
            branchId: '',
            searchType: 'idPelanggan',
            searchValue: '',
        },
        selectedCustomer: null,
        isInfoCollapsed: false,
        formData: null,
    }),
}));
