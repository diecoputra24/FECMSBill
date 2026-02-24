import React from 'react';
import {
    DollarSign,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    FileText,
    CreditCard,
    PieChart as PieIcon,
    BarChart3
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';

const monthlyProgressData = [
    { name: 'Jan', collected: 45, pending: 5 },
    { name: 'Feb', collected: 52, pending: 8 },
    { name: 'Mar', collected: 48, pending: 12 },
    { name: 'Apr', collected: 61, pending: 4 },
    { name: 'May', collected: 55, pending: 15 },
    { name: 'Jun', collected: 67, pending: 3 },
];

const packageRevenueData = [
    { name: 'Paket Home 10M', revenue: 125000000, color: '#6366f1' },
    { name: 'Paket Home 20M', revenue: 85400000, color: '#8b5cf6' },
    { name: 'Paket Bisnis S', revenue: 65200000, color: '#ec4899' },
    { name: 'Paket Bisnis M', revenue: 45800000, color: '#f43f5e' },
    { name: 'Addons & Lainnya', revenue: 21100000, color: '#f59e0b' },
];

const RevenueAnalysisPage: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analisis Pendapatan</h1>
                    <p className="text-slate-500 font-medium">Laporan mendalam performa finansial dan efektivitas penagihan.</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {['6 Bulan', '1 Tahun', 'Custom'].map((opt) => (
                        <button key={opt} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${opt === '6 Bulan' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-50'}`}>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-200"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <DollarSign size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            <ArrowUpRight size={14} />
                            +12.5%
                        </span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Total Revenue (YTD)</p>
                        <h2 className="text-3xl font-black tracking-tighter">Rp 2.45 Milyar</h2>
                        <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-4">
                            <span className="text-xs text-indigo-200">Target Tahunan: 5.0M</span>
                            <span className="text-xs font-bold">49%</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CreditCard size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            Tinggi
                        </span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Collection Rate</p>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">94.2%</h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Sangat efisien dibandingkan bulan lalu (92.1%)</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Calendar size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            Aging
                        </span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Outstanding (Tagihan Belum Bayar)</p>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Rp 245.8 Juta</h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Total tagihan yang melewati jatuh tempo</p>
                    </div>
                </motion.div>
            </div>

            {/* Row 2 - Collection Progress & Revenue Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Billing Progress Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Kesehatan Penagihan</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Lunas vs Belum Lunas</p>
                        </div>
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all cursor-pointer">
                            <BarChart3 size={18} />
                        </div>
                    </div>

                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyProgressData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="collected" name="Terbayar (Juta)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="pending" name="Belum Bayar (Juta)" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Revenue Structure by Package */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Struktur Pendapatan Paket</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Kontribusi per Layanan</p>
                        </div>
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <PieIcon size={18} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {packageRevenueData.map((item, idx) => (
                            <div key={idx} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{item.name}</span>
                                        <p className="text-[10px] text-slate-400 font-medium">Rp {(item.revenue / 1000000).toFixed(1)} Juta / Bln</p>
                                    </div>
                                    <span className="text-xs font-black text-slate-800">{((item.revenue / 342500000) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.revenue / 125000000) * 100}%` }}
                                        transition={{ duration: 1.2, delay: 0.4 + (idx * 0.1) }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Table: Top Delinquent Accounts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText size={20} className="text-rose-500" />
                        Top Tagihan Terlambat (Piutang)
                    </h3>
                    <button className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 group">
                        Lihat Semua Debitur
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white">
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cabang</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulan Terlambat</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { name: 'PT. Jeketi Network', branch: 'Utama', amount: 'Rp 4,500,000', months: 3, status: 'ISOLIR' },
                                { name: 'Budi Hartono', branch: 'Cimahi', amount: 'Rp 1,245,000', months: 2, status: 'ISOLIR' },
                                { name: 'Warung Nasi Bu Sri', branch: 'Bandung', amount: 'Rp 825,000', months: 1, status: 'AKTIF' },
                                { name: 'CV. Maju Jaya', branch: 'Utama', amount: 'Rp 3,150,000', months: 2, status: 'ISOLIR' },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="font-bold text-slate-700 text-sm">{row.name}</div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-medium text-slate-500">{row.branch}</td>
                                    <td className="px-8 py-4 font-black text-slate-800 text-sm">{row.amount}</td>
                                    <td className="px-8 py-4 text-xs font-bold text-rose-500">{row.months} Bulan</td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black ${row.status === 'ISOLIR' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default RevenueAnalysisPage;
