import React, { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
    ChevronRight,
    X,
    ChevronLeft,
    Zap,
    Terminal,
    LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MenuItem as MenuItemType, Tab } from "../../types"

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
    items: MenuItemType[]
    onOpenTab: (tabData: Tab) => void
    onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    items,
    onOpenTab,
    onToggle,
}) => {
    const [openSubMenu, setOpenSubMenu] = useState<string | null>(null)
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const location = useLocation()
    const sidebarRef = useRef<HTMLElement>(null)
    const navigate = useNavigate()

    const handleSubMenuToggle = (itemName: string) => {
        setOpenSubMenu(openSubMenu === itemName ? null : itemName)
    }

    const handleMenuItemClick = (
        name: string,
        path: string,
        icon?: any
    ) => {
        onOpenTab({ key: path, name, path, icon })
        navigate(path)
        setOpenSubMenu(null)
        setHoveredItem(null)
        // On mobile, close on navigation
        if (window.innerWidth < 768) {
            onClose()
        }
    }

    useEffect(() => {
        if (!isOpen) {
            setOpenSubMenu(null)
        }
    }, [isOpen, location.pathname])

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Toggle Button - Premium Bracket Style */}
            <button
                onClick={onToggle}
                className={cn(
                    "fixed top-1/2 -translate-y-1/2 z-50 bg-white border border-slate-200 text-slate-400 shadow-xl hover:text-primary hover:border-primary/30 transition-all duration-500 ease-in-out flex items-center justify-center group h-12 w-5 rounded-r-xl",
                    isOpen ? "left-64 rounded-l-xl rounded-r-none border-r-0" : "left-0"
                )}
                aria-label="Toggle sidebar"
            >
                <div className="flex flex-col items-center gap-0.5">
                    {isOpen ? (
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    ) : (
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                </div>
            </button>

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={cn(
                    "bg-white w-64 h-screen fixed top-0 left-0 shadow-2xl transform transition-all duration-500 ease-in-out flex flex-col z-40 border-r border-slate-100",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Brand Section */}
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
                            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                                <Zap className="h-5 w-5 text-white fill-white/20" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-slate-900 leading-none">CMSBill</span>
                                <span className="text-[10px] font-bold text-primary tracking-widest uppercase mt-0.5">Admin Panel</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
                    <div className="mb-4 px-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu Utama</span>
                    </div>

                    <nav className="space-y-1">
                        {items.map((item) => (
                            <div
                                key={item.name}
                                className="relative"
                                onMouseEnter={() => setHoveredItem(item.name)}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {item.subItems ? (
                                    <>
                                        <button
                                            onClick={() => handleSubMenuToggle(item.name)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group",
                                                openSubMenu === item.name
                                                    ? "bg-slate-50 text-primary"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    openSubMenu === item.name ? "bg-white shadow-sm" : "bg-transparent group-hover:bg-white group-hover:shadow-sm"
                                                )}>
                                                    {item.icon && <item.icon className={cn("h-4 w-4", item.color)} />}
                                                </div>
                                                <span className="font-semibold text-sm">{item.name}</span>
                                            </div>
                                            <ChevronRight className={cn(
                                                "h-4 w-4 transition-transform duration-300 opacity-40",
                                                openSubMenu === item.name ? "rotate-90 opacity-100 text-primary" : ""
                                            )} />
                                        </button>

                                        {/* Flyout Submenu */}
                                        {hoveredItem === item.name && (
                                            <div className="absolute left-[calc(100%+8px)] top-0 w-56 animate-in fade-in zoom-in-95 slide-in-from-left-2 duration-200 z-50">
                                                <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 py-3 overflow-hidden">
                                                    <div className="px-3 mb-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {item.subItems.map((subItem) => (
                                                            <button
                                                                key={subItem.name}
                                                                onClick={() => handleMenuItemClick(subItem.name, subItem.path!, subItem.icon)}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group/sub"
                                                            >
                                                                {subItem.icon && <subItem.icon className="h-4 w-4 text-slate-400 group-hover/sub:text-primary transition-colors" />}
                                                                <span>{subItem.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleMenuItemClick(item.name, item.path!, item.icon)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                            location.pathname === item.path
                                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            location.pathname === item.path ? "bg-white/20" : "bg-transparent group-hover:bg-white group-hover:shadow-sm"
                                        )}>
                                            {item.icon && <item.icon className={cn(
                                                "h-4 w-4",
                                                location.pathname === item.path ? "text-white" : item.color
                                            )} />}
                                        </div>
                                        <span className="font-semibold text-sm">{item.name}</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>

                    <div className="mt-8 px-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sistem</span>
                    </div>
                    <nav className="mt-2 space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all font-semibold text-sm group">
                            <div className="p-1.5 rounded-lg bg-transparent group-hover:bg-white group-hover:shadow-sm">
                                <Terminal className="h-4 w-4 text-theme-gray" />
                            </div>
                            <span>System Logs</span>
                        </button>
                    </nav>
                </div>

                {/* Footer Section */}
                <div className="p-4 border-t border-slate-50">
                    <div className="bg-slate-50 rounded-2xl p-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-theme-blue flex items-center justify-center text-white text-xs font-bold shadow-md">
                                AD
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-slate-900 truncate">Admin Diko</span>
                                <span className="text-[10px] text-slate-500 truncate">admin@cmsbill.id</span>
                            </div>
                        </div>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-pink-500 hover:bg-pink-50 rounded-xl transition-all font-bold text-sm group">
                        <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
