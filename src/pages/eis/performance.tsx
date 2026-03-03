import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    ArrowUpRight,
    Search,
    User,
    DollarSign,
    Target,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { CustomTable } from '@/components/ui/custom-table';
import { Badge } from '@/components/ui/badge';

interface StaffPerformance {
    id: string;
    name: string;
    username: string;
    role: string;
    branch: string;
    metrics: {
        totalCustomers: number;
        newCustomers: number;
        collection: {
            totalAmount: number;
            count: number;
        };
        ticketing: {
            resolved: number;
            slaMet: number;
            slaRate: number;
        };
    };
}

const StaffPerformancePage: React.FC = () => {
    const [stats, setStats] = useState<StaffPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/users/performance');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to load staff performance stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const filteredStats = stats.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase()) ||
        s.branch.toLowerCase().includes(search.toLowerCase())
    );

    // Summary Metrics
    const totalCollection = stats.reduce((acc, s) => acc + s.metrics.collection.totalAmount, 0);
    const totalResolved = stats.reduce((acc, s) => acc + s.metrics.ticketing.resolved, 0);
    const avgSla = stats.length > 0
        ? stats.reduce((acc, s) => acc + s.metrics.ticketing.slaRate, 0) / stats.length
        : 100;
    const totalNewCust = stats.reduce((acc, s) => acc + s.metrics.newCustomers, 0);

    const columns = [
        {
            header: "Nama Staff",
            sortable: true,
            render: (row: StaffPerformance) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <User size={18} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 uppercase text-xs">{row.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1">
                            <Badge variant="outline" className="px-1 py-0 h-4 text-[8px] font-black">{row.role}</Badge>
                            <span>@{row.username}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "KPI: Penagihan (Finance)",
            render: (row: StaffPerformance) => {
                const isFinance = row.role === 'FINANCE' || row.role === 'ADMIN' || row.role === 'SUPERADMIN';
                const achievement = isFinance ? (row.metrics.collection.count > 0 ? 100 : 0) : 0;

                return (
                    <div className={`space-y-1.5 ${!isFinance ? 'opacity-20 grayscale' : ''}`}>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Collection</span>
                            <span className="text-xs font-bold text-green-600">Rp {row.metrics.collection.totalAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${achievement}%` }}
                                className="h-full bg-green-500"
                            />
                        </div>
                        <div className="text-[9px] text-slate-400 italic">{row.metrics.collection.count} Transaksi Berhasil</div>
                    </div>
                );
            }
        },
        {
            header: "KPI: Akuisisi (Teknisi)",
            render: (row: StaffPerformance) => {
                const isTech = row.role === 'TEKNISI';
                // Target mock: 5 new customers per month
                const target = 5;
                const achievement = Math.min(100, (row.metrics.newCustomers / target) * 100);

                return (
                    <div className={`space-y-1.5 ${!isTech ? 'opacity-20 grayscale' : ''}`}>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase">New Sales</span>
                            <span className="text-xs font-bold text-blue-600">+{row.metrics.newCustomers} Pelanggan</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden text-[9px]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${achievement}%` }}
                                className="h-full bg-blue-500"
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold">
                            <span className="text-slate-400 tracking-tighter">TARGET: {target}</span>
                            <span className={achievement >= 100 ? 'text-green-500' : 'text-slate-400'}>{achievement.toFixed(0)}%</span>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "KPI: SLA (Teknisi)",
            render: (row: StaffPerformance) => {
                const isTech = row.role === 'TEKNISI' || row.role === 'ADMIN';
                const rate = row.metrics.ticketing.slaRate;
                const color = rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500';

                return (
                    <div className={`space-y-1.5 ${!isTech && row.role !== 'SUPERADMIN' ? 'opacity-20 grayscale' : ''}`}>
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase">SLA Compliance</span>
                            <span className={`text-xs font-black ${rate >= 90 ? 'text-emerald-600' : 'text-slate-700'}`}>{rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                className={`h-full ${color}`}
                            />
                        </div>
                        <div className="text-[9px] text-slate-400">{row.metrics.ticketing.resolved} Tiket Selesai</div>
                    </div>
                );
            }
        },
        {
            header: "Final KPI Score",
            render: (row: StaffPerformance) => {
                // 1. SLA SCORE (40% Weight)
                const slaScore = row.metrics.ticketing.slaRate;

                // 2. TICKETING PRODUCTIVITY (30% Weight) - Target: 10 tickets/mo
                const tktTarget = 10;
                const tktProgress = Math.min(100, (row.metrics.ticketing.resolved / tktTarget) * 100);

                // 3. BUSINESS ACHIEVEMENT (30% Weight)
                let busProgress = 0;
                if (row.role === 'FINANCE') {
                    // Finance judged by successful collection activity
                    busProgress = row.metrics.collection.count > 0 ? 100 : 0;
                } else {
                    // Technicians judged by new customer targets (Target: 5)
                    busProgress = Math.min(100, (row.metrics.newCustomers / 5) * 100);
                }

                // WEIGHTED CALCULATION
                const finalScore = (slaScore * 0.4) + (tktProgress * 0.3) + (busProgress * 0.3);

                let label = "CUKUP";
                let variant: any = "secondary";

                if (finalScore >= 90) { label = "DISTINGUISHED"; variant = "success"; }
                else if (finalScore >= 80) { label = "MERIT"; variant = "success"; }
                else if (finalScore < 60) { label = "BELOW TARGET"; variant = "destructive"; }

                return (
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end">
                            <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{finalScore.toFixed(1)}</div>
                            <Badge variant={variant} className="text-[8px] font-black px-1.5 py-0 mt-1 uppercase">
                                {label}
                            </Badge>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="flex gap-1.5 text-[7px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg border border-slate-100/50">
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span>SLA</span>
                                <span className="text-indigo-500">{(slaScore * 0.4).toFixed(1)}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200" />
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span>TKT</span>
                                <span className="text-indigo-500">{(tktProgress * 0.3).toFixed(1)}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200" />
                            <div className="flex flex-col items-center min-w-[24px]">
                                <span>BUS</span>
                                <span className="text-indigo-500">{(busProgress * 0.3).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto selection:bg-indigo-500 selection:text-white">
            {/* Header Performance Status */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 rounded-[32px] p-8 gap-6 text-white overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tighter mb-1">Staff <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">KPI Dashboard</span></h1>
                    <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">Monitoring Produktivitas & Pencapaian Target Bulan Ini</p>
                    <div className="flex gap-3">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Company Avg Score</span>
                            <span className="text-xl font-bold">{avgSla.toFixed(1)}%</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">KPI Achieved</span>
                            <span className="text-xl font-bold">{stats.length} Staff</span>
                        </div>
                    </div>
                </div>
                <div className="relative z-10 hidden md:block">
                    <Target size={100} className="text-white/5 absolute -right-4 -top-10 rotate-12" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    title="Pelanggan Baru"
                    value={`+${totalNewCust}`}
                    subtitle="Pencapaian Area Tugas"
                    icon={Users}
                    color="blue"
                />
                <MetricCard
                    title="Collection Total"
                    value={`Rp ${totalCollection.toLocaleString('id-ID')}`}
                    subtitle="Efisiensi Penagihan"
                    icon={DollarSign}
                    color="green"
                />
                <MetricCard
                    title="Ticket Resolution"
                    value={totalResolved.toString()}
                    subtitle="Case Resolved Monthly"
                    icon={CheckCircle2}
                    color="purple"
                />
                <MetricCard
                    title="SLA Compliance"
                    value={`${avgSla.toFixed(1)}%`}
                    subtitle="Kualitas Pengerjaan"
                    icon={Activity}
                    color="orange"
                />
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[40px] border border-slate-200/60 shadow-xl overflow-hidden p-6 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Leaderboard & Penilaian KPI</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Scoring aktif berdasarkan data real-time</p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama staff, ID, atau lokasi cabang..."
                            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <CustomTable
                    data={filteredStats}
                    columns={columns}
                    loading={loading}
                    emptyMessage="Data kinerja staff tidak ditemukan."
                />
            </div>

            {/* Placeholder for Cash Flow Rotation */}
            <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-16 text-center shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <TrendingUp size={64} className="mx-auto text-indigo-500/50 mb-6 relative z-10" />
                <h3 className="text-2xl font-black text-white tracking-tighter relative z-10 uppercase italic">Financial Cashflow Rotation</h3>
                <p className="text-slate-400 max-w-md mx-auto mt-3 text-sm font-medium relative z-10">
                    Sistem sedang memproses algoritma perputaran uang kas. Matriks ini akan menghubungkan performa staff dengan efisiensi pengelolaan likuiditas.
                </p>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
    const colorMap: any = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col gap-4"
        >
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue}`}>
                    <Icon size={20} />
                </div>
                <ArrowUpRight className="text-slate-300" size={18} />
            </div>
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {title}
                </div>
                <div className="text-2xl font-bold text-slate-900 truncate">
                    {value}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <TrendingUp size={10} /> {subtitle}
                </div>
            </div>
        </motion.div>
    );
};

export default StaffPerformancePage;
