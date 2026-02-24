import type { LucideIcon } from "lucide-react"

export interface MenuItem {
    name: string
    path?: string
    icon?: LucideIcon
    subItems?: MenuItem[]
    color?: string
}

export interface Tab {
    key: string
    name: string
    path: string
    icon?: LucideIcon
}
