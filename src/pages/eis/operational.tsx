import React from 'react';
import {
    Activity,
    Wifi,
    Server,
    Clock,
    CheckCircle2,
    AlertCircle,
    Thermometer,
    Cpu,
    HardDrive,
    Network,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';

const uptimeData = [
    { name: '00:00', value: 99.98 },
    { name: '04:00', value: 99.99 },
    { name: '08:00', value: 99.95 },
    { name: '12:00', value: 99.92 },
    { name: '16:00', value: 99.97 },
    { name: '20:00', value: 99.99 },
    { name: '23:59', value: 99.98 },
];

const infrastructureCapacity = [
    { name: 'Bandung Core', used: 65, total: 100, unit: 'Gbps' },
    { name: 'Cimahi Edge', used: 42, total: 60, unit: 'Gbps' },
    { name: 'Lembang Sub', used: 12, total: 40, unit: 'Gbps' },
    { name: 'Sumedang Sub', used: 8, total: 20, unit: 'Gbps' },
];

const OperationalPerformancePage: React.FC = () => {
    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kinerja Operasional</h1>
                    <p className="text-slate-500 font-medium">Monitoring infrastruktur, stabilitas jaringan, dan efisiensi layanan teknis.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Sistem Normal</span>
                </div>
            </div>

            {/* Top Operational KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Uptime Network', value: '99.98%', icon: Wifi, color: 'emerald', detail: 'SLA Dashboard' },
                    { label: 'Avg Latency', value: '12ms', icon: Activity, color: 'indigo', detail: 'Target < 20ms' },
                    { label: 'Ticket Solved', value: '94%', icon: CheckCircle2, color: 'sky', detail: 'Resolution Rate' },
                    { label: 'Avg MTTR', value: '2.4h', icon: Clock, color: 'amber', detail: 'Mean Time to Repair' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                    >
                        <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon size={22} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                        <div className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{stat.detail}</p>
                    </motion.div>
                ))}
            </div>

            {/* Row 2 - Network Stability & Capacity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Uptime Trend */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Stabilitas Jaringan</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Uptime Real-time (24 Jam)</p>
                        </div>
                        <div className="text-xs font-bold text-slate-400">Total Router: 124</div>
                    </div>

                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={uptimeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis domain={[99.8, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Infrastructure Capacity */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Kapasitas Core & Backhaul</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Utilisasi Bandwidth Tahunan</p>
                        </div>
                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                            <Network size={18} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {infrastructureCapacity.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                    <span className="text-xs font-black text-slate-800">{item.used} / {item.total} {item.unit}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.used / item.total) * 100}%` }}
                                        transition={{ duration: 1.5, delay: 0.4 + (idx * 0.1) }}
                                        className={`h-full rounded-full ${item.used / item.total > 0.8 ? 'bg-rose-500' : item.used / item.total > 0.6 ? 'bg-amber-500' : 'bg-primary'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row - Router Health & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Router Hardware Health */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
                >
                    <h3 className="text-lg font-black text-slate-800 tracking-tight mb-6">Hardware Health</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Thermometer size={18} className="text-rose-500" />
                                <span className="text-sm font-bold text-slate-600">Avg CPU Temp</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">42°C</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Cpu size={18} className="text-indigo-500" />
                                <span className="text-sm font-bold text-slate-600">CPU Load</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">12%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <HardDrive size={18} className="text-amber-500" />
                                <span className="text-sm font-bold text-slate-600">Memory Usage</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">3.2 GB</span>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase mb-2">
                            <AlertCircle size={14} /> Tips Optimalisasi
                        </div>
                        <p className="text-[11px] text-indigo-500 font-medium leading-relaxed">
                            Monitor utilisasi segmen Bandung Timur karena mendekati batas kapasitas 85% pada jam sibuk.
                        </p>
                    </div>
                </motion.div>

                {/* Active Support Tickets */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                >
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Server size={20} className="text-primary" />
                            Antrian Troubleshooting
                        </h3>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari Ticket..."
                                className="bg-slate-50 border-none rounded-full py-1.5 pl-9 pr-4 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 w-40"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Router / ODP</th>
                                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Issue</th>
                                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Durasi</th>
                                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { name: 'Router-Cimahi-01', issue: 'LOS Redaman Tinggi', time: '1h 20m', status: 'IN PROGRESS' },
                                    { name: 'ODP-BDG-42', issue: 'Port Damage', time: '45m', status: 'WAITING' },
                                    { name: 'Router-Core-02', issue: 'BGP Flapping', time: '12m', status: 'RESOLVED' },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-4 text-xs font-bold text-slate-700">{row.name}</td>
                                        <td className="px-8 py-4 text-xs text-slate-500">{row.issue}</td>
                                        <td className="px-8 py-4 text-xs font-medium text-slate-400">{row.time}</td>
                                        <td className="px-8 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${row.status === 'IN PROGRESS' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    row.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
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
        </div>
    );
};

export default OperationalPerformancePage;
