import React from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Download
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { motion } from 'framer-motion';

// Mock data for initial UI - will be replaced with real data later
const revenueData = [
    { name: 'Jan', value: 45000000 },
    { name: 'Feb', value: 52000000 },
    { name: 'Mar', value: 48000000 },
    { name: 'Apr', value: 61000000 },
    { name: 'May', value: 55000000 },
    { name: 'Jun', value: 67000000 },
];

const customerData = [
    { name: 'Aktif', value: 1240, color: '#10b981' },
    { name: 'Isolir', value: 45, color: '#f59e0b' },
    { name: 'Non-Aktif', value: 12, color: '#ef4444' },
];

const StatCard = ({ title, value, detail, icon: Icon, trend, color }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-100 group-hover:opacity-90 transition-opacity rounded-2xl" />
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 blur-3xl ${color}`} />

        <div className="relative p-6 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'} bg-white px-2 py-1 rounded-full shadow-sm border border-slate-50`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
                <div className="text-2xl font-black text-slate-800 tracking-tight">{value}</div>
                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">{detail}</p>
            </div>

            <div className={`absolute bottom-0 left-0 h-1 rounded-full ${color} w-0 group-hover:w-full transition-all duration-500`} />
        </div>
    </motion.div>
);

const EISSummaryPage: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Executive Summary</h1>
                    <p className="text-slate-500 font-medium">Monitoring performa bisnis CMSBill secara real-time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={16} />
                        Filter Periode
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20">
                        <Download size={16} />
                        Export Laporan
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Pendapatan"
                    value="Rp 342.5M"
                    detail="Pendapatan Bulan Ini"
                    icon={DollarSign}
                    trend={12.5}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Pelanggan Aktif"
                    value="1,240"
                    detail="Pertumbuhan Net +42"
                    icon={Users}
                    trend={8.2}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Rata-rata ARPU"
                    value="Rp 275.0k"
                    detail="Revenue Per User"
                    icon={TrendingUp}
                    trend={-2.4}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Uptime Network"
                    value="99.98%"
                    detail="SLA Operasional"
                    icon={Activity}
                    trend={0.01}
                    color="bg-sky-500"
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Tren Pendapatan</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Data 6 Bulan Terakhir</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full">
                                <TrendingUp size={14} />
                                +15% vs Des
                            </span>
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    hide
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        background: '#fff',
                                        padding: '12px'
                                    }}
                                    formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Pendapatan']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Customer Distribution Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col"
                >
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Status Pelanggan</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-8">Distribusi Real-time</p>

                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={customerData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {customerData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-800">1.3k</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3 mt-4">
                            {customerData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Section - Performance Table / Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance by Branch */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Kinerja Per Cabang</h3>
                        <button className="text-xs font-bold text-primary hover:underline">Lihat Semua</button>
                    </div>

                    <div className="space-y-6">
                        {[
                            { name: 'Cabang Utama', sales: 125, rev: 'Rp 145M', perf: 92 },
                            { name: 'Bandung Timur', sales: 84, rev: 'Rp 68M', perf: 85 },
                            { name: 'Cimahi Utara', sales: 56, rev: 'Rp 52M', perf: 78 },
                            { name: 'Ujung Berung', sales: 42, rev: 'Rp 38M', perf: 65 },
                        ].map((branch, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{branch.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{branch.sales} Penjualan Baru</span>
                                    </div>
                                    <div className="text-right flex flex-col">
                                        <span className="text-sm font-black text-slate-800">{branch.rev}</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">{branch.perf}% Target</span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${branch.perf}%` }}
                                        transition={{ duration: 1, delay: 0.3 + (idx * 0.1) }}
                                        className={`h-full rounded-full ${branch.perf > 80 ? 'bg-primary' : branch.perf > 70 ? 'bg-indigo-400' : 'bg-amber-400'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Notifications / Alerts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Anomali & Alert</h3>
                        <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-tighter">
                            2 High Priority
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Latensi Tinggi - Cluster A</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Peningkatan latensi 35% terdeteksi di Router Core-01. Mempengaruhi 120 pelanggan.</p>
                                <span className="text-[10px] text-rose-500 font-black mt-2 block">PULIHKAN SEKARANG</span>
                            </div>
                        </div>

                        <div className="flex gap-4 p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Penurunan Penagihan</h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Penagihan di Cabang Cimahi menurun 12% dibandingkan periode yang sama bulan lalu.</p>
                                <span className="text-[10px] text-amber-600 font-black mt-2 block">ANALISIS PENYEBAB</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default EISSummaryPage;
