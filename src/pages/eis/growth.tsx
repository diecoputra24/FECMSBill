import React, { useEffect } from 'react';
import {
    TrendingUp,
    MapPin,
    Wifi,
    PieChart as PieIcon,
    AlertCircle,
    Activity,
    Users,
    CheckCircle,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { themeConfig } from '@/config/themes';
import { useEISStore } from '@/store/eis-store';

interface CustomerStats {
    summary: { total: number; aktif: number; isolir: number; nonaktif: number };
    perArea: { areaId: number; namaArea: string; branchName: string; count: number }[];
    perBranch: { name: string; count: number }[];
    perPacket: { name: string; count: number }[];
    monthlyGrowth: { month: string; count: number }[];
    newThisMonth: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 min-w-[140px] text-white">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-700/50">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-sm font-medium text-slate-200">{p.name}</span>
                        </div>
                        <span className="font-medium text-base text-white tracking-tight">{typeof p.value === 'number' ? p.value.toLocaleString('id-ID') : p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const BentoCard = ({ title, subtitle, icon: Icon, children, delay, className = "", noPad = false }: any) => {
    const { theme } = useTheme();
    const config = themeConfig[theme] || themeConfig.blue;
    const primaryColorClass = config.active.text.split('-')[1];

    return (
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
                {Icon && <div className={`p-2 bg-${primaryColorClass}-50 text-${primaryColorClass}-500 rounded-xl`}><Icon size={16} strokeWidth={2} /></div>}
            </div>
            <div className={`flex-1 ${noPad ? '' : 'px-5 pb-5'}`}>
                {children}
            </div>
        </motion.div>
    );
};

const ProgressBarList = ({ data, colors, typeLabel = "Pengguna" }: any) => {
    return (
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar px-2 pb-2">
            {data.slice(0, 50).map((item: any, idx: number) => {
                const maxCount = data[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);
                const colorCode = Array.isArray(colors) ? colors[idx % colors.length] : colors;

                return (
                    <div key={idx} className="group cursor-default">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-medium text-slate-700 tracking-tight">
                                    {item.namaArea || item.name}
                                </span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-800">{item.count.toLocaleString('id-ID')}</span>
                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">{typeLabel}</span>
                            </div>
                        </div>
                        <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.5, delay: 0.3 + idx * 0.1, ease: "circOut" }}
                                className={`h-full rounded-full ${colorCode.includes('gradient') ? colorCode : ''}`}
                                style={!colorCode.includes('gradient') ? { backgroundColor: colorCode } : {}}
                            />
                        </div>
                    </div>
                );
            })}
            {data.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
                    <Activity size={32} className="opacity-40 mb-3" />
                    <p className="text-xs font-medium uppercase tracking-widest">Belum ada data</p>
                </div>
            )}
        </div>
    );
};

const CustomerStatsPage: React.FC = () => {
    const { theme } = useTheme();
    const config = themeConfig[theme] || themeConfig.blue;
    const primaryColorClass = config.active.text.split('-')[1];

    const { growthStats, setGrowthStats } = useEISStore();
    const [stats, setStats] = React.useState<CustomerStats | null>(growthStats);
    const [loading, setLoading] = React.useState(!growthStats);
    const [selectedRange, setSelectedRange] = React.useState('6M');
    const [trendLoading, setTrendLoading] = React.useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (stats) setTrendLoading(true);
            else setLoading(true);

            try {
                const res = await api.get('/customer/stats', {
                    params: { trendRange: selectedRange }
                });
                setStats(res.data);
                setGrowthStats(res.data);
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                setLoading(false);
                setTrendLoading(false);
            }
        };
        fetchStats();
    }, [selectedRange, setGrowthStats]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-20">
                <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                    <div className="bg-primary animate-progress-material-1" />
                    <div className="bg-primary animate-progress-material-2" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 animate-pulse text-center">
                    Menganalisa Database Pelanggan
                </p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-3xl font-medium text-slate-800 tracking-tight mb-2">Terjadi Gangguan</h2>
                <p className="text-slate-500 font-medium max-w-sm">Data statistik tidak dapat diakses saat ini. Silakan muat ulang.</p>
            </div>
        );
    }

    const { summary, perArea, perBranch, perPacket, monthlyGrowth } = stats;

    const statusPieData = [
        { name: 'Aktif', value: summary.total > 0 ? Number(((summary.aktif / summary.total) * 100).toFixed(1)) : 0, count: summary.aktif, color: '#10b981' },
        { name: 'Suspend', value: summary.total > 0 ? Number(((summary.isolir / summary.total) * 100).toFixed(1)) : 0, count: summary.isolir, color: '#f59e0b' },
        { name: 'Tidak Aktif', value: summary.total > 0 ? Number(((summary.nonaktif / summary.total) * 100).toFixed(1)) : 0, count: summary.nonaktif, color: '#ef4444' },
    ];

    const gradientColors = [
        'bg-gradient-to-r from-indigo-500 to-blue-500',
        'bg-gradient-to-r from-blue-500 to-cyan-500',
        'bg-gradient-to-r from-cyan-500 to-teal-500',
        'bg-gradient-to-r from-teal-500 to-emerald-500',
        'bg-gradient-to-r from-emerald-500 to-emerald-400',
        'bg-gradient-to-r from-emerald-400 to-green-400',
        'bg-gradient-to-r from-green-400 to-lime-400',
        'bg-gradient-to-r from-lime-400 to-yellow-400'
    ];

    const techColors = ['#c7d2fe', '#bfdbfe', '#bae6fd', '#99f6e4', '#a7f3d0', '#d9f99d'];

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">

            {/* Top KPI Cards (Matched with other dashboards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Total Pelanggan', value: summary.total.toLocaleString('id-ID'), icon: Users, color: primaryColorClass },
                    { label: 'Aktif', value: summary.aktif.toLocaleString('id-ID'), icon: CheckCircle, color: 'emerald' },
                    { label: 'Suspend', value: summary.isolir.toLocaleString('id-ID'), icon: AlertTriangle, color: 'amber' },
                    { label: 'Tidak Aktif', value: summary.nonaktif.toLocaleString('id-ID'), icon: XCircle, color: 'rose' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                        key={i}
                        className="bg-white p-6 rounded-3xl border border-slate-200"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-medium text-slate-800 tracking-tighter">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={20} strokeWidth={2} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bento Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 grid-flow-row-dense">

                {/* Growth Chart - 8 Cols */}
                <BentoCard
                    title="User Acquisition Flow"
                    subtitle={`${selectedRange === '1W' ? '7 Hari' : selectedRange === '1M' ? '30 Hari' : selectedRange === '3M' ? '3 Bulan' : selectedRange === '1Y' ? '12 Bulan' : '6 Bulan'} Terakhir`}
                    icon={TrendingUp}
                    delay={0.1}
                    className="md:col-span-8 min-h-[380px]"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Metrik: Registrasi Baru</span>
                            {trendLoading && (
                                <div className={`w-3 h-3 border-2 border-${primaryColorClass}-500 border-t-transparent rounded-full animate-spin ml-2 mt-1`} />
                            )}
                        </div>
                        <div className="flex p-0.5 bg-slate-100 rounded-xl">
                            {['1W', '1M', '3M', '6M', '1Y'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setSelectedRange(r)}
                                    className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-tight transition-all rounded-lg ${selectedRange === r
                                        ? `bg-white text-${primaryColorClass}-600 border border-slate-200`
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={`h-[280px] w-full mt-4 -ml-4 pr-4 pb-4 transition-opacity duration-300 ${trendLoading ? 'opacity-40' : 'opacity-100'}`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyGrowth} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGrowthDemographics" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="Registrasi Baru"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorGrowthDemographics)"
                                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Status Composition Donut - 4 Cols */}
                <BentoCard
                    title="Customer Status"
                    subtitle="Proporsi Keaktifan Live"
                    icon={PieIcon}
                    delay={0.2}
                    className="md:col-span-4 min-h-[380px]"
                >
                    <div className="flex flex-col items-center justify-between h-full pt-4">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={90}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1">Total Entitas</span>
                                <span className="text-3xl font-medium text-slate-800 tracking-tighter leading-none">{summary.total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="w-full mt-4 flex gap-2">
                            {statusPieData.map((item, idx) => (
                                <div key={idx} className="flex-1 bg-slate-50/80 p-3 rounded-2xl flex flex-col gap-1 items-center justify-center border border-slate-200">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                        <span className="text-[10px] font-medium text-slate-500 uppercase">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-800 tracking-tight">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </BentoCard>

                {/* Branch Distribution - 6 Cols */}
                <BentoCard
                    title="Branch Capacity"
                    subtitle="Beban Tanggungan Cabang"
                    icon={Activity}
                    delay={0.4}
                    className="md:col-span-6"
                >
                    <div className="mt-4 pb-2">
                        <ProgressBarList data={perBranch} colors={gradientColors} />
                    </div>
                </BentoCard>

                {/* Packet Population - 6 Cols */}
                <BentoCard
                    title="Package Ecosystem"
                    subtitle="Distribusi Paket Internet"
                    icon={Wifi}
                    delay={0.5}
                    className="md:col-span-6"
                >
                    <div className="mt-4 pb-2">
                        <ProgressBarList
                            data={perPacket}
                            colors="bg-gradient-to-r from-blue-500 to-indigo-600"
                            typeLabel="Subs"
                        />
                    </div>
                </BentoCard>

                {/* Area Distribution - 12 Cols */}
                <BentoCard
                    title="Area Mapping"
                    subtitle="Konsentrasi Persebaran"
                    icon={MapPin}
                    delay={0.3}
                    className="md:col-span-12"
                >
                    <div className="mt-4 custom-scrollbar overflow-y-auto pr-2" style={{ maxHeight: '310px' }}>
                        <div style={{ height: Math.max(120, perArea.length * 40), width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={perArea}
                                    layout="vertical"
                                    margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                                    barCategoryGap="15%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="namaArea"
                                        hide
                                    />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={30}>
                                        <LabelList
                                            dataKey="namaArea"
                                            position="insideLeft"
                                            style={{ fill: '#1e293b', fontSize: 13, fontWeight: 500 }}
                                        />
                                        <LabelList
                                            dataKey="count"
                                            position="right"
                                            style={{ fill: '#334155', fontSize: 13, fontWeight: 500 }}
                                            formatter={(val: any) => typeof val === 'number' ? val.toLocaleString('id-ID') : val}
                                        />
                                        {perArea.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={techColors[index % techColors.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};

export default CustomerStatsPage;
