import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
    return (
        <header className="h-20 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 w-full flex items-center justify-between px-4 md:px-8 transition-all">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari transaksi, pelanggan..."
                        className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="relative text-slate-500 hover:bg-slate-50 rounded-xl">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-theme-pink rounded-full border-2 border-white"></span>
                    </Button>
                </div>

                <div className="hidden md:block h-8 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-medium text-slate-800 leading-none">Admin Diko</span>
                        <span className="text-xs text-slate-500 mt-1">Super Admin</span>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-theme-blue to-theme-purple p-0.5 shadow-md transform transition group-hover:scale-105">
                        <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center p-1">
                            <div className="h-full w-full rounded-[8px] bg-slate-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
