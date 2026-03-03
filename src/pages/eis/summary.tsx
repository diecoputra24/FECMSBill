import React, { useEffect, useState } from 'react';
import {
    Activity,
    Clock,
    TrendingUp,
    AlertTriangle,
    ShieldAlert,
    MessageSquare
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
    BarChart,
    Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useEISStore } from '@/store/eis-store';

interface TicketingStats {
    status: {
        open: number;
        dispatched: number;
        claimed: number;
        inProgress: number;
        resolved: number;
        closed: number;
        total: number;
    };
    categories: {
        complaint: number;
        incident: number;
        openComplaint: number;
        openIncident: number;
    };
    priorities: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    sla: {
        breachedCs: number;
        breachedTech: number;
        totalBreached: number;
        avgResolutionTimeHours: number;
        aging: {
            lessThan1d: number;
            lessThan2d: number;
            lessThan3d: number;
            lessThan7d: number;
            moreThan7d: number;
        };
    };
    stages: {
        complaint: { cs: number; tech: number; waitingClose: number };
        incident: { cs: number; tech: number; waitingClose: number };
        total: number;
    };
    recentTickets: any[];
    weeklyTrend: { name: string; open: number; resolved: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 min-w-[120px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5">{label}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-xs font-medium text-slate-600">{p.name}</span>
                        </div>
                        <span className="font-bold text-xs text-slate-900">{p.value.toLocaleString('id-ID')}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const BentoCard = ({ title, subtitle, icon: Icon, children, delay, className = "" }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className={`bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden ${className}`}
    >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase">{title}</h3>
                {subtitle && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {Icon && <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg border border-slate-100"><Icon size={14} /></div>}
        </div>
        <div className="flex-1 px-5 pb-5 mt-2">
            {children}
        </div>
    </motion.div>
);

const TicketingDashboardPage: React.FC = () => {
    const { ticketingStats, setTicketingStats } = useEISStore();
    const [stats, setStats] = useState<TicketingStats | null>(ticketingStats);
    const [loading, setLoading] = useState(!ticketingStats);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/tickets/stats');
                setStats(res.data);
                setTicketingStats(res.data);
            } catch (err) {
                console.error('Failed to load ticketing stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [setTicketingStats]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-20">
                <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                    <div className="bg-primary animate-progress-material-1" />
                    <div className="bg-primary animate-progress-material-2" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 animate-pulse text-center">
                    Sinkronisasi Data Ticketing
                </p>
            </div>
        );
    }

    if (!stats) return null;

    const agingData = [
        { name: '< 1 Hari', value: stats.sla.aging.lessThan1d, color: '#10b981' },
        { name: '< 2 Hari', value: stats.sla.aging.lessThan2d, color: '#3b82f6' },
        { name: '< 3 Hari', value: stats.sla.aging.lessThan3d, color: '#f59e0b' },
        { name: '< 7 Hari', value: stats.sla.aging.lessThan7d, color: '#f97316' },
        { name: '> 7 Hari', value: stats.sla.aging.moreThan7d, color: '#ef4444' },
    ];

    const StageBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => (
        <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
                <span className="text-[11px] font-bold text-slate-800">{count} <span className="text-slate-300 font-normal">/ {total}</span></span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / (total || 1)) * 100}%` }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-12 max-w-[1600px] mx-auto p-4 lg:p-0 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Stage Breakdown Details */}
                <BentoCard
                    title="Detailed Stage Tracking"
                    subtitle="Monitoring Progress Berdasarkan Kategori"
                    icon={Activity}
                    delay={0.5}
                    className="md:col-span-4"
                >
                    <div className="space-y-8 py-2">
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                <MessageSquare size={12} className="text-amber-500" /> Complaint Breakdown
                            </h4>
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <StageBar label="Pending at CS" count={stats.stages.complaint.cs} total={stats.categories.complaint} color="bg-amber-400" />
                                <StageBar label="Escalated to Tech" count={stats.stages.complaint.tech} total={stats.categories.complaint} color="bg-indigo-400" />
                                <StageBar label="Waiting for Close" count={stats.stages.complaint.waitingClose} total={stats.categories.complaint} color="bg-emerald-400" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                <AlertTriangle size={12} className="text-rose-500" /> Incident Breakdown
                            </h4>
                            <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <StageBar label="Pending at CS" count={stats.stages.incident.cs} total={stats.categories.incident} color="bg-rose-400" />
                                <StageBar label="Escalated to Tech" count={stats.stages.incident.tech} total={stats.categories.incident} color="bg-indigo-400" />
                                <StageBar label="Waiting for Close" count={stats.stages.incident.waitingClose} total={stats.categories.incident} color="bg-emerald-400" />
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* Aging SLA Chart */}
                <BentoCard
                    title="Open Ticket Aging (SLA)"
                    subtitle="Distribusi Umur Tiket Belum Selesai"
                    icon={Clock}
                    delay={0.6}
                    className="md:col-span-8"
                >
                    <div className="h-[340px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                            <BarChart data={agingData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-xl font-bold text-slate-800">{payload[0].value} <span className="text-xs text-slate-400 font-medium">Tiket</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                    {agingData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-5 gap-2 mt-2">
                            {agingData.map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div className="w-full h-1 rounded-full mb-2" style={{ backgroundColor: item.color }} />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{item.name}</span>
                                    <span className="text-xs font-bold text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </BentoCard>

                {/* Performance Analytics (Weekly) */}
                <BentoCard
                    title="Resolution Productivity"
                    subtitle="Kecepatan Tim Menyelesaikan Tiket (7 Hari Terakhir)"
                    icon={TrendingUp}
                    delay={0.7}
                    className="md:col-span-8 h-[360px]"
                >
                    <div className="h-full w-full -ml-4 pr-4 pb-4">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                            <AreaChart data={stats.weeklyTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="open" name="Masuk" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOpen)" />
                                <Area type="monotone" dataKey="resolved" name="Selesai" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Queue Priority */}
                <BentoCard
                    title="Critical Queue Monitor"
                    subtitle="Daftar 5 Tiket Urgen Terbaru"
                    icon={ShieldAlert}
                    delay={0.8}
                    className="md:col-span-4 h-[360px]"
                >
                    <div className="mt-4 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {stats.recentTickets.map((ticket, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold ${ticket.category === 'INCIDENT' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                                        }`}>
                                        {ticket.category === 'INCIDENT' ? 'INC' : 'CMP'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{ticket.subject}</p>
                                        <p className="text-[10px] font-medium text-slate-400">{ticket.customer?.namaPelanggan || 'No Customer'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                                        ticket.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                    <p className="text-[9px] font-medium text-slate-400 mt-1">
                                        {new Date(ticket.createdAt).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>

            </div>
        </div>
    );
};

export default TicketingDashboardPage;
