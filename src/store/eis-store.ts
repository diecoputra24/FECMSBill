import { create } from 'zustand';

interface EISState {
    growthStats: any | null;
    revenueStats: any | null;
    ticketingStats: any | null;
    lastUpdated: {
        growth: number | null;
        revenue: number | null;
        ticketing: number | null;
    };
    setGrowthStats: (stats: any) => void;
    setRevenueStats: (stats: any) => void;
    setTicketingStats: (stats: any) => void;
    clearCache: () => void;
}

export const useEISStore = create<EISState>((set) => ({
    growthStats: null,
    revenueStats: null,
    ticketingStats: null,
    lastUpdated: {
        growth: null,
        revenue: null,
        ticketing: null,
    },
    setGrowthStats: (stats) => set((state) => ({
        growthStats: stats,
        lastUpdated: { ...state.lastUpdated, growth: Date.now() }
    })),
    setRevenueStats: (stats) => set((state) => ({
        revenueStats: stats,
        lastUpdated: { ...state.lastUpdated, revenue: Date.now() }
    })),
    setTicketingStats: (stats) => set((state) => ({
        ticketingStats: stats,
        lastUpdated: { ...state.lastUpdated, ticketing: Date.now() }
    })),
    clearCache: () => set({
        growthStats: null,
        revenueStats: null,
        ticketingStats: null,
        lastUpdated: { growth: null, revenue: null, ticketing: null }
    }),
}));
