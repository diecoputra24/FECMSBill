import React from 'react';
import {
    Users,
    UserPlus,
    UserMinus,
    TrendingUp,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    Layers,
    Activity,
    Smartphone,
    Monitor
} from 'lucide-react';
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';

const growthData = [
    { name: 'Jan', new: 45, churn: 5, total: 1100 },
    { name: 'Feb', new: 65, churn: 8, total: 1157 },
    { name: 'Mar', new: 55, churn: 12, total: 1200 },
    { name: 'Apr', new: 85, churn: 15, total: 1270 },
    { name: 'May', new: 75, churn: 10, total: 1335 },
    { name: 'Jun', new: 95, churn: 7, total: 1423 },
];

const areaDistribution = [
    { name: 'Bandung Tengah', value: 450, color: '#6366f1' },
    { name: 'Bandung Timur', value: 320, color: '#8b5cf6' },
    { name: 'Cimahi', value: 280, color: '#ec4899' },
    { name: 'Ujung Berung', value: 215, color: '#f59e0b' },
];

const CustomerStatsPage: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Statistik Pelanggan</h1>
                    <p className="text-slate-500 font-medium">Analisis pertumbuhan, tingkat retensi, dan persebaran pasar.</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-primary transition-all">
                        <Smartphone size={20} />
                    </button>
                    <button className="p-3 bg-primary text-white rounded-2xl shadow-md shadow-primary/20">
                        <Monitor size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Total Pelanggan', value: '1,423', icon: Users, color: 'indigo', trend: 15.2 },
                    { title: 'Pelanggan Baru', value: '+95', icon: UserPlus, color: 'emerald', detail: 'Bulan ini' },
                    { title: 'Churn Rate', value: '0.8%', icon: UserMinus, color: 'rose', trend: -2.1 },
                    { title: 'User Upgraded', value: '42', icon: TrendingUp, color: 'amber', detail: 'Loyalty index' },
                ].map((stat, i) => {
                    const colorMap: any = {
                        indigo: 'bg-indigo-50 text-indigo-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                        rose: 'bg-rose-50 text-rose-600',
                        amber: 'bg-amber-50 text-amber-600'
                    };
                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={i}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${colorMap[stat.color]}`}>
                                    <stat.icon size={20} />
                                </div>
                                {stat.trend && (
                                    <span className={`text-[10px] font-black ${stat.trend > 0 ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-0.5 whitespace-nowrap`}>
                                        {stat.trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {Math.abs(stat.trend)}%
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</h3>
                            {stat.detail && <p className="text-[10px] text-slate-400 font-medium mt-1">{stat.detail}</p>}
                        </motion.div>
                    );
                })}
            </div>

            {/* Main Growth Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Tren Pertumbuhan Pelanggan</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Akusisi vs Churn</p>
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="new" name="Pelanggan Baru" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNew)" />
                            <Area type="monotone" dataKey="churn" name="Churn (Putus)" stroke="#ef4444" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Row 3 - Market Distribution & Churn Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Area Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Pasar per Wilayah</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-8">Konsentrasi Pelanggan</p>

                    <div className="space-y-6">
                        {areaDistribution.map((area, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-slate-600 flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-400" />
                                        {area.name}
                                    </span>
                                    <span className="text-slate-800">{area.value}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(area.value / 450) * 100}%` }}
                                        transition={{ duration: 1.5, delay: 0.2 + (idx * 0.1) }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: area.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Growth Analysis / Metrics */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Analisis Retensi</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Kinerja Customer Support</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                            <Activity size={14} />
                            Loyalty Score: 8.5/10
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                            <h4 className="text-sm font-black text-slate-700 uppercase tracking-tighter mb-4">Top 3 Alasan Churn</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Pindah Domisili', value: '45%', color: 'bg-indigo-400' },
                                    { label: 'Masalah Teknis', value: '30%', color: 'bg-rose-400' },
                                    { label: 'Harga Kompetitor', value: '25%', color: 'bg-amber-400' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-500">{item.label}</span>
                                        <span className={`px-2 py-0.5 rounded ${item.color} text-white`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-center text-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-600">
                                <Layers size={24} />
                            </div>
                            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tighter">Upgrade Rate</h4>
                            <p className="text-3xl font-black text-indigo-600 tracking-tighter my-1">4.2%</p>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase">Upgrade paket per bulan</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-4 text-slate-400">
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> New Users</span>
                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Churned</span>
                        </div>
                        <button className="text-primary hover:underline">Download Detailed CSV</button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CustomerStatsPage;
