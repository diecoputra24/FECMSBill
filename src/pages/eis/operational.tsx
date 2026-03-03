import React from 'react';
import {
    Activity,
    Wifi,
    Server,
    Clock,
    CheckCircle2,
    Thermometer,
    Cpu,
    HardDrive,
    Network,
    AlertCircle,
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
} from 'recharts';
import { motion } from 'framer-motion';

// Mock Data - To be replaced with real endpoints (e.g., /infra/stats or /tickets/operational)
const uptimeData = [
    { name: '00:00', value: 99.98 },
    { name: '04:00', value: 99.99 },
    { name: '08:00', value: 99.95 },
    { name: '12:00', value: 99.92 },
    { name: '16:00', value: 99.97 },
    { name: '20:00', value: 99.99 },
    { name: '23:59', value: 99.98 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] px-5 py-4 min-w-[140px] text-white">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-700/50">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-6 mb-1.5 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: p.color }} />
                            <span className="text-sm font-semibold text-slate-200">{p.name || 'Value'}</span>
                        </div>
                        <span className="font-black text-base text-white tracking-tight">{p.value}%</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const BentoCard = ({ title, subtitle, icon: Icon, children, delay, className = "", noPad = false }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className={`bg-white border border-slate-100/80 rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden ${className}`}
    >
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
            <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
                {subtitle && <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {Icon && <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Icon size={16} strokeWidth={2.5} /></div>}
        </div>
        <div className={`flex-1 ${noPad ? '' : 'px-5 pb-5'}`}>
            {children}
        </div>
    </motion.div>
);

const ProgressBarList = ({ data, color }: any) => {
    return (
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar px-2 pb-2">
            {data.slice(0, 10).map((item: any, idx: number) => {
                const pct = Math.round((item.used / item.total) * 100);
                const isCritical = pct >= 80;
                const isWarning = pct >= 60 && pct < 80;

                let barColor = color;
                if (isCritical) barColor = 'bg-gradient-to-r from-rose-500 to-red-600';
                else if (isWarning) barColor = 'bg-gradient-to-r from-amber-400 to-amber-500';

                return (
                    <div key={idx} className="group cursor-default">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <div className="flex items-center gap-3">
                                <Activity size={14} className={isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-slate-400'} />
                                <span className="text-xs font-bold text-slate-700 tracking-tight">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800">{item.used} <span className="text-slate-400 font-medium">/ {item.total}</span></span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.unit}</span>
                            </div>
                        </div>
                        <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.5, delay: 0.3 + idx * 0.1, ease: "circOut" }}
                                className={`h-full rounded-full ${barColor}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const OperationalPerformancePage: React.FC = () => {
    const infrastructureCapacity = [
        { name: 'Core Router Utama', used: 65, total: 100, unit: 'Gbps' },
        { name: 'Distribusi Cabang A', used: 42, total: 60, unit: 'Gbps' },
        { name: 'Distribusi Area B', used: 12, total: 40, unit: 'Gbps' },
        { name: 'ODP Segmen C', used: 8, total: 20, unit: 'Gbps' },
    ];

    const activeIncidents = [
        { name: 'Cimahi-01 Core', issue: 'LOS Redaman Tinggi', time: '1h 20m', status: 'IN PROGRESS' },
        { name: 'ODP-BDG-42', issue: 'Port Damage', time: '45m', status: 'WAITING' },
        { name: 'Bandung Core', issue: 'Flapping BGP', time: '12m', status: 'RESOLVED' },
    ];

    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Mock loading for UI consistency
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-20">
                <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                    <div className="bg-primary animate-progress-material-1" />
                    <div className="bg-primary animate-progress-material-2" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 animate-pulse text-center">
                    Menghubungkan Metrik Infrastruktur
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto selection:bg-indigo-500 selection:text-white">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1"
            >
                <div>
                    <div className="flex gap-2 items-center mb-1">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Server size={24} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter">
                            Operation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Metrics</span>
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 max-w-xl md:ml-12">
                        Monitoring stabilitas jaringan, utilisasi perangkat, dan efisiensi tim teknis secara langsung.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Network Status</p>
                            <p className="text-sm font-black text-emerald-500 leading-none">All Systems Nom</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Uptime Global', value: '99.98%', icon: Wifi, color: 'emerald', detail: 'SLA Sesuai Target' },
                    { label: 'Avg Latency', value: '12ms', icon: Activity, color: 'indigo', detail: 'Distribusi Core' },
                    { label: 'Penyelesaian Tiket', value: '94%', icon: CheckCircle2, color: 'sky', detail: 'Resolution Rate' },
                    { label: 'Avg MTTR', value: '2.4 Jam', icon: Clock, color: 'amber', detail: 'Mean Time to Repair' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                        key={i}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div className={`inline-flex px-2 py-0.5 rounded bg-${stat.color}-50 text-${stat.color}-600 text-[10px] font-bold`}>
                            {stat.detail}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bento Grid Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 grid-flow-row-dense">

                {/* Uptime Trend Chart - 8 Cols */}
                <BentoCard
                    title="Rekam Stabilitas Jaringan"
                    subtitle="Uptime Server Real-time (24 Jam Terakhir)"
                    icon={Activity}
                    delay={0.3}
                    className="md:col-span-8 min-h-[380px]"
                >
                    <div className="flex items-center gap-4 mb-2 pl-2">
                        <span className="text-xs font-bold text-slate-500">Router Tersambung: 124 Nodes</span>
                    </div>
                    <div className="h-[280px] w-full mt-2 -ml-4 pr-4 pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={uptimeData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
                                <YAxis domain={[99.8, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Line
                                    type="stepAfter"
                                    dataKey="value"
                                    name="Uptime"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Hardware Health - 4 Cols */}
                <BentoCard
                    title="Hardware Health"
                    subtitle="Monitoring Server Fisik"
                    icon={Thermometer}
                    delay={0.4}
                    className="md:col-span-4 min-h-[380px]"
                >
                    <div className="space-y-6 mt-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 text-rose-500 rounded-xl"><Thermometer size={18} /></div>
                                <span className="text-sm font-bold text-slate-700">Avg CPU Temp</span>
                            </div>
                            <span className="text-lg font-black text-rose-600">42°C</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-500 rounded-xl"><Cpu size={18} /></div>
                                <span className="text-sm font-bold text-slate-700">CPU Load Average</span>
                            </div>
                            <span className="text-lg font-black text-indigo-600">12%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-500 rounded-xl"><HardDrive size={18} /></div>
                                <span className="text-sm font-bold text-slate-700">Memory Usage</span>
                            </div>
                            <span className="text-lg font-black text-amber-600">3.2 GB</span>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase mb-2">
                            <AlertCircle size={14} className="text-indigo-500" /> AI Insights
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Temperature is well within optimal levels. Memory capacity provides sufficient headroom for current active loads.
                        </p>
                    </div>
                </BentoCard>

                {/* Capacity - 4 Cols */}
                <BentoCard
                    title="Kapasitas Jaringan"
                    subtitle="Utilisasi Bandwidth Backbone"
                    icon={Network}
                    delay={0.5}
                    className="md:col-span-5"
                >
                    <div className="mt-4 pb-2">
                        <ProgressBarList
                            data={infrastructureCapacity}
                            color="bg-gradient-to-r from-blue-500 to-indigo-600"
                        />
                    </div>
                </BentoCard>

                {/* Active Support Tickets - 8 Cols */}
                <BentoCard
                    title="Technical Issue Queue"
                    subtitle="Antrian Insiden Operasional Aktif"
                    icon={Clock}
                    delay={0.6}
                    className="md:col-span-7"
                    noPad={true}
                >
                    <div className="px-5 pt-4 pb-4 border-b border-slate-50 flex items-center justify-between">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari Ticket ID / Router..."
                                className="bg-slate-50 border border-slate-100 rounded-full py-1.5 pl-9 pr-4 text-[10px] font-bold outline-none focus:border-indigo-300 w-48 text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30">
                                <tr>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Terminal / Router</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Deskripsi Kendala</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">SLA</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeIncidents.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700">{row.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{row.issue}</td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-400 group-hover:text-indigo-500 transition-colors">{row.time}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black border ${row.status === 'IN PROGRESS' ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50' :
                                                row.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                                                    'bg-amber-50 text-amber-600 border-amber-100/50'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};

export default OperationalPerformancePage;
