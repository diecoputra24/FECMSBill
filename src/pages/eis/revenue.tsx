import React from 'react';
import {
    DollarSign,
    TrendingUp,
    Activity,
    Wallet,
    MapPin,
    ChevronDown,
    Calendar,
    Target
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { themeConfig } from '@/config/themes';
import { useEISStore } from '@/store/eis-store';

interface PivotMetric {
    name: string;
    branchName?: string;
    revenue: number;
    expected: number;
    unpaidAmount: number;
    totalCustomers: number;
    paidCustomers: number;
    unpaidCustomers: number;
}

interface RevenueStats {
    revenueData: { name: string; value: number }[];
    paymentMethods: { name: string; count: number }[];
    pivotBranch: PivotMetric[];
    pivotArea: PivotMetric[];
    summary: {
        totalRevenueBulanIni: number;
        proyeksiTagihan: number;
        rataRataARPU: number;
        kolektibilitas: number;
    };
}

const formatRp = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}Jt`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}Rb`;
    return `Rp ${val}`;
};

const formatRpFull = (val: number) => {
    return `Rp ${val.toLocaleString('id-ID')}`;
};


const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 min-w-[140px] text-white">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-700/50">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-sm font-medium text-slate-200">{p.name || 'Value'}</span>
                        </div>
                        <span className="font-medium text-base text-white tracking-tight">
                            {formatter ? formatter(p.value) : p.value.toLocaleString('id-ID')}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const BentoCard = ({ title, subtitle, icon: Icon, children, delay, className = "" }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className={`bg-white border border-slate-200 rounded-[32px] flex flex-col overflow-hidden ${className}`}
    >
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
            <div>
                <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>
                {subtitle && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {Icon && <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Icon size={16} strokeWidth={2} /></div>}
        </div>
        <div className="flex-1 px-5 pb-5">
            {children}
        </div>
    </motion.div>
);

const ProgressBarList = ({ data, color }: any) => {
    return (
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar px-2 pb-2">
            {data.slice(0, 10).map((item: any, idx: number) => {
                const maxCount = data[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);
                return (
                    <div key={idx} className="group cursor-default">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-slate-700 tracking-tight">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-800">{item.count.toLocaleString('id-ID')}</span>
                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Trx</span>
                            </div>
                        </div>
                        <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.5, delay: 0.3 + idx * 0.1, ease: "circOut" }}
                                className={`h-full rounded-full ${color}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const PivotTable = ({ branches, areas }: { branches: PivotMetric[], areas: PivotMetric[] }) => {
    const [expandedRows, setExpandedRows] = React.useState<string[]>([]);

    const toggleRow = (branchName: string) => {
        setExpandedRows(prev =>
            prev.includes(branchName)
                ? prev.filter(n => n !== branchName)
                : [...prev, branchName]
        );
    };

    return (
        <div className="overflow-x-auto w-full pb-4">
            <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-5 py-4 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cabang & Area</th>
                        <th className="px-5 py-4 text-center text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sudah / Belum / Total</th>
                        <th className="px-5 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target</th>
                        <th className="px-5 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sudah Bayar</th>
                        <th className="px-5 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider">Belum Bayar</th>
                        <th className="px-5 py-4 text-right text-[11px] font-medium text-slate-500 uppercase tracking-wider">Efektifitas</th>
                    </tr>
                </thead>
                <tbody>
                    {branches.map((branch, idx) => {
                        const pctPaid = branch.expected > 0 ? Math.round((branch.revenue / branch.expected) * 100) : 0;
                        const pctUnpaid = branch.expected > 0 ? Math.round((branch.unpaidAmount / branch.expected) * 100) : 0;
                        const isExpanded = expandedRows.includes(branch.name);
                        const branchAreas = areas.filter(a => a.branchName === branch.name);
                        const branchCount = branchAreas.length;
                        const effectiveness = branch.expected > 0 ? Math.round((branch.revenue / branch.expected) * 100) : 0;


                        return (
                            <React.Fragment key={`branch-${idx}`}>
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => toggleRow(branch.name)}
                                    className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-slate-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                <ChevronDown size={14} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[14px] font-medium text-slate-800">{branch.name}</span>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full">
                                                    <span className="text-[10px] font-medium text-slate-500">{branchCount} Area</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-sm font-medium">
                                            <span className="text-emerald-600" title="Sudah Bayar">{branch.paidCustomers}</span>
                                            <span className="text-slate-300 font-normal">/</span>
                                            <span className="text-rose-500" title="Belum Bayar">{branch.unpaidCustomers}</span>
                                            <span className="text-slate-300 font-normal">/</span>
                                            <span className="text-slate-700 font-medium" title="Total Pelanggan">{branch.totalCustomers}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className="text-sm font-medium text-slate-700">{formatRpFull(branch.expected)}</span>
                                    </td>
                                    <td className="py-3 px-4 text-right bg-emerald-50/10 group-hover:bg-emerald-50/20 transition-colors">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm font-medium text-emerald-600">{formatRpFull(branch.revenue)}</span>
                                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded">{pctPaid}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right bg-rose-50/10 group-hover:bg-rose-50/20 transition-colors">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm font-medium text-rose-600">{formatRpFull(branch.unpaidAmount)}</span>
                                            <span className="text-[10px] font-medium text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded">{pctUnpaid}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <span className={`text-sm font-medium ${effectiveness >= 80 ? 'text-emerald-600' : effectiveness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{effectiveness}%</span>
                                    </td>
                                </motion.tr>

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        branchAreas.map((area, aIdx) => {
                                            const areaPctPaid = area.expected > 0 ? Math.round((area.revenue / area.expected) * 100) : 0;
                                            const areaPctUnpaid = area.expected > 0 ? Math.round((area.unpaidAmount / area.expected) * 100) : 0;
                                            const areaEffectiveness = area.expected > 0 ? Math.round((area.revenue / area.expected) * 100) : 0;

                                            return (
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2, delay: aIdx * 0.03 }}
                                                    key={`area-${idx}-${aIdx}`}
                                                    className="bg-slate-50/30 border-b border-slate-50/50 hover:bg-slate-50/60 transition-colors"
                                                >
                                                    <td className="py-3 px-4 pl-12">
                                                        <div className="flex items-center gap-3 border-l-2 border-slate-200 ml-1 pl-4">
                                                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                            <span className="text-sm font-medium text-slate-600">{area.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-l border-slate-50/50">
                                                        <div className="flex items-center justify-center gap-2 text-sm font-medium opacity-80">
                                                            <span className="text-emerald-600/70">{area.paidCustomers}</span>
                                                            <span className="text-slate-300 font-normal">/</span>
                                                            <span className="text-rose-500/70">{area.unpaidCustomers}</span>
                                                            <span className="text-slate-300 font-normal">/</span>
                                                            <span className="text-slate-600 font-medium">{area.totalCustomers}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right border-l border-slate-50/50">
                                                        <span className="text-sm font-medium text-slate-500">{formatRpFull(area.expected)}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right bg-emerald-50/5 border-l border-slate-50/50">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-sm font-medium text-emerald-600/70">{formatRpFull(area.revenue)}</span>
                                                            <span className="text-[10px] font-medium text-emerald-600/40 bg-emerald-50 px-1.5 py-0.5 rounded">{areaPctPaid}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right bg-rose-50/5 border-l border-slate-50/50">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-sm font-medium text-rose-600/70">{formatRpFull(area.unpaidAmount)}</span>
                                                            <span className="text-[10px] font-medium text-rose-600/40 bg-rose-50 px-1.5 py-0.5 rounded">{areaPctUnpaid}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`text-sm font-medium ${areaEffectiveness >= 80 ? 'text-emerald-600' : areaEffectiveness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{areaEffectiveness}%</span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        );
                    })}
                    {branches.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-8 text-center text-sm font-medium text-slate-400">Belum ada data target tagihan maupun pembayaran</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const RevenuePerformancePage: React.FC = () => {
    const { theme } = useTheme();
    const config = themeConfig[theme] || themeConfig.blue;
    const primaryColorClass = config.active.text.split('-')[1]; // 'blue', 'green', etc.

    const { revenueStats, setRevenueStats } = useEISStore();
    const [stats, setStats] = React.useState<RevenueStats | null>(revenueStats);
    const [loading, setLoading] = React.useState(!revenueStats); // First time loading
    const [processing, setProcessing] = React.useState(false); // Subsequent updates

    // Use local date for initial month (avoiding UTC shift)
    const currentLocalMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = React.useState(currentLocalMonth);

    // Trend-specific state
    const [trendData, setTrendData] = React.useState<{ name: string; value: number }[]>(revenueStats?.revenueData || []);
    const [trendLoading, setTrendLoading] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState('6M');

    // Custom Month Dropdown state
    const [isMonthOpen, setIsMonthOpen] = React.useState(false);
    const monthRef = React.useRef<HTMLDivElement>(null);

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
                setIsMonthOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const months = React.useMemo(() => {
        const result = [];
        const date = new Date();
        for (let i = 0; i < 12; i++) {
            const m = new Date(date.getFullYear(), date.getMonth() - i, 1);
            result.push({
                value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
                label: m.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
            });
        }
        return result;
    }, []);

    const ranges = [
        { value: '1W', label: '1 Minggu' },
        { value: '1M', label: '1 Bulan' },
        { value: '3M', label: '3 Bulan' },
        { value: '6M', label: '6 Bulan' },
        { value: '1Y', label: '1 Tahun' },
    ];

    // Fetch Main Stats
    React.useEffect(() => {
        const fetchStats = async () => {
            if (!stats) setLoading(true);
            else setProcessing(true);

            try {
                const res = await api.get('/invoice/stats/revenue', {
                    params: { month: selectedMonth, trendRange: selectedRange }
                });
                setStats(res.data);
                setRevenueStats(res.data);
                // Only update trend data on initial load via this effect
                if (!trendData.length && res.data.revenueData) setTrendData(res.data.revenueData);
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                setLoading(false);
                setProcessing(false);
            }
        };
        fetchStats();
    }, [selectedMonth, setRevenueStats]);

    // Fetch ONLY Trend Data when range changes
    React.useEffect(() => {
        // Skip first load or if stats not yet loaded
        if (loading) return;

        const fetchTrendOnly = async () => {
            setTrendLoading(true);
            try {
                const res = await api.get('/invoice/stats/revenue', {
                    params: { month: selectedMonth, trendRange: selectedRange }
                });
                setTrendData(res.data.revenueData);
            } catch (err) {
                console.error('Failed to load trend:', err);
            } finally {
                setTrendLoading(false);
            }
        };
        fetchTrendOnly();
    }, [selectedRange]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-20">
                <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                    <div className="bg-primary animate-progress-material-1" />
                    <div className="bg-primary animate-progress-material-2" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 animate-pulse text-center">
                    Menghitung Akumulasi Pendapatan
                </p>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
            {/* Top Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-4 px-1"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 bg-white border border-slate-200 text-${primaryColorClass}-600 rounded-2xl`}>
                        <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1.5">Periode Laporan</p>
                        <div ref={monthRef} className="relative">
                            <button
                                onClick={() => !processing && setIsMonthOpen(!isMonthOpen)}
                                className={`flex items-center gap-2 group transition-all ${processing ? 'cursor-wait' : 'cursor-pointer'}`}
                            >
                                <span className={`text-base font-medium text-slate-800 group-hover:text-${primaryColorClass}-600 transition-colors`}>
                                    {months.find(m => m.value === selectedMonth)?.label || 'Pilih Bulan'}
                                </span>
                                <div className={`text-slate-400 group-hover:text-${primaryColorClass}-500 transition-colors`}>
                                    {processing ? (
                                        <div className={`w-3.5 h-3.5 border-2 border-${primaryColorClass}-500 border-t-transparent rounded-full animate-spin`} />
                                    ) : (
                                        <ChevronDown size={16} strokeWidth={2} className={`transition-transform duration-300 ${isMonthOpen ? 'rotate-180' : ''}`} />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isMonthOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 z-[100] py-1.5 rounded-2xl overflow-hidden"
                                    >
                                        <div className="max-h-64 overflow-y-auto scrollbar-hide">
                                            {months.map((m) => (
                                                <button
                                                    key={m.value}
                                                    onClick={() => {
                                                        setSelectedMonth(m.value);
                                                        setIsMonthOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-[12px] font-medium transition-all ${selectedMonth === m.value
                                                        ? `bg-${primaryColorClass}-500 text-white`
                                                        : `text-slate-600 hover:bg-${primaryColorClass}-50 hover:text-${primaryColorClass}-600`
                                                        }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Live Financial Data</span>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300 ${processing ? 'opacity-60 grayscale-[20%]' : 'opacity-100'}`}>
                {[
                    { label: 'Total Revenue Bulan Ini', value: formatRp(stats.summary.totalRevenueBulanIni), icon: DollarSign, color: primaryColorClass, detail: 'Pemasukan Real (Paid)' },
                    { label: 'Proyeksi Tagihan', value: formatRp(stats.summary.proyeksiTagihan), icon: Target, color: 'indigo', detail: 'Gross Est. Akhir Bulan' },
                    { label: 'Rata-Rata ARPU', value: formatRp(stats.summary.rataRataARPU), icon: Activity, color: primaryColorClass, detail: 'Rev / User Aktif' },
                    { label: 'Kolektibilitas', value: `${stats.summary.kolektibilitas}%`, icon: Wallet, color: 'rose', detail: 'Realisasi Pembayaran' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                        key={i}
                        className="bg-white p-4 rounded-3xl border border-slate-200"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                                <h3 className="text-xl font-medium text-slate-800 tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={16} strokeWidth={1.5} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 grid-flow-row-dense">

                {/* Revenue Trend Chart - 8 Cols */}
                <BentoCard
                    title="Jejak Pemasukan"
                    subtitle={`Analisis Tren ${ranges.find(r => r.value === selectedRange)?.label}`}
                    icon={TrendingUp}
                    delay={0.3}
                    className="md:col-span-8 min-h-[380px] relative"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pl-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Mata Uang: IDR (Rupiah)</span>
                            {trendLoading && (
                                <div className={`w-3 h-3 border-2 border-${primaryColorClass}-500 border-t-transparent rounded-full animate-spin ml-2 mt-1`} />
                            )}
                        </div>
                        <div className="flex p-0.5 bg-slate-100 rounded-xl">
                            {ranges.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => setSelectedRange(r.value)}
                                    className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-tight transition-all rounded-lg ${selectedRange === r.value
                                        ? `bg-white text-${primaryColorClass}-600 border border-slate-200`
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {r.value}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={`h-[280px] w-full mt-2 -ml-4 pr-4 pb-4 transition-opacity duration-300 ${trendLoading ? 'opacity-40' : 'opacity-100'}`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={`hsl(var(--primary))`} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={`hsl(var(--primary))`} stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={10} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(val) => formatRp(val)}
                                />
                                <Tooltip
                                    content={<CustomTooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Pendapatan Masuk"
                                    stroke={`hsl(var(--primary))`}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    activeDot={{ r: 6, fill: `hsl(var(--primary))`, stroke: '#fff', strokeWidth: 3 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Info / Insights - 4 Cols */}
                <div className="md:col-span-4 flex flex-col gap-5">
                    {/* Payment Types */}
                    <BentoCard
                        title="Metode Transaksi"
                        subtitle="Preferensi Cara Pembayaran"
                        icon={Wallet}
                        delay={0.4}
                        className="flex-1"
                    >
                        <div className="mt-4 pb-2">
                            <ProgressBarList
                                data={stats.paymentMethods.sort((a, b) => b.count - a.count)}
                                color="bg-gradient-to-r from-emerald-400 to-teal-500"
                            />
                        </div>
                    </BentoCard>
                </div>

                {/* Pivot Cabang (Full Width) */}
                <BentoCard
                    title="Pivot Pencatatan Area & Cabang"
                    subtitle="Pemasukan vs Tagihan"
                    icon={MapPin}
                    delay={0.5}
                    className="md:col-span-12"
                >
                    <div className={`mt-2 text-slate-700 transition-opacity duration-300 ${processing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <PivotTable branches={stats.pivotBranch} areas={stats.pivotArea} />
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};

export default RevenuePerformancePage;
