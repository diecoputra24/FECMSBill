import React from "react"
import { motion } from "framer-motion"
import mapImage from "@/assets/map.png"
import {
    User,
    Clock,
    ChevronRight,
    PenSquare,
    ChevronDown
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useBranchStore } from "@/store/branchStore"

import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

import type { Branch } from "@/types/branch"

export function Dashboard() {
    const { user } = useAuthStore()
    const { branches, fetchBranches } = useBranchStore()
    const [userBranch, setUserBranch] = React.useState<Branch | null>(null)

    React.useEffect(() => {
        fetchBranches()
    }, [fetchBranches])

    React.useEffect(() => {
        if (user?.branchId && branches.length > 0) {
            const branch = branches.find(b => b.id === user.branchId)
            if (branch) {
                setUserBranch(branch)
            }
        }
    }, [user, branches])

    // Mock data/Logic to match image
    // Image shows: FL.RIT - AINUN ANUGRAH
    // PT PLN ICON PLUS
    // Badge: Admin Sales

    // We will use user data but try to match the format
    const displayName = user?.name?.toUpperCase() || "-"
    const companyName = user?.vendor?.name?.toUpperCase() || "-"
    const jobTitle = user?.position || user?.role || 'Admin Sales'

    // Dynamic Last Login
    const lastLogin = user?.updatedAt
        ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true, locale: id })
        : "Baru saja"

    const userRoleDisplay = user?.role || "PENJUALAN" // Use actual role

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3 pb-10 max-w-7xl mx-auto font-sans"
        >

            {/* Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Section - Top Left */}
                <motion.div variants={item} className="lg:col-span-2">
                    <div className="bg-white rounded-3xl p-8 flex items-center gap-6 h-full">
                        <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden text-slate-300">
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-10 w-10" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-700 tracking-tight uppercase">
                                {displayName}
                            </h2>
                            <p className="text-slate-400 font-bold text-sm uppercase">
                                {companyName}
                            </p>
                            <div className="pt-2">
                                <span className="bg-primary text-white rounded-md px-4 py-1.5 text-xs font-bold uppercase shadow-sm shadow-primary/20">
                                    {jobTitle}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Info Section - Top Right */}
                <motion.div variants={item}>
                    <div className="bg-white rounded-3xl p-8 flex items-center justify-between h-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-full">
                                <Clock className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Login</p>
                                <p className="text-sm font-bold text-slate-700">{lastLogin}</p>
                            </div>
                        </div>
                        {/* Vertical Divider */}
                        <div className="h-10 w-[1px] bg-slate-100" />

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-full">
                                <User className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Role</p>
                                <p className="text-sm font-bold text-slate-700 uppercase">{userRoleDisplay}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Section: Full Width Map with Floating Sidebar */}
            <motion.div variants={item} className="w-full">
                <div className="relative w-full min-h-[600px] rounded-3xl overflow-hidden bg-white">
                    {/* Background Map Image with White Transparency */}
                    <div className="absolute inset-0 bg-white">
                        <img
                            src={mapImage}
                            alt="Peta Jangkauan Layanan"
                            className="w-full h-full object-cover opacity-80 mix-blend-multiply"
                        />
                        {/* Extra white tint overlay if needed */}
                        <div className="absolute inset-0 bg-white/20"></div>
                    </div>

                    {/* Floating Sidebar Overlay */}
                    <div className="absolute top-10 right-10 z-10 w-80 space-y-6">

                        {/* Branch Privilege */}
                        <div className="bg-transparent">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    Branch Privilege
                                </h3>
                                <div className="flex gap-2">
                                    <PenSquare className="h-3 w-3 text-slate-400 cursor-pointer hover:text-blue-500 transition-colors" />
                                    <ChevronDown className="h-3 w-3 text-slate-400 cursor-pointer" />
                                </div>
                            </div>
                            <div className="pl-4 border-l-2 border-primary">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase">
                                    {userBranch?.namaBranch || "All Branch"}
                                </div>
                            </div>
                        </div>

                        {/* Area Privilege */}
                        <div className="bg-transparent mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    Area Privilege
                                </h3>
                                <ChevronDown className="h-3 w-3 text-slate-400 cursor-pointer" />
                            </div>
                            <div className="space-y-3 pl-2 max-h-60 overflow-y-auto pointer-events-auto">
                                {user?.areas && user.areas.length > 0 ? (
                                    user.areas.map((area) => (
                                        <div key={area.id} className="flex items-center gap-3 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                                            <ChevronRight className="h-3 w-3 text-slate-300" />
                                            <span className="text-sm font-medium uppercase">{area.namaArea}</span>
                                        </div>
                                    ))
                                ) : userBranch?.areas && userBranch.areas.length > 0 ? (
                                    userBranch.areas.map((area) => (
                                        <div key={area.id} className="flex items-center gap-3 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                                            <ChevronRight className="h-3 w-3 text-slate-300" />
                                            <span className="text-sm font-medium uppercase">{area.namaArea}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <span className="text-sm font-medium italic">No Specific Area Access</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
