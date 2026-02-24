"use client";

import React, { useState, useEffect } from "react";
import { X, MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { themeConfig } from "@/config/themes";
import { motion, AnimatePresence } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  href: string;
}

interface TabMenuProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const TabMenu: React.FC<TabMenuProps> = ({
  tabs,
  activeTab,
  onTabClick,
  onTabClose,
}) => {
  const { theme } = useTheme();
  // @ts-ignore
  const currentTheme = themeConfig[theme];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && !(event.target as Element).closest('.tab-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-center border-b border-gray-100 px-4 py-0 bg-white/80 backdrop-blur-md sticky top-0 z-30 min-h-[48px]"
    >
      <div
        className="flex space-x-1 py-1.5 h-full items-center flex-1 overflow-x-auto scrollbar-hide no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                className={clsx(
                  "group relative flex items-center px-4 py-1.5 rounded-lg cursor-pointer whitespace-nowrap text-sm h-[32px] transition-all duration-300 ease-in-out flex-none",
                  {
                    [currentTheme.active.text]: isActive,
                    "bg-slate-50 shadow-sm border border-slate-100 font-medium z-10": isActive,
                    "text-gray-500 hover:bg-gray-50/80": !isActive,
                  }
                )}
                onClick={() => onTabClick(tab.id)}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium tracking-tight px-1">{tab.label}</span>

                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(tab.id);
                      }}
                      className={clsx(
                        "p-0.5 rounded-md transition-all duration-200",
                        isActive ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className={clsx(
                      "absolute bottom-0 left-2 right-2 h-0.5 rounded-full",
                      currentTheme.active.text.replace('text', 'bg')
                    )}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Overflow Button / More Menu Icon (Dots) */}
      <div className="relative tab-dropdown ml-2 shrink-0">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={clsx(
            "p-2 rounded-lg transition-all duration-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-transparent",
            isDropdownOpen && "bg-slate-50 border-slate-100 text-slate-800 shadow-sm"
          )}
          title="Menu Tab"
        >
          <MoreHorizontal size={18} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 shadow-xl rounded-xl py-2 z-50 overflow-hidden"
            >
              <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Semua Tab Aktif</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => {
                      onTabClick(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={clsx(
                      "group flex items-center justify-between px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors duration-150",
                      activeTab === tab.id ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50/50"
                    )}
                  >
                    <span className={clsx("text-sm transition-colors", activeTab === tab.id ? "font-semibold" : "font-normal")}>
                      {tab.label}
                    </span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabClose(tab.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabMenu;
