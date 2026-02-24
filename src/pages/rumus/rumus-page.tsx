import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calculator,
    Table as TableIcon,
    Wifi,
    Zap,
    Scissors,
    Info,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Components ---

const Card = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", className)}
    >
        {title && (
            <div className="p-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
                {Icon && (
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                )}
                <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">{title}</h3>
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </motion.div>
);

const Input = ({ label, value, onChange, type = "number", suffix, prefix }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            {prefix && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    {prefix}
                </div>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                    prefix && "pl-10",
                    suffix && "pr-12"
                )}
            />
            {suffix && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    {suffix}
                </div>
            )}
        </div>
    </div>
);

// --- Data ---

const PLC_DATA = [
    { type: "1:2", share: "50% / 50%", loss: "3.5 - 4.0 dB" },
    { type: "1:4", share: "25% setiap port", loss: "7.0 - 7.5 dB" },
    { type: "1:8", share: "12.5% setiap port", loss: "10.5 - 11.0 dB" },
    { type: "1:16", share: "6.25% setiap port", loss: "13.5 - 14.5 dB" },
    { type: "1:32", share: "3.125% setiap port", loss: "17.0 - 17.5 dB" },
];

const FBT_DATA = [
    { ratio: "50 : 50", through: 3.5, tap: 3.5 },
    { ratio: "60 : 40", through: 2.5, tap: 4.5 },
    { ratio: "70 : 30", through: 1.9, tap: 5.5 },
    { ratio: "80 : 20", through: 1.2, tap: 7.5 },
    { ratio: "85 : 15", through: 0.9, tap: 8.8 },
    { ratio: "90 : 10", through: 0.6, tap: 10.5 },
    { ratio: "95 : 5", through: 0.4, tap: 13.5 },
    { ratio: "99 : 1", through: 0.2, tap: 20.5 },
];

const TIPS = [
    {
        title: "Redaman Konektor",
        desc: "Setiap adapter (SC/UPC atau SC/APC), tambahkan redaman 0.25 - 0.5 dB.",
        icon: Wifi,
        color: "text-blue-500",
        bg: "bg-blue-50"
    },
    {
        title: "Redaman Splicing",
        desc: "Fusion splicing: 0.01 - 0.05 dB. Fast connector: s/d 0.5 dB.",
        icon: Scissors,
        color: "text-amber-500",
        bg: "bg-amber-50"
    },
    {
        title: "Warna Konektor",
        desc: "Biru (UPC): Redaman pantulan -50dB. Hijau (APC): -60dB (terbaik untuk CATV).",
        icon: Info,
        color: "text-green-500",
        bg: "bg-green-50"
    }
];

// --- Main Page ---

const RumusPage = () => {
    // Calculator State
    const [calcType, setCalcType] = useState<"plc" | "fbt">("plc");
    const [baseSignal, setBaseSignal] = useState("-2");
    const [selectedPLC, setSelectedPLC] = useState("3.5"); // Default 1:2
    const [selectedFBTRatio, setSelectedFBTRatio] = useState("90 : 10");
    const [fbtPort, setFBTPort] = useState<"thru" | "tap">("tap");
    const [extraLoss, setExtraLoss] = useState("0.5");

    const fbtLoss = useMemo(() => {
        const found = FBT_DATA.find(f => f.ratio === selectedFBTRatio);
        return fbtPort === "thru" ? found?.through || 0 : found?.tap || 0;
    }, [selectedFBTRatio, fbtPort]);

    const plcLabel = useMemo(() => {
        return PLC_DATA.find(p => p.loss.includes(selectedPLC))?.type || "Custom";
    }, [selectedPLC]);

    const totalLoss = useMemo(() => {
        const primaryLoss = calcType === "plc" ? parseFloat(selectedPLC) : fbtLoss;
        return primaryLoss + parseFloat(extraLoss);
    }, [calcType, selectedPLC, fbtLoss, extraLoss]);

    const finalResult = useMemo(() => {
        return (parseFloat(baseSignal) - totalLoss).toFixed(1);
    }, [baseSignal, totalLoss]);

    const signalStatus = useMemo(() => {
        const val = parseFloat(finalResult);
        if (val >= -24 && val <= -15) return { label: "Sangat Bagus", color: "text-green-500", bg: "bg-green-100" };
        if (val >= -27 && val < -24) return { label: "Waspada", color: "text-amber-500", bg: "bg-amber-100" };
        if (val < -27) return { label: "Buruk / Loss", color: "text-red-500", bg: "bg-red-100" };
        return { label: "Sinyal Kuat", color: "text-blue-500", bg: "bg-blue-100" };
    }, [finalResult]);

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Intro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
                        Simulasi redaman sinyal. Masukkan power awal, pilih jenis splitter yang ingin dihitung, dan lihat hasil akhirnya.
                    </p>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex flex-col justify-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Sinyal Target</span>
                    <span className="text-2xl font-bold text-slate-800">-15 s/d -24 dBm</span>
                    <span className="text-[10px] text-slate-400 font-medium">Standar kelayakan sinyal di sisi ONT pelanggan.</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Calculators & Tables */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Signal Attenuation Calculator */}
                    <Card title="Signal Attenuation Calculator" icon={Calculator}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                {/* Base Signal Input */}
                                <Input label="Power Sinyal Awal (Input)" value={baseSignal} onChange={setBaseSignal} suffix="dBm" />

                                {/* Calculator Type Switcher */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Metode Perhitungan</label>
                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                                        <button
                                            onClick={() => setCalcType("plc")}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl text-xs font-bold transition-all relative overflow-hidden",
                                                calcType === "plc" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            Rumus Splitter PLC
                                            {calcType === "plc" && <motion.div layoutId="activeType" className="absolute inset-0 bg-primary/5 -z-10" />}
                                        </button>
                                        <button
                                            onClick={() => setCalcType("fbt")}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl text-xs font-bold transition-all relative overflow-hidden",
                                                calcType === "fbt" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            Rumus Splitter Rasio
                                            {calcType === "fbt" && <motion.div layoutId="activeType" className="absolute inset-0 bg-primary/5 -z-10" />}
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={calcType}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {calcType === "plc" ? (
                                            /* PLC Selector */
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Splitter PLC</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {PLC_DATA.slice(0, 6).map((item) => (
                                                        <button
                                                            key={item.type}
                                                            onClick={() => setSelectedPLC(item.loss.split("-")[0].trim())}
                                                            className={cn(
                                                                "px-3 py-2.5 rounded-xl text-xs font-bold border transition-all",
                                                                plcLabel === item.type
                                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                                    : "bg-white border-slate-100 text-slate-600 hover:border-primary/30"
                                                            )}
                                                        >
                                                            {item.type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            /* FBT Selector */
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Rasio FBT</label>
                                                    <select
                                                        value={selectedFBTRatio}
                                                        onChange={(e) => setSelectedFBTRatio(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    >
                                                        {FBT_DATA.map(f => <option key={f.ratio} value={f.ratio}>{f.ratio}</option>)}
                                                    </select>
                                                </div>

                                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                                    <button
                                                        onClick={() => setFBTPort("thru")}
                                                        className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", fbtPort === "thru" ? "bg-white text-primary shadow-sm" : "text-slate-400")}
                                                    >
                                                        Port Thru
                                                    </button>
                                                    <button
                                                        onClick={() => setFBTPort("tap")}
                                                        className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all", fbtPort === "tap" ? "bg-white text-primary shadow-sm" : "text-slate-400")}
                                                    >
                                                        Port Tap
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                <Input label="Loss Tambahan (Ext)" value={extraLoss} onChange={setExtraLoss} suffix="dB" />
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-100 group">
                                <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
                                    <Zap size={200} />
                                </div>

                                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Hasil Akhir Sinyal</span>

                                <div className="flex flex-col gap-1 items-center mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <motion.span
                                            key={finalResult}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={cn("text-7xl font-black tracking-tighter transition-colors", signalStatus.color)}
                                        >
                                            {finalResult}
                                        </motion.span>
                                        <span className="text-2xl font-bold text-slate-400">dBm</span>
                                    </div>
                                    <div className={cn("px-4 py-1 rounded-full text-[10px] font-bold uppercase mt-2 border-2", signalStatus.bg, signalStatus.color, "border-current/10")}>
                                        {signalStatus.label}
                                    </div>
                                </div>

                                <div className="w-full bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detail Item {calcType.toUpperCase()}</span>
                                        <span className="text-xs font-bold text-pink-500">-{totalLoss.toFixed(1)} dB</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] font-bold text-slate-400 w-12 text-left uppercase">Awal</div>
                                            <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary w-full origin-left animate-progress-fast"></div>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-700 w-12 text-right">{baseSignal}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] font-bold text-slate-400 w-12 text-left uppercase">Loss</div>
                                            <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-pink-500 origin-left" style={{ width: `${Math.min(100, (totalLoss / 30) * 100)}%` }}></div>
                                            </div>
                                            <div className="text-[10px] font-bold text-pink-500 w-12 text-right">-{totalLoss.toFixed(1)}</div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Output</span>
                                            <span className={cn("text-sm font-black", signalStatus.color)}>{finalResult} dBm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* PLC Table */}
                        <Card title="Splitter PLC Standard" icon={TableIcon}>
                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 font-bold text-slate-800 text-xs">Tipe</th>
                                            <th className="px-4 py-3 font-bold text-slate-800 text-xs text-right">Redaman (Loss)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {PLC_DATA.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{item.type}</span>
                                                        <span className="text-[10px] text-slate-400">{item.share}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-mono font-bold text-primary">{item.loss}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* FBT Table */}
                        <Card title="Splitter Rasio (FBT)" icon={TableIcon}>
                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 font-bold text-slate-800 text-xs">Rasio</th>
                                            <th className="px-4 py-3 font-bold text-slate-800 text-xs text-center">Thru</th>
                                            <th className="px-4 py-3 font-bold text-slate-800 text-xs text-right">Tap</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {FBT_DATA.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-700">{item.ratio}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold text-[10px]">{item.through} dB</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-md font-bold text-[10px]">{item.tap} dB</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Tips & Extras */}
                <div className="lg:col-span-4 space-y-8">
                    <Card title="Technical Tips" icon={Target}>
                        <div className="space-y-6">
                            {TIPS.map((tip, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                                    <div className={cn("p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110", tip.bg)}>
                                        <tip.icon className={cn("h-5 w-5", tip.color)} />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-slate-800 text-sm">{tip.title}</span>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                            {tip.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/30">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10">
                            <Wifi size={240} />
                        </div>
                        <h4 className="text-xl font-bold mb-4 relative z-10">Penting!</h4>
                        <div className="space-y-4 relative z-10">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <p className="text-xs leading-relaxed font-medium">
                                    Nilai tabel adalah <strong>nilai aman maksimal</strong> lapangan. Secara teori 1:2 adalah 3 dB, namun margin 0.5 - 1 dB sangat disarankan untuk kompensasi rugi-rugi internal.
                                </p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <p className="text-xs leading-relaxed font-medium">
                                    Gunakan Redaman Splicing mendekati <strong>0.01 dB</strong> (Fusion). Jika menggunakan Fast Connector, waspadai redaman hingga 0.5 dB.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="bg-slate-900 border-none">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-4">
                                <Info size={24} />
                            </div>
                            <span className="text-white font-bold text-sm mb-2">Butuh Bantuan?</span>
                            <span className="text-slate-400 text-[10px] uppercase tracking-widest leading-relaxed">
                                Hubungi team NOC/Admin jika redaman di lapangan tidak sesuai standar.
                            </span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RumusPage;
