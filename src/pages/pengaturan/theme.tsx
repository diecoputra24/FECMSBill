import React from "react";
import { useTheme } from "@/context/ThemeContext";
import type { ThemeColor } from "@/types/theme";
import { Check } from "lucide-react";
import clsx from "clsx";

const themes: { name: string; color: ThemeColor; hex: string }[] = [
    { name: "Blue Ocean", color: "blue", hex: "#2563eb" },
    { name: "Emerald Green", color: "green", hex: "#059669" },
    { name: "Royal Purple", color: "purple", hex: "#7c3aed" },
    { name: "Sakura Pink", color: "pink", hex: "#db2777" },
    { name: "Slate Gray", color: "gray", hex: "#4b5563" },
    { name: "Sunshine Yellow", color: "yellow", hex: "#eab308" },
];

const ThemePage: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="max-w-6xl px-4 md:px-8 py-4">

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {themes.map((t) => {
                    const isSelected = theme === t.color;
                    return (
                        <div
                            key={t.color}
                            onClick={() => setTheme(t.color)}
                            className={clsx(
                                "group relative flex flex-col cursor-pointer rounded-xl border-2 overflow-hidden bg-white",
                                isSelected
                                    ? "border-transparent ring-2 ring-offset-1"
                                    : "border-slate-100 hover:border-slate-200"
                            )}
                            style={isSelected ? {
                                borderColor: t.hex,
                                "--tw-ring-color": t.hex
                            } as React.CSSProperties : {}}
                        >
                            {/* Theme Skeleton Preview */}
                            <div className="bg-slate-50/50 p-4 space-y-3 border-b border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-7 h-7 rounded-lg"
                                            style={{ backgroundColor: t.hex }}
                                        />
                                        <div className="space-y-1">
                                            <div className="h-2 w-12 bg-slate-200 rounded-full" />
                                            <div className="h-1.5 w-8 bg-slate-100 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                                    <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
                                </div>

                                <div className="flex space-x-2 pt-1">
                                    <div
                                        className="h-6 flex-1 rounded-md flex items-center justify-center"
                                        style={{ backgroundColor: t.hex + '15' }}
                                    >
                                        <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: t.hex }} />
                                    </div>
                                    <div className="h-6 flex-1 rounded-md bg-slate-100" />
                                </div>
                            </div>

                            {/* Theme Info */}
                            <div className="p-3 flex items-center justify-between bg-white">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-medium text-slate-800 truncate">{t.name}</span>
                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                                        {t.hex}
                                    </span>
                                </div>
                                {isSelected && (
                                    <div
                                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: t.hex + '15', color: t.hex }}
                                    >
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Preview Section */}
            <div className="mt-16 p-8 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-medium text-slate-800">Preview Mode</h3>
                        <p className="text-slate-500 mt-1">Lihat bagaimana tema ini mempengaruhi elemen UI aplikasi.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            className="px-6 py-2.5 rounded-xl text-white font-medium transition-all active:scale-95"
                            style={{ backgroundColor: themes.find(x => x.color === theme)?.hex }}
                        >
                            Primary Button
                        </button>
                        <button className="px-6 py-2.5 rounded-xl bg-white text-slate-700 font-medium border border-slate-200">
                            Secondary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemePage;
