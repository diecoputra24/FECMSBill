import React from 'react';
import { Shield, Activity, Users, Globe } from 'lucide-react';
import { CustomTable } from "@/components/ui/custom-table";
import { Badge } from "@/components/ui/badge";

const VPNPage: React.FC = () => {
    // Mock data for VPN connections
    const vpnData = [
        { id: 1, name: "VPN-USER-01", ip: "10.8.0.10", status: "Connected", uptime: "12h 30m", location: "Singapore" },
        { id: 2, name: "VPN-USER-02", ip: "10.8.0.11", status: "Disconnected", uptime: "0", location: "Indonesia" },
        { id: 3, name: "VPN-USER-03", ip: "10.8.0.12", status: "Connected", uptime: "5d 2h", location: "USA" },
    ];

    const columns = [
        {
            header: "VPN Username",
            render: (item: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Shield size={16} />
                    </div>
                    <span className="font-bold text-slate-800 uppercase tracking-tight">{item.name}</span>
                </div>
            )
        },
        {
            header: "IP Address",
            render: (item: any) => <span className="font-mono text-slate-600">{item.ip}</span>
        },
        {
            header: "Location",
            render: (item: any) => (
                <div className="flex items-center gap-2 text-slate-600">
                    <Globe size={14} />
                    <span>{item.location}</span>
                </div>
            )
        },
        {
            header: "Status",
            render: (item: any) => (
                item.status === "Connected" ? (
                    <Badge variant="success" className="bg-green-50 text-green-700 border-green-100 uppercase text-[10px] font-bold">Connected</Badge>
                ) : (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 uppercase text-[10px] font-bold">Offline</Badge>
                )
            )
        },
        {
            header: "Uptime",
            render: (item: any) => <div className="flex items-center gap-2 text-slate-500"><Activity size={14} /> {item.uptime}</div>
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Layanan VPN</h2>
                        <p className="text-xs text-slate-500">Monitoring status dan koneksi member VPN aktif.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Member</p>
                        <p className="text-2xl font-bold text-slate-800">128</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Online</p>
                        <p className="text-2xl font-bold text-slate-800">42</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Offline</p>
                        <p className="text-2xl font-bold text-slate-800">86</p>
                    </div>
                </div>
            </div>

            <CustomTable
                data={vpnData}
                columns={columns}
                emptyMessage="Tidak ada member VPN yang terdaftar."
            />
        </div>
    );
};

export default VPNPage;
