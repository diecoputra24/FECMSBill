import React, { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/sidebar"
import TabMenu from "@/components/sidebar/tabmenu"
import { cn } from "@/lib/utils"
import { useNavigate, useLocation } from "react-router-dom"
import { useBranchStore } from "@/store/branchStore"
import { useAreaStore } from "@/store/areaStore"
import { useRouterStore } from "@/store/routerStore"
import { useCustomerStore } from "@/store/customerStore"
import { useAddonStore } from "@/store/addonStore"
import { usePackageStore } from "@/store/packageStore"
import { useInvoiceStore } from "@/store/invoiceStore"
import { useOpportunityStore } from "@/store/opportunityStore"
import { findMenuByHref } from "@/config/menu";
import { useAuthStore } from "@/store/authStore";
import { useUpgradeStore } from "@/store/upgradeStore"
import { useUpgradeRequestStore } from "@/store/upgradeRequestStore";
import { useCustomerChangeRequestStore } from "@/store/customerChangeRequestStore";
import { useCustomerChangeStore } from "@/store/customerChangeStore";
import { useCustomerStatusStore } from "@/store/customerStatusStore";
import { useConnectionChangeStore } from "@/store/connectionChangeStore";
import { useCustomerStatusRequestStore } from "@/store/customerStatusRequestStore";
import { useConnectionChangeRequestStore } from "@/store/connectionChangeRequestStore";
import { useDiscountRequestStore } from "@/store/discountRequestStore";
import { useTicketStore } from "@/store/ticketStore";

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()
    const location = useLocation()

    // Detect mobile initial state
    const [isMobile, setIsMobile] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            // If mobile, default to closed
            if (mobile) {
                setIsSidebarOpen(false)
            } else {
                setIsSidebarOpen(true)
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const [tabs, setTabs] = useState<{ id: string, label: string, href: string }[]>([
        { id: "dashboard", label: "Home", href: "/" }
    ])
    const [activeTab, setActiveTab] = useState("dashboard")



    // Effect 1: Add new tabs when location changes
    useEffect(() => {
        const path = location.pathname

        setTabs(prevTabs => {
            // Check if tab already exists for this path
            if (prevTabs.some(t => t.href === path)) {
                return prevTabs
            }

            // Determine label and ID
            const menuItem = findMenuByHref(path)
            let label = "Page"
            let id = "page-" + Date.now()

            if (menuItem) {
                label = menuItem.label
                id = menuItem.id
            } else {
                // Fallback: Generate from path
                const segments = path.split('/').filter(Boolean)
                const lastSegment = segments[segments.length - 1] || "dashboard"
                // Simple title case
                label = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
                id = lastSegment
            }

            // Ensure ID uniqueness if fallback was used or duplicate ID exists
            if (prevTabs.some(t => t.id === id)) {
                id = `${id}-${Date.now()}`
            }

            return [...prevTabs, { id, label, href: path }]
        })
    }, [location.pathname])

    // Effect 2: Sync activeTab with current URL
    useEffect(() => {
        const path = location.pathname
        const currentTab = tabs.find(t => t.href === path)

        if (currentTab && activeTab !== currentTab.id) {
            setActiveTab(currentTab.id)
        }
    }, [location.pathname, tabs, activeTab])

    const handleMenuClick = (item: any) => {
        if (item.href) {
            if (!tabs.find(t => t.id === item.id)) {
                setTabs(prev => [...prev, { id: item.id, label: item.label, href: item.href }])
            }
            // setActiveTab is handled by useEffect based on location.pathname
            navigate(item.href)

            // Close sidebar after selection, especially on mobile
            if (isMobile) {
                setIsSidebarOpen(false)
            }
        }
    }

    const handleTabClick = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId)
        if (tab) {
            // setActiveTab is handled by useEffect based on location.pathname
            navigate(tab.href)
        }
    }

    const handleTabClose = (tabId: string) => {
        if (tabs.length <= 1) return // Keep at least one tab

        const tab = tabs.find(t => t.id === tabId)
        if (tab) {
            // Reset store filters if the closed tab is for Branch or Area
            if (tab.href === "/pengaturan/branch" || tab.id.startsWith("branch")) {
                useBranchStore.getState().resetFilters();
            }
            if (tab.href === "/pengaturan/area" || tab.id.startsWith("area")) {
                useAreaStore.getState().resetFilters();
            }
            if (tab.href === "/pengaturan/router" || tab.id.startsWith("router")) {
                useRouterStore.getState().resetFilters();
            }
            if (tab.href === "/pelanggan" || tab.id === "pelanggan-list") {
                useCustomerStore.getState().resetFilters();
            }
            if (tab.href === "/layanan/addon" || tab.id.startsWith("addon")) {
                useAddonStore.getState().resetFilters();
            }
            if (tab.href === "/layanan" || tab.id === "paket-list") {
                usePackageStore.getState().resetFilters();
            }
            if (tab.href === "/tagihan" || tab.id === "tagihan") {
                useInvoiceStore.getState().resetFilters();
            }
            if (tab.href === "/opportunity/list" || tab.id === "list-opportunity") {
                useOpportunityStore.getState().resetFilters();
            }

            // Request stores reset
            if (tab.id === "upgrade-request" || tab.href === "/pelanggan/upgrade") {
                useUpgradeStore.getState().resetState();
            }
            if (tab.id === "upgrade-approval" || tab.href === "/pelanggan/upgrade/approval") {
                useUpgradeRequestStore.getState().resetFilters();
            }
            if (tab.id === "upgrade-history" || tab.href === "/pelanggan/upgrade/history") {
                useUpgradeRequestStore.getState().resetHistoryFilters();
            }
            if (tab.id === "change-request" || tab.href === "/pelanggan/change") {
                useCustomerChangeStore.getState().resetState();
            }
            if (tab.id === "change-approval" || tab.href === "/pelanggan/change/approval") {
                useCustomerChangeRequestStore.getState().resetFilters();
            }
            if (tab.id === "change-history" || tab.href === "/pelanggan/change/history") {
                useCustomerChangeRequestStore.getState().resetHistoryFilters();
            }
            if (tab.id === "status-request" || tab.href === "/pelanggan/status") {
                useCustomerStatusStore.getState().resetState();
            }
            if (tab.id === "status-approval" || tab.href === "/pelanggan/status/approval") {
                useCustomerStatusRequestStore.getState().resetFilters();
            }
            if (tab.id === "status-history" || tab.href === "/pelanggan/status/history") {
                useCustomerStatusRequestStore.getState().resetHistoryFilters();
            }
            if (tab.id === "connection-request" || tab.href === "/pelanggan/connection") {
                useConnectionChangeStore.getState().resetState();
            }
            if (tab.id === "connection-approval" || tab.href === "/pelanggan/connection/approval") {
                useConnectionChangeRequestStore.getState().resetFilters();
            }
            if (tab.id === "connection-history" || tab.href === "/pelanggan/connection/history") {
                useConnectionChangeRequestStore.getState().resetHistoryFilters();
            }

            // Discount request reset
            if (tab.id === "diskon-approval" || tab.href === "/layanan/diskon/approval") {
                useDiscountRequestStore.getState().resetFilters();
            }
            if (tab.id === "diskon-history" || tab.href === "/layanan/diskon/history") {
                useDiscountRequestStore.getState().resetHistoryFilters();
            }

            // Ticketing stores reset
            if (tab.href === "/ticketing/incident" || tab.id === "ticket-incident-list") {
                useTicketStore.getState().resetFilters('INCIDENT');
            }
            if (tab.href === "/ticketing/incident/request" || tab.id === "ticket-incident-request") {
                useTicketStore.getState().resetForm('INCIDENT');
            }
            if (tab.href === "/ticketing/complaint" || tab.id === "ticket-complaint-list") {
                useTicketStore.getState().resetFilters('COMPLAINT');
            }
            if (tab.href === "/ticketing/complaint/request" || tab.id === "ticket-complaint-request") {
                useTicketStore.getState().resetForm('COMPLAINT');
            }
        }

        const tabIndex = tabs.findIndex(t => t.id === tabId)
        const newTabs = tabs.filter(t => t.id !== tabId)
        setTabs(newTabs)

        if (activeTab === tabId) {
            const nextTab = newTabs[tabIndex] || newTabs[tabIndex - 1]
            if (nextTab) {
                setActiveTab(nextTab.id)
                navigate(nextTab.href)
            }
        }
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] flex overflow-hidden h-screen w-screen font-sans">
            <Sidebar
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                isMobile={isMobile}
                onMenuClick={handleMenuClick}
                onLogout={async () => {
                    await useAuthStore.getState().logout();
                    navigate("/login");
                }}
            />

            <div className={cn(
                "flex flex-col flex-1 transition-all duration-500 ease-in-out min-h-screen overflow-hidden bg-white",
            )}>
                <TabMenu
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabClick={handleTabClick}
                    onTabClose={handleTabClose}
                />
                <main className="flex-1 px-4 md:px-8 pt-2 md:pt-4 pb-10 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6 flex items-end justify-between">
                            <h1 className="text-4xl font-normal text-slate-800 tracking-tight">
                                {tabs.find(t => t.id === activeTab)?.label || "Home"}
                            </h1>
                            <div id="page-header-actions" className="flex items-center gap-2"></div>
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
