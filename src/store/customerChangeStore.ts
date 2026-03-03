import { create } from 'zustand';

interface CustomerChangeFilterState {
    filterValues: {
        branchId: string;
        searchType: string;
        searchValue: string;
    };
    selectedCustomer: any | null;
    isInfoCollapsed: boolean;

    // Form data for the customer change
    formData: {
        namaPelanggan: string;
        alamatPelanggan: string;
        teleponPelanggan: string;
        identitasPelanggan: string;
        areaId: string;
        odpId: string;
        odpPortId: string;
        latitude: string;
        longitude: string;
    } | null;

    setFilterValues: (values: CustomerChangeFilterState['filterValues']) => void;
    setSelectedCustomer: (customer: any | null) => void;
    setIsInfoCollapsed: (collapsed: boolean) => void;
    setFormData: (data: CustomerChangeFilterState['formData']) => void;
    resetFormData: () => void;
    resetState: () => void;
}

export const useCustomerChangeStore = create<CustomerChangeFilterState>((set) => ({
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
