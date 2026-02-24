import { useState, useRef, useMemo, useEffect, useCallback, Component } from "react";
import { createPortal } from "react-dom";
import type { ErrorInfo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitCommit,
    Plus,
    Trash2,
    Zap,
    ArrowRight,
    Network,
    Maximize,
    Minimize,
    Box,
    Undo2,
    Redo2,
    Check,
    Edit3,
    Minus,
    Type,
    AlertCircle,
    RotateCcw,
    LayoutDashboard,
    Loader2,
    Clock,
    Image as ImageIcon,
    MousePointer2,
    Hand,
    RefreshCw
} from "lucide-react";
import { toBlob } from 'html-to-image';
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";

// --- Types ---
type NodeType = "source" | "plc" | "fbt";

interface NodeData {
    label: string;
    baseLoss: number;
    thruLoss?: number;
    tapLoss?: number;
    fbtRatio?: string;
    capacity?: number;
}

interface Node {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: NodeData;
}

interface AreaNode {
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    fontSize?: number;
}

interface Edge {
    id: string;
    source: string;
    target: string;
    sourcePort: 'thru' | 'tap' | 'default';
    distance: number;
    loss: number;
}

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
    areas: AreaNode[];
}

interface NetworkMapData {
    nodes: Node[];
    edges: Edge[];
    areas: AreaNode[];
    baseSignal: string;
    scale: number;
    panning: { x: number, y: number };
}

interface MapMetadata {
    id: string;
    name: string;
    updatedAt: string;
    data: NetworkMapData;
}

// --- Constants ---
const DEVICE_WIDTH = 300;
const DEVICE_HEIGHT = 190;

const SPLITTER_OPTS = [
    { label: "Splitter 1:2", value: 3.8, cap: 2 },
    { label: "Splitter 1:4", value: 7.2, cap: 4 },
    { label: "Splitter 1:8", value: 10.5, cap: 8 },
    { label: "Splitter 1:16", value: 13.8, cap: 16 },
    { label: "Splitter 1:32", value: 17.2, cap: 32 },
    { label: "Splitter 1:64", value: 20.5, cap: 64 },
];

const FBT_OPTS = [
    { label: "Ratio 99:1", thru: 0.2, tap: 21.0 },
    { label: "Ratio 95:5", thru: 0.4, tap: 14.2 },
    { label: "Ratio 90:10", thru: 0.6, tap: 10.5 },
    { label: "Ratio 85:15", thru: 0.9, tap: 8.8 },
    { label: "Ratio 80:20", thru: 1.2, tap: 7.5 },
    { label: "Ratio 75:25", thru: 1.5, tap: 6.5 },
    { label: "Ratio 70:30", thru: 1.9, tap: 5.5 },
    { label: "Ratio 60:40", thru: 2.5, tap: 4.5 },
    { label: "Ratio 50:50", thru: 3.5, tap: 3.5 },
];

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Canvas Error:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse">
                        <AlertCircle size={48} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Sistem Mengalami Kendala</h1>
                        <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">Terjadi kesalahan saat merender peta jaringan.</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3"><RotateCcw size={18} /> Segarkan Halaman</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Components ---

const AddDeviceModal = ({
    isOpen,
    onClose,
    onAdd,
    sourceParams,
    sourcePort
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (type: NodeType, params: any, distance: number) => void;
    sourceParams?: any;
    sourcePort?: string;
}) => {
    const [step, setStep] = useState<"type" | "params">("type");
    const [selectedType, setSelectedType] = useState<NodeType | null>(null);
    const [distance, setDistance] = useState(150);
    const [distanceError, setDistanceError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep("type");
            setSelectedType(null);
            setDistance(150);
            setDistanceError(null);
        }
    }, [isOpen]);

    const handleNext = (type: NodeType) => {
        setSelectedType(type);
        setStep("params");
    };

    const handleFinalAdd = (params: any) => {
        if (distance < 0 || isNaN(distance)) {
            setDistanceError("Jarak tidak valid");
            return;
        }
        if (selectedType) {
            onAdd(selectedType, params, distance);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h3 className="font-black text-xl text-white tracking-tight uppercase">Tambah Node Baru</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Dari: <span className="text-blue-400">{sourceParams?.label || "Unknown"}</span> {sourcePort && sourcePort !== 'default' && `(${sourcePort})`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Plus className="rotate-45 text-slate-400" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {step === "type" ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleNext("plc")} className="p-6 rounded-2xl border-2 border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center space-y-4 group">
                                <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                                    <Network size={28} />
                                </div>
                                <div className="font-black text-slate-200 uppercase text-xs tracking-widest">Splitter</div>
                            </button>
                            <button onClick={() => handleNext("fbt")} className="p-6 rounded-2xl border-2 border-slate-800 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-center space-y-4 group">
                                <div className="w-14 h-14 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/10">
                                    <GitCommit size={28} />
                                </div>
                                <div className="font-black text-slate-200 uppercase text-xs tracking-widest">Coupler / Ratio</div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button onClick={() => setStep("type")} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                                <ArrowRight className="rotate-180" size={14} /> Kembali ke Tipe
                            </button>

                            <div className="space-y-4 px-2">
                                <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Panjang Kabel (Meter)</label>
                                        {distanceError && <span className="text-[9px] font-bold text-rose-500 uppercase italic animate-bounce">{distanceError}</span>}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            autoFocus
                                            value={distance}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setDistance(isNaN(val) ? 0 : val);
                                                setDistanceError(null);
                                            }}
                                            className={cn(
                                                "bg-slate-950 border rounded-xl px-4 py-3 text-white font-mono font-bold w-full focus:ring-2 outline-none transition-all",
                                                distanceError ? "border-rose-500 ring-rose-500/20" : "border-slate-700 focus:ring-blue-500"
                                            )}
                                        />
                                        <div className="text-right shrink-0">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Loss Kabel</div>
                                            <div className="text-sm font-mono font-black text-blue-400 tracking-tighter">{((distance / 1000) * 0.35).toFixed(3)} dB</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Pilih Redaman Perangkat</label>
                                    {selectedType === "plc" && SPLITTER_OPTS.map((opt) => (
                                        <button key={opt.label} onClick={() => handleFinalAdd(opt)} className="p-3 text-left w-full rounded-xl bg-slate-800/50 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex justify-between items-center group">
                                            <span>{opt.label}</span>
                                            <span className="font-mono text-slate-500 group-hover:text-white/80">-{opt.value} dB</span>
                                        </button>
                                    ))}
                                    {selectedType === "fbt" && FBT_OPTS.map((opt) => (
                                        <button key={opt.label} onClick={() => handleFinalAdd(opt)} className="p-3 text-left w-full rounded-xl bg-slate-800/50 hover:bg-pink-600 border border-slate-700 hover:border-pink-400 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex justify-between items-center group">
                                            <span>{opt.label}</span>
                                            <div className="flex gap-3 font-mono text-[10px]">
                                                <span className="opacity-80">T: -{opt.thru}</span>
                                                <span className="opacity-80">P: -{opt.tap}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const EditDeviceModal = ({
    isOpen,
    onClose,
    onUpdate,
    node
}: {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (type: NodeType, params: any) => void;
    node: Node | null;
}) => {
    const [step, setStep] = useState<"type" | "params">("type");
    const [selectedType, setSelectedType] = useState<NodeType | null>(null);

    useEffect(() => {
        if (isOpen && node) {
            setStep("type");
            setSelectedType(node.type);
        }
    }, [isOpen, node]);

    const handleNext = (type: NodeType) => {
        setSelectedType(type);
        setStep("params");
    };

    const handleFinalUpdate = (params: any) => {
        if (selectedType) {
            onUpdate(selectedType, params);
            onClose();
        }
    };

    if (!isOpen || !node) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h3 className="font-black text-xl text-white tracking-tight uppercase">Ubah Perangkat</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Node: <span className="text-blue-400">{node.data.label}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Plus className="rotate-45 text-slate-400" /></button>
                </div>

                <div className="p-6 space-y-6">
                    {step === "type" ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleNext("plc")} className={cn("p-6 rounded-2xl border-2 transition-all text-center space-y-4 group", selectedType === 'plc' ? "border-blue-500 bg-blue-500/10" : "border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5")}>
                                <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                                    <Network size={28} />
                                </div>
                                <div className="font-black text-slate-200 uppercase text-xs tracking-widest">Splitter</div>
                            </button>
                            <button onClick={() => handleNext("fbt")} className={cn("p-6 rounded-2xl border-2 transition-all text-center space-y-4 group", selectedType === 'fbt' ? "border-pink-500 bg-pink-500/10" : "border-slate-800 hover:border-pink-500/50 hover:bg-pink-500/5")}>
                                <div className="w-14 h-14 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/10">
                                    <GitCommit size={28} />
                                </div>
                                <div className="font-black text-slate-200 uppercase text-xs tracking-widest">Ratio</div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button onClick={() => setStep("type")} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                                <ArrowRight className="rotate-180" size={14} /> Kembali ke Tipe
                            </button>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Pilih Redaman Baru</label>
                                {selectedType === "plc" && SPLITTER_OPTS.map((opt) => (
                                    <button key={opt.label} onClick={() => handleFinalUpdate(opt)} className="p-3 text-left w-full rounded-xl bg-slate-800/50 hover:bg-blue-600 border border-slate-700 hover:border-blue-400 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex justify-between items-center group">
                                        <span>{opt.label}</span>
                                        <span className="font-mono text-slate-500 group-hover:text-white/80">-{opt.value} dB</span>
                                    </button>
                                ))}
                                {selectedType === "fbt" && FBT_OPTS.map((opt) => (
                                    <button key={opt.label} onClick={() => handleFinalUpdate(opt)} className="p-3 text-left w-full rounded-xl bg-slate-800/50 hover:bg-pink-600 border border-slate-700 hover:border-pink-400 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest transition-all flex justify-between items-center group">
                                        <span>{opt.label}</span>
                                        <div className="flex gap-3 font-mono text-[10px]">
                                            <span className="opacity-80">T: -{opt.thru}</span>
                                            <span className="opacity-80">P: -{opt.tap}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Helper Functions ---

const calculateGraph = (nodes: Node[], edges: Edge[], baseSignal: number) => {
    try {
        const nodeSignals = new Map<string, number>();
        const sourceNode = nodes.find(n => n.type === "source");
        if (!sourceNode) return { nodeSignals };

        const queue = [sourceNode.id];
        nodeSignals.set(sourceNode.id + "_input", baseSignal);

        const visited = new Set<string>();
        visited.add(sourceNode.id);

        let iterations = 0;
        const MAX_ITERATIONS = nodes.length * 10;

        while (queue.length > 0 && iterations < MAX_ITERATIONS) {
            iterations++;
            const currentId = queue.shift()!;
            const currentInput = nodeSignals.get(currentId + "_input") ?? 0;
            const currentNode = nodes.find(n => n.id === currentId);
            if (!currentNode) continue;

            const deviceLoss = currentNode.type === 'source' ? 0 : (currentNode.data.baseLoss || 0);
            const outputVal = currentInput - deviceLoss;

            nodeSignals.set(currentId + "_input", currentInput);
            nodeSignals.set(currentId + "_output", outputVal);
            nodeSignals.set(currentId, outputVal);

            const outgoingEdges = edges.filter(e => e.source === currentId);
            outgoingEdges.forEach(edge => {
                let actualDeviceOutput = outputVal;
                if (currentNode.type === 'fbt') {
                    const fbtLoss = edge.sourcePort === 'thru' ? (currentNode.data.thruLoss || 0) : (currentNode.data.tapLoss || 0);
                    actualDeviceOutput = currentInput - fbtLoss;
                }
                const totalSignalAtTarget = actualDeviceOutput - edge.loss;
                nodeSignals.set(edge.target + "_input", totalSignalAtTarget);
                if (!visited.has(edge.target)) {
                    visited.add(edge.target);
                    queue.push(edge.target);
                }
            });
        }
        return { nodeSignals };
    } catch (error) {
        return { nodeSignals: new Map<string, number>() };
    }
};

const getAnchorPoint = (node: Node, side: 'left' | 'right' | 'top' | 'bottom', port?: string) => {
    if (!node?.position) return { x: 0, y: 0 };
    const { x, y } = node.position;
    const w = DEVICE_WIDTH;
    const h = DEVICE_HEIGHT;

    // Y-offset for ports (used for bundling/FBT ports)
    let yOffset = h / 2;
    if (node.type === 'fbt' && (side === 'left' || side === 'right')) {
        yOffset = port === 'thru' ? 70 : 130;
    }

    switch (side) {
        case 'left': return { x: x, y: y + yOffset };
        case 'right': return { x: x + w, y: y + yOffset };
        case 'top': return { x: x + w / 2, y: y };
        case 'bottom': return { x: x + w / 2, y: y + h };
        default: return { x: x + w, y: y + yOffset };
    }
};

const getSmartPath = (source: Node, target: Node, port: string = 'default', bundleIndex: number = 0, bundleSize: number = 1) => {
    try {
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;

        let sSide: 'left' | 'right' | 'top' | 'bottom' = 'right';
        let tSide: 'left' | 'right' | 'top' | 'bottom' = 'left';

        // Horizontal logic
        if (dx > 350) { sSide = 'right'; tSide = 'left'; }
        else if (dx < -350) { sSide = 'left'; tSide = 'right'; }
        else {
            // Check vertical if horizontal is close
            if (dy > 250) { sSide = 'bottom'; tSide = 'top'; }
            else if (dy < -250) { sSide = 'top'; tSide = 'bottom'; }
            else { sSide = 'right'; tSide = 'left'; } // Default fallback
        }

        const startBase = getAnchorPoint(source, sSide, port);
        const endBase = getAnchorPoint(target, tSide);

        const SPACING = 45;
        // Waterfall track: Each cable gets its own lane from the source
        const trackOffset = (bundleIndex + 1) * SPACING;

        // Jitter for start position (vertical separation at node edge)
        const start = {
            x: startBase.x + (sSide === 'top' || sSide === 'bottom' ? (bundleIndex - (bundleSize - 1) / 2) * 15 : 0),
            y: startBase.y + (sSide === 'left' || sSide === 'right' ? (bundleIndex - (bundleSize - 1) / 2) * 25 : 0)
        };
        const end = { x: endBase.x, y: endBase.y };

        const STUB = 50;
        const stubStartX = start.x + (sSide === 'right' ? STUB : sSide === 'left' ? -STUB : 0);
        const stubStartY = start.y + (sSide === 'bottom' ? STUB : sSide === 'top' ? -STUB : 0);

        const stubEndX = end.x + (tSide === 'right' ? STUB : tSide === 'left' ? -STUB : 0);
        const stubEndY = end.y + (tSide === 'bottom' ? STUB : tSide === 'top' ? -STUB : 0);

        // Fixed track position: doesn't depend on target X/Y, only on source + index
        const laneX = sSide === 'right' ? start.x + trackOffset : sSide === 'left' ? start.x - trackOffset : end.x;
        const laneY = sSide === 'bottom' ? start.y + trackOffset : sSide === 'top' ? start.y - trackOffset : end.y;

        if (sSide === 'left' || sSide === 'right') {
            return `
                M ${start.x} ${start.y} 
                L ${stubStartX} ${start.y}
                L ${laneX} ${start.y} 
                L ${laneX} ${end.y} 
                L ${stubEndX} ${end.y}
                L ${end.x} ${end.y}
            `;
        } else {
            return `
                M ${start.x} ${start.y} 
                L ${start.x} ${stubStartY}
                L ${start.x} ${laneY}
                L ${end.x} ${laneY}
                L ${end.x} ${stubEndY}
                L ${end.x} ${end.y}
            `;
        }
    } catch (e) {
        return "M 0 0";
    }
};



// --- Network Map Canvas Component ---

const NetworkMapCanvas = ({ mapId, initialData }: { mapId: string, initialData: NetworkMapData }) => {
    // Initial State Fallbacks
    const defaultAreas = [
        { id: 'area-1', label: 'Headend Server', x: 50, y: 50, width: 500, height: 600, color: 'bg-slate-800/40', fontSize: 30 }
    ];
    const defaultNodes = [
        { id: 'root', type: 'source' as const, position: { x: 130, y: 220 }, data: { label: 'OLT', baseLoss: 0, capacity: 4 } }
    ];

    const [areas, setAreas] = useState<AreaNode[]>(initialData?.areas || defaultAreas);
    const [nodes, setNodes] = useState<Node[]>(initialData?.nodes || defaultNodes);
    const [edges, setEdges] = useState<Edge[]>(initialData?.edges || []);
    const [baseSignal, setBaseSignal] = useState(initialData?.baseSignal || "7");
    const [scale, setScale] = useState(initialData?.scale || 0.85);
    const [panning, setPanning] = useState(initialData?.panning || { x: 100, y: 100 });

    const [history, setHistory] = useState<HistoryState[]>([]);
    const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tempSourceId, setTempSourceId] = useState<string | null>(null);
    const [tempPort, setTempPort] = useState<'thru' | 'tap' | 'default'>('default');
    const [editNodeId, setEditNodeId] = useState<string | null>(null);
    const [clipboard, setClipboard] = useState<{ nodes: Node[], edges: Edge[], areas: AreaNode[] } | null>(null);


    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionStartRef = useRef<{ x: number, y: number } | null>(null);

    const [interactionMode, setInteractionMode] = useState<'move' | 'select'>('move');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'selection' | 'map' } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const containerRef = useRef<HTMLDivElement>(null);

    const [isCapturing, setIsCapturing] = useState(false);

    // Auto-save Effect
    // State Ref for robustness (prevents stale closures in async/timers)
    const stateRef = useRef({ nodes, edges, areas, baseSignal, scale, panning, mapId });
    useEffect(() => {
        stateRef.current = { nodes, edges, areas, baseSignal, scale, panning, mapId };
    }, [nodes, edges, areas, baseSignal, scale, panning, mapId]);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveData = useCallback(async () => {
        try {
            setSaveStatus('saving');
            const data = stateRef.current;
            await api.patch(`/network-maps/${data.mapId}`, {
                data: {
                    nodes: data.nodes,
                    edges: data.edges,
                    areas: data.areas,
                    baseSignal: data.baseSignal,
                    scale: data.scale,
                    panning: data.panning
                }
            });
            setSaveStatus('saved');
        } catch (err) {
            setSaveStatus('unsaved');
            console.error("Failed to save map", err);
        }
    }, []);

    // Debounced Auto-save Effect
    useEffect(() => {
        // Skip initial render or identical updates if managed cleanly, but here simply debounce
        setSaveStatus('unsaved'); // Mark visually as changing

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            saveData();
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [nodes, edges, areas, baseSignal, scale, panning, mapId, saveData]);

    // Unmount / Refresh Handler
    useEffect(() => {
        const handleUnload = () => {
            saveData();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            saveData(); // Save on component unmount (switching tabs/routes)
        };
    }, [saveData]);

    // Error/Success Message Timer
    useEffect(() => {
        if (errorMsg) {
            const timer = setTimeout(() => setErrorMsg(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMsg]);
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const handleContextMenu = useCallback((e: React.MouseEvent, id?: string) => {
        e.preventDefault();
        e.stopPropagation();

        // If clicking on an item, make sure it's selected. 
        // If it's NOT in the current selection, select ONLY that item.
        // If it IS in the current selection, keep the selection as is (for bulk action).

        let targetId = id;

        // If no ID provided, check for background click -> clear selection? No, context menu on background.

        if (targetId) {
            if (!selectedIds.includes(targetId)) {
                setSelectedIds([targetId]);
            }
            setContextMenu({ x: e.clientX, y: e.clientY, type: 'selection' });
        } else {
            // Background click
            // Clear selection? Excalidraw clears selection on background right click usually
            if (selectedIds.length === 0) {
                setContextMenu({ x: e.clientX, y: e.clientY, type: 'map' });
            } else {
                // Right click on background while having selection -> Show selection menu or map menu? 
                // Usually map menu, and deselect.
                setSelectedIds([]);
                setContextMenu({ x: e.clientX, y: e.clientY, type: 'map' });
            }
        }
    }, [selectedIds]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleCopyToClipboard = async () => {
        if (!contextMenu) return;
        setIsCapturing(true);
        // Wait for re-render
        await new Promise(r => setTimeout(r, 50));

        try {
            // Determine elements to capture
            let captureBox = { x: 0, y: 0, w: 0, h: 0 };
            const PADDING = 40;

            if (contextMenu.type === 'map') {
                const element = document.getElementById('network-map-canvas');
                if (!element) return;
                const blob = await toBlob(element, { backgroundColor: '#0a0c10' });
                if (blob) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    setSuccessMsg("Canvas View copied!");
                }
                setContextMenu(null);
                setIsCapturing(false);
                return;
            }

            // Selection Capture
            const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
            const selectedAreas = areas.filter(a => selectedIds.includes(a.id));

            if (selectedNodes.length === 0 && selectedAreas.length === 0) {
                setIsCapturing(false);
                return;
            }

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            selectedNodes.forEach(n => {
                minX = Math.min(minX, n.position.x);
                minY = Math.min(minY, n.position.y);
                maxX = Math.max(maxX, n.position.x + 300);
                maxY = Math.max(maxY, n.position.y + 400); // More generous height for full node
            });
            selectedAreas.forEach(a => {
                minX = Math.min(minX, a.x);
                minY = Math.min(minY, a.y);
                maxX = Math.max(maxX, a.x + a.width);
                maxY = Math.max(maxY, a.y + a.height);
            });

            // Add padding
            minX -= PADDING; minY -= PADDING;
            maxX += PADDING; maxY += PADDING;
            const width = maxX - minX;
            const height = maxY - minY;

            const transformContainer = containerRef.current?.firstElementChild as HTMLElement;
            if (!transformContainer) throw new Error("Container not found");

            const blob = await toBlob(transformContainer, {
                width: width,
                height: height,
                style: {
                    transform: `translate(${-minX}px, ${-minY}px) scale(1)`,
                    transformOrigin: 'top left',
                    width: `${Math.max(12000, width)}px`,
                    height: `${Math.max(12000, height)}px`
                }
            });

            if (blob) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                setSuccessMsg(`Copied ${selectedIds.length} items to clipboard!`);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Gagal menyalin gambar.");
        }
        setIsCapturing(false);
        setContextMenu(null);
    };

    const saveHistoryState = useCallback((n: Node[], e: Edge[], a: AreaNode[]) => {
        try {
            setHistory(prev => [...prev.slice(-19), JSON.parse(JSON.stringify({ nodes: n, edges: e, areas: a }))]);
            setRedoStack([]);
        } catch (err) { setErrorMsg("Gagal menyimpan riwayat aksi"); }
    }, []);

    const handleDelete = useCallback(() => {
        if (selectedIds.length === 0) return;
        try {
            // Check for root deletion attempt
            if (selectedIds.includes('root')) {
                setErrorMsg("Node Utama (OLT) tidak bisa dihapus");
            }

            const idsToDelete = new Set(selectedIds.filter(id => id !== 'root'));
            if (idsToDelete.size === 0) return;

            saveHistoryState(nodes, edges, areas);

            // Perform Deletion
            setNodes(prev => prev.filter(n => !idsToDelete.has(n.id)));
            setEdges(prev => prev.filter(e =>
                !idsToDelete.has(e.id) &&
                !idsToDelete.has(e.source) &&
                !idsToDelete.has(e.target)
            ));
            setAreas(prev => prev.filter(a => !idsToDelete.has(a.id)));

            setSelectedIds([]);
        } catch (err) {
            console.error("Delete Error:", err);
            setErrorMsg("Gagal menghapus elemen");
        }
    }, [selectedIds, nodes, edges, areas, saveHistoryState]);

    const handleUpdateAreaLabel = (id: string, newLabel: string) => {
        setAreas(prev => prev.map(a => a.id === id ? { ...a, label: newLabel } : a));
    };

    const handleUpdateAreaFontSize = (id: string, delta: number) => {
        setAreas(prev => prev.map(a => {
            if (a.id === id) {
                const current = a.fontSize || 60;
                return { ...a, fontSize: Math.max(12, Math.min(200, current + delta)) };
            }
            return a;
        }));
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        try {
            const last = history[history.length - 1];
            setRedoStack(prev => [...prev, { nodes: [...nodes], edges: [...edges], areas: [...areas] }]);
            setNodes(last.nodes); setEdges(last.edges); setAreas(last.areas);
            setHistory(prev => prev.slice(0, -1)); setSelectedIds([]);
        } catch (err) { setErrorMsg("Gagal melakukan Undo"); }
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        try {
            const next = redoStack[redoStack.length - 1];
            setHistory(prev => [...prev, { nodes: [...nodes], edges: [...edges], areas: [...areas] }]);
            setNodes(next.nodes); setEdges(next.edges); setAreas(next.areas);
            setRedoStack(prev => prev.slice(0, -1)); setSelectedIds([]);
        } catch (err) { setErrorMsg("Gagal melakukan Redo"); }
    };

    const handleCopy = useCallback(() => {
        if (selectedIds.length === 0) return;

        let targetNodeIds = new Set(nodes.filter(n => selectedIds.includes(n.id) && n.id !== 'root').map(n => n.id));
        const targetAreaIds = new Set(areas.filter(a => selectedIds.includes(a.id)).map(a => a.id));

        // Auto-include nodes that are INSIDE or OVERLAPPING selected areas
        areas.filter(a => targetAreaIds.has(a.id)).forEach(area => {
            nodes.forEach(node => {
                if (node.id === 'root') return;
                // Bounding box check with 40px tolerance for better detection
                const nodeW = 300;
                const nodeH = 190;
                const isInside = (node.position.x + nodeW > area.x + 40) &&
                    (node.position.x < area.x + area.width - 40) &&
                    (node.position.y + nodeH > area.y + 40) &&
                    (node.position.y < area.y + area.height - 40);

                if (isInside) targetNodeIds.add(node.id);
            });
        });

        const copiedNodes = nodes.filter(n => targetNodeIds.has(n.id));
        const copiedAreas = areas.filter(a => targetAreaIds.has(a.id));

        // Include edges between any nodes that are being copied
        const copiedEdges = edges.filter(e => targetNodeIds.has(e.source) && targetNodeIds.has(e.target));

        if (copiedNodes.length === 0 && copiedAreas.length === 0) return;

        setClipboard({ nodes: copiedNodes, edges: copiedEdges, areas: copiedAreas });
        setSuccessMsg(`Berhasil menyalin ${copiedNodes.length} node dan ${copiedAreas.length} area`);
    }, [selectedIds, nodes, areas, edges]);

    const handlePaste = useCallback(() => {
        if (!clipboard) return;
        try {
            saveHistoryState(nodes, edges, areas);

            const idMap = new Map<string, string>();
            const offset = 100;

            const newNodes = clipboard.nodes.map(n => {
                const newId = Math.random().toString(36).substr(2, 9);
                idMap.set(n.id, newId);
                return {
                    ...n,
                    id: newId,
                    position: { x: n.position.x + offset, y: n.position.y + offset }
                };
            });

            const newAreas = clipboard.areas.map(a => {
                const newId = Math.random().toString(36).substr(2, 9);
                idMap.set(a.id, newId);
                return {
                    ...a,
                    id: newId,
                    x: a.x + offset,
                    y: a.y + offset
                };
            });

            const newEdges = clipboard.edges.map(e => ({
                ...e,
                id: Math.random().toString(36).substr(2, 9),
                source: idMap.get(e.source) || e.source,
                target: idMap.get(e.target) || e.target,
            }));

            setNodes(prev => [...prev, ...newNodes]);
            setAreas(prev => [...prev, ...newAreas]);
            setEdges(prev => [...prev, ...newEdges]);
            setSelectedIds([...newNodes.map(n => n.id), ...newAreas.map(a => a.id)]);
            setSuccessMsg("Berhasil menempel item");
        } catch (err) {
            setErrorMsg("Gagal menempel item");
        }
    }, [clipboard, nodes, edges, areas, saveHistoryState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                handleDelete();
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c' || e.key === 'C') {
                    e.preventDefault();
                    handleCopy();
                }
                if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault();
                    handlePaste();
                }
                if (e.key === 'z' || e.key === 'Z') {
                    e.preventDefault();
                    if (e.shiftKey) handleRedo();
                    else handleUndo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, handleDelete, handleCopy, handlePaste, handleUndo, handleRedo]);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                setScale(prev => Math.min(Math.max(0.1, prev + delta), 3));
            } else if (e.shiftKey) { setPanning(prev => ({ x: prev.x - e.deltaY, y: prev.y })); }
            else { setPanning(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY })); }
        };
        const container = containerRef.current;
        if (container) container.addEventListener('wheel', handleWheel, { passive: false });
        // eslint-disable-next-line
        return () => container?.removeEventListener('wheel', handleWheel);
    }, []);

    const calcResult = useMemo(() => {
        const parsedBase = parseFloat(baseSignal);
        return calculateGraph(nodes, edges, isNaN(parsedBase) ? 0 : parsedBase);
    }, [nodes, edges, baseSignal]);
    const nodeSignals = calcResult?.nodeSignals || new Map<string, number>();

    const isPortTaken = (nodeId: string, port: 'thru' | 'tap' | 'default') => {
        return edges.some(e => e.source === nodeId && e.sourcePort === port);
    };

    const getUsedPortsCount = (nodeId: string) => {
        return edges.filter(e => e.source === nodeId).length;
    };

    const handleAddNode = (type: NodeType, params: any, distance: number) => {
        if (!tempSourceId) return;
        try {
            saveHistoryState(nodes, edges, areas);
            const sourceNode = nodes.find(n => n.id === tempSourceId);
            if (!sourceNode) throw new Error("Source node not found");
            const newNodeId = Math.random().toString(36).substr(2, 9);
            const newNode: Node = {
                id: newNodeId, type, position: { x: sourceNode.position.x + 400, y: sourceNode.position.y + (Math.random() * 100 - 50) },
                data: type === 'fbt' ? { label: params.label, baseLoss: 0, thruLoss: params.thru, tapLoss: params.tap, fbtRatio: params.label }
                    : { label: params.label, baseLoss: params.value, capacity: params.cap }
            };
            const realDistance = isNaN(distance) ? 0 : Math.max(0, distance);
            const newEdge: Edge = { id: Math.random().toString(), source: tempSourceId, target: newNodeId, sourcePort: tempPort, distance: realDistance, loss: (realDistance / 1000) * 0.35 };
            setNodes(prev => [...prev, newNode]); setEdges(prev => [...prev, newEdge]);
            setTempSourceId(null); setTempPort('default');
        } catch (err) { setErrorMsg("Gagal menambah perangkat baru"); }
    };

    const handleUpdateNode = (type: NodeType, params: any) => {
        if (!editNodeId) return;
        try {
            saveHistoryState(nodes, edges, areas);
            setNodes(prev => prev.map(n => {
                if (n.id === editNodeId) {
                    const newData: NodeData = type === 'fbt'
                        ? { ...n.data, label: params.label, baseLoss: 0, thruLoss: params.thru, tapLoss: params.tap, fbtRatio: params.label }
                        : { ...n.data, label: params.label, baseLoss: params.value, capacity: params.cap };
                    return { ...n, type, data: newData };
                }
                return n;
            }));

            // Handle edges if type changed - resetting port if incompatible
            const nodeBefore = nodes.find(n => n.id === editNodeId);
            if (nodeBefore && nodeBefore.type !== type) {
                setEdges(prevEdges => {
                    let count = 0;
                    return prevEdges.map(e => {
                        if (e.source === editNodeId) {
                            let newPort: 'thru' | 'tap' | 'default' = 'default';
                            if (type === 'fbt') {
                                // First edge gets 'thru', others get 'tap'
                                newPort = count === 0 ? 'thru' : 'tap';
                                count++;
                            } else {
                                newPort = 'default';
                            }
                            return { ...e, sourcePort: newPort };
                        }
                        return e;
                    });
                });
            }

            setSuccessMsg("Perangkat Berhasil Diperbarui");
            setEditNodeId(null);
        } catch (err) {
            setErrorMsg("Gagal memperbarui perangkat");
        }
    };

    const handleSwapPorts = (nodeId: string) => {
        try {
            saveHistoryState(nodes, edges, areas);
            setEdges(prev => prev.map(e => {
                if (e.source === nodeId) {
                    if (e.sourcePort === 'thru') return { ...e, sourcePort: 'tap' };
                    if (e.sourcePort === 'tap') return { ...e, sourcePort: 'thru' };
                }
                return e;
            }));
            setSuccessMsg("Port berhasil ditukar");
        } catch (err) {
            setErrorMsg("Gagal menukar port");
        }
    };

    const handleSetEdgePort = (edgeId: string, newPort: 'thru' | 'tap' | 'default') => {
        try {
            saveHistoryState(nodes, edges, areas);
            setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, sourcePort: newPort } : e));
            setSuccessMsg(`Kabel dipindah ke port ${newPort}`);
        } catch (err) {
            setErrorMsg("Gagal memindah port");
        }
    };

    const selection = useMemo(() => {
        if (selectedIds.length === 0) return null;
        if (selectedIds.length > 1) return { type: `${selectedIds.length} items`, id: 'multiple' };

        const id = selectedIds[0];
        const area = areas.find(a => a.id === id);
        if (area) return { type: 'area', id };

        const node = nodes.find(n => n.id === id);
        if (node) return { type: node.type || 'node', id };

        const edge = edges.find(e => e.id === id);
        if (edge) return { type: 'cable', id };

        return null;
    }, [selectedIds, areas, nodes, edges]);

    const handleSelectAll = useCallback(() => {
        const allIds = [
            ...nodes.filter(n => n.id !== 'root').map(n => n.id),
            ...areas.map(a => a.id)
        ];
        setSelectedIds(allIds);
    }, [nodes, areas]);

    return (
        <div className="h-full w-full bg-white relative overflow-hidden flex flex-col font-sans select-none text-slate-900">
            <AnimatePresence>
                {errorMsg && (
                    <motion.div initial={{ y: -100, x: '-50%', opacity: 0 }} animate={{ y: 20, x: '-50%', opacity: 1 }} exit={{ y: -100, x: '-50%', opacity: 0 }} className="fixed top-0 left-1/2 z-[200] px-6 py-3 bg-rose-600 rounded-2xl shadow-2xl shadow-rose-600/20 border border-rose-400/30 flex items-center gap-3"><AlertCircle size={20} className="text-white animate-pulse" /><span className="text-[10px] font-black uppercase tracking-widest">{errorMsg}</span></motion.div>
                )}
                {successMsg && (
                    <motion.div initial={{ y: -100, x: '-50%', opacity: 0 }} animate={{ y: 20, x: '-50%', opacity: 1 }} exit={{ y: -100, x: '-50%', opacity: 0 }} className="fixed top-0 left-1/2 z-[200] px-6 py-3 bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/20 border border-emerald-400/30 flex items-center gap-3"><Check size={20} className="text-white animate-bounce" /><span className="text-[10px] font-black uppercase tracking-widest">{successMsg}</span></motion.div>
                )}
            </AnimatePresence>

            {/* Top Toolbar */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex gap-6 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-2 pointer-events-auto ring-1 ring-black/5 relative group/worksheets">
                    <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Minimize size={18} /></button>
                    <div className="w-14 text-center"><span className="text-[10px] font-black text-slate-400 uppercase block leading-none">Zoom</span><span className="font-mono font-black text-xs text-slate-700">{Math.round(scale * 100)}%</span></div>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Maximize size={18} /></button>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-1 pointer-events-auto ring-1 ring-black/5">
                    <button disabled={history.length === 0} onClick={handleUndo} className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-20 text-slate-600"><Undo2 size={20} /></button>
                    <button disabled={redoStack.length === 0} onClick={handleRedo} className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-20 text-slate-600"><Redo2 size={20} /></button>
                </div>

                {/* Status Indicator */}
                <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-2 pointer-events-auto ring-1 ring-black/5">
                    {saveStatus === 'saved' ? (
                        <>
                            <Check size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tersimpan</span>
                        </>
                    ) : saveStatus === 'saving' ? (
                        <>
                            <Loader2 size={14} className="text-blue-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Menyimpan...</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Belum Tersimpan</span>
                        </>
                    )}
                </div>

                <AnimatePresence>
                    {selection && (
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex gap-4 pointer-events-auto">
                            {selection.type === 'area' && (
                                <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-1 ring-1 ring-black/5">
                                    <div className="px-3 flex items-center gap-2 border-r border-slate-100 mr-1">
                                        <Type size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Font Size</span>
                                    </div>
                                    <button onClick={() => handleUpdateAreaFontSize(selection.id, -5)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Minus size={14} /></button>
                                    <span className="font-mono font-black text-xs w-8 text-center text-slate-700">{areas.find(a => a.id === selection.id)?.fontSize || 60}</span>
                                    <button onClick={() => handleUpdateAreaFontSize(selection.id, 5)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><Plus size={14} /></button>
                                </div>
                            )}
                            <button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-500 text-white px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-rose-500/20 transition-all border border-rose-400/30 ring-4 ring-rose-500/10"><Trash2 size={16} /> Delete {selection.type}</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-1 pointer-events-auto ring-1 ring-black/5">
                    <button
                        onClick={() => setInteractionMode('move')}
                        className={cn("p-2 rounded-xl transition-all", interactionMode === 'move' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-50 text-slate-400")}
                        title="Mode Geser (Pan)"
                    >
                        <Hand size={20} />
                    </button>
                    <button
                        onClick={() => setInteractionMode('select')}
                        className={cn("p-2 rounded-xl transition-all", interactionMode === 'select' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-slate-50 text-slate-400")}
                        title="Mode Pilih (Box Select)"
                    >
                        <MousePointer2 size={20} />
                    </button>
                    <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                    <button
                        onClick={handleSelectAll}
                        className="px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
                        title="Pilih Semua"
                    >
                        All
                    </button>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-4 px-6 pointer-events-auto ring-1 ring-black/5">
                    <div className="flex flex-col items-center"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Power</span><div className="flex items-center gap-2 mt-1"><Zap size={14} className="text-yellow-500 fill-yellow-500" /><input type="number" value={baseSignal} onChange={e => setBaseSignal(e.target.value)} className="bg-transparent border-b border-slate-200 w-12 text-center font-mono font-black text-blue-600 outline-none focus:border-blue-500 transition-colors" /></div></div>
                </div>

                <button onClick={() => { try { saveHistoryState(nodes, edges, areas); setAreas(prev => [...prev, { id: `area-${Math.random()}`, label: 'Area Baru', x: -panning.x / scale + 200, y: -panning.y / scale + 200, width: 500, height: 500, color: 'bg-indigo-600/10', fontSize: 30 }]); } catch (err) { setErrorMsg("Gagal menambah Area"); } }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-indigo-500/20 pointer-events-auto transition-all border border-indigo-400/30"><Box size={18} /> Add Zone</button>
            </div>

            <div
                id="network-map-canvas"
                ref={containerRef}
                onContextMenu={(e) => handleContextMenu(e, undefined)}
                className={cn(
                    "flex-1 w-full h-full relative overflow-hidden transition-all",
                    interactionMode === 'move' ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
                )}
                onMouseDown={e => {
                    const isBackground = e.target === containerRef.current || (e.target as Element).tagName === 'svg' || (e.target as Element).classList.contains('origin-top-left');

                    if (isBackground) {
                        if (e.shiftKey || e.ctrlKey || interactionMode === 'select') {
                            setIsSelecting(true);
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (rect) {
                                const startX = e.clientX - rect.left;
                                const startY = e.clientY - rect.top;
                                setSelectionBox({ x: startX, y: startY, w: 0, h: 0 });

                                const onMove = (mv: MouseEvent) => {
                                    const currX = mv.clientX - rect.left;
                                    const currY = mv.clientY - rect.top;
                                    setSelectionBox({
                                        x: Math.min(startX, currX),
                                        y: Math.min(startY, currY),
                                        w: Math.abs(currX - startX),
                                        h: Math.abs(currY - startY)
                                    });
                                };

                                const onUp = (up: MouseEvent) => {
                                    window.removeEventListener('mousemove', onMove);
                                    window.removeEventListener('mouseup', onUp);

                                    setSelectionBox(currentBox => {
                                        if (currentBox) {
                                            const logicalRect = {
                                                x: (currentBox.x - panning.x) / scale,
                                                y: (currentBox.y - panning.y) / scale,
                                                w: currentBox.w / scale,
                                                h: currentBox.h / scale
                                            };

                                            const newIds: string[] = [];
                                            nodes.forEach(n => {
                                                if (n.position.x < logicalRect.x + logicalRect.w && n.position.x + 300 > logicalRect.x && n.position.y < logicalRect.y + logicalRect.h && n.position.y + 120 > logicalRect.y) newIds.push(n.id);
                                            });
                                            areas.forEach(a => {
                                                if (a.x < logicalRect.x + logicalRect.w && a.x + a.width > logicalRect.x && a.y < logicalRect.y + logicalRect.h && a.y + a.height > logicalRect.y) newIds.push(a.id);
                                            });
                                            setSelectedIds(newIds);
                                        }
                                        return null;
                                    });
                                    setIsSelecting(false);
                                };

                                window.addEventListener('mousemove', onMove);
                                window.addEventListener('mouseup', onUp);
                            }
                        } else {
                            setSelectionBox(null);
                            if (e.button === 0) setSelectedIds([]);

                            const startX = e.clientX - panning.x;
                            const startY = e.clientY - panning.y;
                            const onMove = (mv: MouseEvent) => setPanning({ x: mv.clientX - startX, y: mv.clientY - startY });
                            const onUp = () => {
                                window.removeEventListener('mousemove', onMove);
                                window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                        }
                    }
                }}
            >
                {/* Selection Box Visual */}
                {selectionBox && (
                    <div className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-[100]" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
                )}

                <div className="absolute top-0 left-0 w-[12000px] h-[12000px] origin-top-left" style={{ transform: `translate(${panning.x}px, ${panning.y}px) scale(${scale})` }}>
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>
                    {areas.map(area => {
                        const isAreaSelected = selectedIds.includes(area.id) && !isCapturing;
                        return (
                            <div id={`area-${area.id}`} key={area.id} onContextMenu={(e) => handleContextMenu(e, area.id)} style={{ left: area.x, top: area.y, width: area.width, height: area.height }} onClick={e => { e.stopPropagation(); setSelectedIds([area.id]); }} className={cn("absolute rounded-[60px] border-4 border-dashed transition-all group bg-white/60", isAreaSelected ? "border-indigo-500 bg-indigo-50/50 shadow-2xl ring-4 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300", area.color)}>
                                <div className="absolute inset-x-0 top-0 h-16 cursor-move" onMouseDown={e => {
                                    e.stopPropagation();
                                    let newSelection = selectedIds;
                                    if (!isAreaSelected) {
                                        newSelection = e.shiftKey ? [...selectedIds, area.id] : [area.id];
                                        setSelectedIds(newSelection);
                                    }
                                    const startPos = { x: e.clientX, y: e.clientY };
                                    const nodesToMove = nodes.filter(n => newSelection.includes(n.id));
                                    const areasToMove = areas.filter(a => newSelection.includes(a.id));
                                    const initialNodes = nodesToMove.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
                                    const initialAreas = areasToMove.map(a => ({ id: a.id, x: a.x, y: a.y }));

                                    const onMove = (mv: MouseEvent) => {
                                        const dx = (mv.clientX - startPos.x) / scale;
                                        const dy = (mv.clientY - startPos.y) / scale;
                                        setNodes(prev => prev.map(n => {
                                            const init = initialNodes.find(i => i.id === n.id);
                                            return init ? { ...n, position: { x: init.x + dx, y: init.y + dy } } : n;
                                        }));
                                        setAreas(prev => prev.map(a => {
                                            const init = initialAreas.find(i => i.id === a.id);
                                            return init ? { ...a, x: init.x + dx, y: init.y + dy } : a;
                                        }));
                                    };
                                    const onUp = () => {
                                        saveHistoryState(nodes, edges, areas);
                                        window.removeEventListener('mousemove', onMove);
                                        window.removeEventListener('mouseup', onUp);
                                    };
                                    window.addEventListener('mousemove', onMove);
                                    window.addEventListener('mouseup', onUp);
                                }}></div>

                                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 w-full px-12 pointer-events-auto">
                                    <div className="relative group/title flex flex-col items-center">
                                        <input
                                            value={area.label}
                                            onChange={(e) => handleUpdateAreaLabel(area.id, e.target.value)}
                                            onBlur={() => saveHistoryState(nodes, edges, areas)}
                                            onClick={e => e.stopPropagation()}
                                            style={{ fontSize: `${area.fontSize || 30}px` }}
                                            className="bg-transparent border-none outline-none font-black text-slate-800 uppercase italic tracking-tighter w-full focus:text-black transition-all cursor-text placeholder-slate-300 text-center px-4 drop-shadow-sm"
                                            placeholder="NAMA AREA..."
                                        />
                                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/title:opacity-100 transition-opacity">
                                            <Edit3 size={20} className="text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-8 right-8 w-12 h-12 cursor-nwse-resize flex items-end justify-end text-slate-300 hover:text-indigo-400 transition-colors" onMouseDown={e => {
                                    e.stopPropagation();
                                    const startPos = { x: e.clientX, y: e.clientY };
                                    const areasToResize = isAreaSelected ? areas.filter(a => selectedIds.includes(a.id)) : [area];
                                    const initialDims = areasToResize.map(a => ({ id: a.id, w: a.width, h: a.height }));

                                    const onMove = (mv: MouseEvent) => {
                                        const dx = (mv.clientX - startPos.x) / scale;
                                        const dy = (mv.clientY - startPos.y) / scale;
                                        setAreas(prev => prev.map(a => {
                                            const init = initialDims.find(i => i.id === a.id);
                                            return init ? { ...a, width: Math.max(300, init.w + dx), height: Math.max(300, init.h + dy) } : a;
                                        }));
                                    };
                                    const onUp = () => {
                                        saveHistoryState(nodes, edges, areas);
                                        window.removeEventListener('mousemove', onMove);
                                        window.removeEventListener('mouseup', onUp);
                                    };
                                    window.addEventListener('mousemove', onMove);
                                    window.addEventListener('mouseup', onUp);
                                }}><Maximize size={32} className="rotate-90" /></div>
                            </div>
                        );
                    })}

                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                        <defs><filter id="glow-edge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>
                        {edges.map((edge) => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);

                            if (!source || !target) return null;

                            // Bundle Logic: Group all edges from the same source node to ensure unique spacing
                            const bundleEdges = edges.filter(e => e.source === edge.source)
                                .sort((a, b) => {
                                    // 1. Sort by port type (thru atop, then default, then tap)
                                    const portOrder: Record<string, number> = { 'thru': 0, 'default': 1, 'tap': 2 };
                                    const aOrder = portOrder[a.sourcePort || 'default'] ?? 1;
                                    const bOrder = portOrder[b.sourcePort || 'default'] ?? 1;
                                    if (aOrder !== bOrder) return aOrder - bOrder;

                                    // 2. Sort by target vertical position to avoid crossing
                                    const nodeA = nodes.find(n => n.id === a.target);
                                    const nodeB = nodes.find(n => n.id === b.target);
                                    return (nodeA?.position.y || 0) - (nodeB?.position.y || 0);
                                });

                            const bundleIndex = bundleEdges.findIndex(e => e.id === edge.id);
                            const bundleSize = bundleEdges.length;

                            const pathData = getSmartPath(source, target, edge.sourcePort, bundleIndex, bundleSize);
                            const color = edge.sourcePort === 'thru' ? "#3b82f6" : edge.sourcePort === 'tap' ? "#ec4899" : "#94a3b8";

                            // Label position helper
                            // Calculation must strictly match getSmartPath to align correctly

                            const dxL = target.position.x - source.position.x;
                            const dyL = target.position.y - source.position.y;
                            const sSideL = dxL > 351 ? 'right' : dxL < -351 ? 'left' : dyL > 251 ? 'bottom' : dyL < -251 ? 'top' : 'right';

                            const startBaseLabel = getAnchorPoint(source, sSideL, edge.sourcePort);
                            const endBaseLabel = getAnchorPoint(target, sSideL === 'left' || sSideL === 'right' ? (dxL > 0 ? 'left' : 'right') : (dyL > 0 ? 'top' : 'bottom'));
                            const SPACING_LABEL = 45;
                            const trackOffsetLabel = (bundleIndex + 1) * SPACING_LABEL;

                            const startLabel = {
                                x: startBaseLabel.x + (sSideL === 'top' || sSideL === 'bottom' ? (bundleIndex - (bundleSize - 1) / 2) * 15 : 0),
                                y: startBaseLabel.y + (sSideL === 'left' || sSideL === 'right' ? (bundleIndex - (bundleSize - 1) / 2) * 25 : 0)
                            };

                            const laneXLabel = sSideL === 'right' ? startLabel.x + trackOffsetLabel : sSideL === 'left' ? startLabel.x - trackOffsetLabel : endBaseLabel.x;
                            const laneYLabel = sSideL === 'bottom' ? startLabel.y + trackOffsetLabel : sSideL === 'top' ? startLabel.y - trackOffsetLabel : endBaseLabel.y;

                            const labelX = (sSideL === 'left' || sSideL === 'right') ? laneXLabel : (startLabel.x + endBaseLabel.x) / 2;
                            const labelY = (sSideL === 'left' || sSideL === 'right') ? (startLabel.y + endBaseLabel.y) / 2 : laneYLabel;

                            return (
                                <g key={edge.id} className="group/cable cursor-pointer pointer-events-auto" onContextMenu={(e) => handleContextMenu(e, edge.id)} onClick={e => { e.stopPropagation(); setSelectedIds([edge.id]); }}>
                                    {/* Hover Target Area */}
                                    <path d={pathData} stroke="transparent" strokeWidth={15} fill="none" />

                                    {/* Shadow/Outline for visibility against white bg */}
                                    <path d={pathData} stroke="#fff" strokeWidth={7} fill="none" opacity={0.8} strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Main Cable Line */}
                                    <path d={pathData} stroke={color} strokeWidth={4} fill="none" strokeDasharray={edge.sourcePort === 'thru' ? "0" : "8,4"} strokeLinecap="round" strokeLinejoin="round" className="transition-all" />

                                    {/* Animated Flow Packet */}
                                    <circle r={4.5} fill="#fff" stroke={color} strokeWidth={1} className="drop-shadow-sm"><animateMotion dur="3s" repeatCount="indefinite" path={pathData} keyPoints="0;1" keyTimes="0;1" calcMode="linear" /></circle>

                                    {/* Distance Label Badge */}
                                    <g className="opacity-0 group-hover/cable:opacity-100 transition-opacity pointer-events-none">
                                        <rect x={labelX - 16} y={labelY - 8} width={32} height={16} rx={4} fill="white" stroke={color} strokeWidth={1} className="shadow-sm" />
                                        <text x={labelX} y={labelY} dy={3} textAnchor="middle" className="text-[9px] font-bold fill-slate-900">{edge.distance}m</text>
                                    </g>
                                </g>
                            )
                        })}
                    </svg>

                    {nodes.map(node => {
                        const inputSignal = nodeSignals.get(node.id + "_input") ?? 0; const outputSignal = nodeSignals.get(node.id + "_output") ?? inputSignal;
                        const isNodeSelected = selectedIds.includes(node.id) && !isCapturing;
                        let signalColor = "text-emerald-500"; if (outputSignal < -24) signalColor = "text-rose-500"; else if (outputSignal < -15) signalColor = "text-amber-500";
                        const thruTaken = isPortTaken(node.id, 'thru');
                        const tapTaken = isPortTaken(node.id, 'tap');
                        const usedCount = getUsedPortsCount(node.id);
                        const capacity = node.data.capacity || (node.type === 'source' ? 4 : 1);
                        const isFull = (node.type === 'plc' || node.type === 'source') && usedCount >= capacity;
                        return (
                            <motion.div id={`node-${node.id}`} key={node.id} onContextMenu={(e) => handleContextMenu(e, node.id)} animate={{ x: node.position.x, y: node.position.y }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute z-20">


                                <div onClick={e => { e.stopPropagation(); setSelectedIds((prev) => e.shiftKey ? [...prev, node.id] : [node.id]); }} className={cn("w-[300px] bg-white border-2 rounded-[2rem] shadow-2xl transition-all group overflow-hidden", isNodeSelected ? "border-blue-500 ring-[12px] ring-blue-500/10 shadow-blue-500/20" : "border-slate-200 hover:border-slate-300")} onMouseDown={e => {
                                    e.stopPropagation();
                                    let newSelection = selectedIds;
                                    if (!isNodeSelected && !isCapturing) {
                                        newSelection = e.shiftKey ? [...selectedIds, node.id] : [node.id];
                                        setSelectedIds(newSelection);
                                    }
                                    const startPos = { x: e.clientX, y: e.clientY };
                                    const nodesToMove = nodes.filter(n => newSelection.includes(n.id));
                                    const areasToMove = areas.filter(a => newSelection.includes(a.id));
                                    const initialNodes = nodesToMove.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
                                    const initialAreas = areasToMove.map(a => ({ id: a.id, x: a.x, y: a.y }));

                                    const onMove = (mv: MouseEvent) => {
                                        const dx = (mv.clientX - startPos.x) / scale;
                                        const dy = (mv.clientY - startPos.y) / scale;
                                        setNodes(prev => prev.map(n => {
                                            const init = initialNodes.find(i => i.id === n.id);
                                            return init ? { ...n, position: { x: init.x + dx, y: init.y + dy } } : n;
                                        }));
                                        setAreas(prev => prev.map(a => {
                                            const init = initialAreas.find(i => i.id === a.id);
                                            return init ? { ...a, x: init.x + dx, y: init.y + dy } : a;
                                        }));
                                    };
                                    const onUp = () => {
                                        saveHistoryState(nodes, edges, areas);
                                        window.removeEventListener('mousemove', onMove);
                                        window.removeEventListener('mouseup', onUp);
                                    };
                                    window.addEventListener('mousemove', onMove);
                                    window.addEventListener('mouseup', onUp);
                                }}>
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Status</span>
                                                    <div className={cn("text-xs font-mono font-black tabular-nums tracking-wide flex items-center gap-2", node.type === 'fbt' ? "text-pink-600" : "text-blue-700")}>
                                                        {node.type === 'fbt' ? <GitCommit size={12} /> : node.type === 'source' ? <Zap size={12} className="fill-blue-700" /> : <Box size={12} />}
                                                        {(node.type === 'plc' || node.type === 'source') ? `${usedCount}/${capacity} Ports` : 'Coupler Ratio'}
                                                    </div>
                                                </div>
                                                {node.id !== 'root' && !isCapturing && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setEditNodeId(node.id); setIsEditModalOpen(true); }}
                                                        className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-all mt-1"
                                                        title="Ubah Perangkat"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className={cn("text-5xl font-mono font-black tabular-nums tracking-tighter", signalColor)}>
                                                {outputSignal.toFixed(1)}
                                                <span className="text-[14px] text-slate-900 font-bold ml-1">dBm</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-6 py-5 bg-slate-50/50 space-y-4">
                                        {node.type === 'fbt' ? (
                                            <div className="space-y-4 text-center">
                                                <div className="text-4xl font-mono font-black text-slate-900 tracking-tighter uppercase italic">
                                                    {node.data.fbtRatio}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button disabled={thruTaken} onClick={e => { e.stopPropagation(); setTempSourceId(node.id); setTempPort('thru'); setIsModalOpen(true); }} className={cn("relative py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1", thruTaken ? "bg-slate-100 border-slate-200 text-slate-900 opacity-60 cursor-not-allowed" : "bg-blue-50 hover:bg-blue-600 border-blue-100 text-blue-600 hover:text-white")}>
                                                        <span className="text-slate-900 opacity-60 text-[8px]">Thru</span>
                                                        {thruTaken ? <Check size={16} /> : <span className="text-sm font-mono font-black">-{node.data.thruLoss}dB</span>}
                                                    </button>
                                                    <button disabled={tapTaken} onClick={e => { e.stopPropagation(); setTempSourceId(node.id); setTempPort('tap'); setIsModalOpen(true); }} className={cn("relative py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-1", tapTaken ? "bg-slate-100 border-slate-200 text-slate-900 opacity-60 cursor-not-allowed" : "bg-pink-50 hover:bg-pink-600 border-pink-100 text-pink-600 hover:text-white")}>
                                                        <span className="text-slate-900 opacity-60 text-[8px]">Tap</span>
                                                        {tapTaken ? <Check size={16} /> : <span className="text-sm font-mono font-black">-{node.data.tapLoss}dB</span>}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2 leading-none">
                                                        {node.type === 'source' ? 'Source' : 'Splitter'}
                                                    </span>
                                                    <div className="text-5xl font-mono font-black text-slate-900 tracking-tighter uppercase italic text-center leading-none">
                                                        {node.type === 'plc' ? node.data.label.split(' ').pop() : node.data.label}
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={isFull || isCapturing}
                                                    onClick={(e) => { e.stopPropagation(); setTempSourceId(node.id); setTempPort('default'); setIsModalOpen(true); }}
                                                    className={cn(
                                                        "w-full py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group/btn",
                                                        isFull
                                                            ? "bg-slate-100 border-slate-200 text-slate-900 opacity-60 cursor-not-allowed"
                                                            : "bg-blue-50 hover:bg-blue-600 border-blue-100 text-blue-600 hover:text-white"
                                                    )}
                                                >
                                                    {isFull ? <Check size={16} /> : <Plus size={16} className="text-blue-600 group-hover/btn:text-white transition-colors" />}
                                                    {isFull ? 'Port Penuh' : 'Tambah Perangkat'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className={cn("h-2 w-full", outputSignal < -24 ? "bg-rose-500" : outputSignal < -15 ? "bg-amber-500" : "bg-emerald-500")} />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
            <AddDeviceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddNode} sourceParams={nodes.find(n => n.id === tempSourceId)?.data} sourcePort={tempPort} />
            <EditDeviceModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdate={handleUpdateNode} node={nodes.find(n => n.id === editNodeId) || null} />

            {/* Context Menu */}
            {contextMenu && (
                <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-[300] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1">
                    <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 mb-1">
                        {contextMenu.type === 'selection' ? 'Selection Actions' : 'Canvas Actions'}
                    </div>

                    <button onClick={handleCopyToClipboard} className="w-full text-left px-3 py-2 hover:bg-white/5 text-slate-200 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                        <ImageIcon size={14} className="text-blue-400" />
                        <span className="text-xs font-bold">Copy to PNG</span>
                    </button>

                    {contextMenu.type === 'selection' && selectedIds.length === 1 && nodes.some(n => n.id === selectedIds[0] && n.id !== 'root') && (
                        <button onClick={() => { setEditNodeId(selectedIds[0]); setIsEditModalOpen(true); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-white/5 text-slate-200 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                            <Edit3 size={14} className="text-blue-400" />
                            <span className="text-xs font-bold">Ubah Perangkat</span>
                        </button>
                    )}

                    {selectedIds.length > 0 && (
                        <button onClick={() => { handleCopy(); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-white/5 text-slate-200 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                            <Undo2 size={14} className="text-blue-400 rotate-90" />
                            <span className="text-xs font-bold">Salin (Copy)</span>
                        </button>
                    )}

                    {clipboard && (
                        <button onClick={() => { handlePaste(); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-white/5 text-slate-200 hover:text-white rounded-lg flex items-center gap-3 transition-colors">
                            <Redo2 size={14} className="text-emerald-400 -rotate-90" />
                            <span className="text-xs font-bold">Tempel (Paste)</span>
                        </button>
                    )}

                    {contextMenu.type === 'selection' && selectedIds.length === 1 && nodes.find(n => n.id === selectedIds[0] && n.type === 'fbt') && (
                        <button onClick={() => { handleSwapPorts(selectedIds[0]); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-blue-600/10 text-blue-400 hover:text-blue-300 rounded-lg flex items-center gap-3 transition-colors">
                            <RefreshCw size={14} />
                            <span className="text-xs font-bold">Tukar Port (Thru ↔ Tap)</span>
                        </button>
                    )}

                    {contextMenu.type === 'selection' && selectedIds.length > 0 && (
                        <button onClick={() => { handleDelete(); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 rounded-lg flex items-center gap-3 transition-colors">
                            <Trash2 size={14} />
                            <span className="text-xs font-bold">Delete</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Network Map Dashboard (List) ---

const NetworkMapDashboard = ({ onSelectMap }: { onSelectMap: (id: string, data: any) => void }) => {
    const [maps, setMaps] = useState<MapMetadata[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMaps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/network-maps');
            setMaps(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaps();
    }, [fetchMaps]);



    const handleDeleteMap = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Hapus Oke ini?")) return;
        try {
            await api.delete(`/network-maps/${id}`);
            fetchMaps();
        } catch (err) {
            alert("Gagal menghapus");
        }
    }

    return (
        <div className="h-full w-full bg-[#0a0c10] text-white p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-8">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {maps.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                Belum ada Sheet. Silakan buat baru.
                            </div>
                        )}
                        {maps.map(map => (
                            <div key={map.id} onClick={() => onSelectMap(map.id, map.data)} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleDeleteMap(map.id, e)} className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-colors"><Trash2 size={16} /></button>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                    <LayoutDashboard size={24} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight mb-1 group-hover:text-blue-400 transition-colors">{map.name}</h3>
                                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(map.updatedAt).toLocaleDateString()}</span>
                                    {/* <span className="flex items-center gap-1"><FileText size={12} /> {Object.keys(map.data?.nodes || {}).length} Nodes</span> */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};



// --- Worksheet Manager Modal ---

// --- Sheet Create Modal (Inline for now) ---

const SheetCreateModal = ({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (name: string) => void }) => {
    const [name, setName] = useState("");

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={onClose} />
            <div className="relative w-full max-w-[320px] bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 ring-1 ring-black/5">
                <div className="p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                            Buat Sheet Baru
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Masukkan nama untuk lembar kerja baru Anda.
                        </p>
                    </div>

                    <div className="mb-6">
                        <CustomInput
                            autoFocus
                            placeholder="Contoh: Area Utara..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && name.trim()) {
                                    onCreate(name);
                                    setName("");
                                }
                            }}
                            className="text-center font-semibold"
                        />
                    </div>

                    <div className="flex justify-center gap-2">
                        <CustomButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-9 text-[11px] font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg"
                            onClick={onClose}
                        >
                            Batal
                        </CustomButton>
                        <CustomButton
                            type="button"
                            variant="primary"
                            size="sm"
                            className="flex-1 h-9 text-[11px] font-bold shadow-sm rounded-lg"
                            onClick={() => {
                                if (name.trim()) {
                                    onCreate(name);
                                    setName("");
                                }
                            }}
                            disabled={!name.trim()}
                        >
                            Simpan Sheet
                        </CustomButton>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Worksheet Manager Modal ---

const WorksheetListModal = ({ isOpen, onClose, onSelect, currentId }: { isOpen: boolean, onClose: () => void, onSelect: (id: string, data: any) => void, currentId?: string }) => {
    const [maps, setMaps] = useState<MapMetadata[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchMaps = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/network-maps');
            setMaps(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) fetchMaps();
    }, [isOpen, fetchMaps]);

    const handleCreate = async (name: string) => {
        setIsCreateOpen(false);
        try {
            const res = await api.post('/network-maps', { name, data: {} });
            onSelect(res.data.id, {});
            onClose();
        } catch (err) {
            setMessage({ type: 'error', text: "Gagal membuat Sheet baru" });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/network-maps/${deleteTarget}`);
            setDeleteTarget(null);
            fetchMaps();
        } catch (err) {
            setMessage({ type: 'error', text: "Gagal menghapus Sheet" });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white border border-slate-200 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl relative z-10"
                >
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-lg">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Data Sheet</h2>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md transition-colors"><Plus className="rotate-45 text-slate-400" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/50">
                        <button onClick={() => setIsCreateOpen(true)} className="w-full py-5 border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-primary gap-2 transition-all group bg-white/50">
                            <div className="p-2.5 rounded-full bg-slate-100 group-hover:bg-primary/10 text-slate-400 group-hover:text-primary transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-bold text-[11px] uppercase tracking-wider">Buat Sheet Baru</span>
                        </button>

                        {loading ? (
                            <div className="h-40 flex flex-col items-center justify-center gap-3">
                                <div className="w-full max-w-[120px] h-[4px] bg-slate-100 rounded-full overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-primary w-1/3 animate-[shimmer_1s_infinite] rounded-full" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-wider">Memuat Data...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {maps.map(map => (
                                    <div key={map.id} onClick={() => { onSelect(map.id, map.data); onClose(); }} className={cn("p-4 rounded-lg border flex items-center gap-4 cursor-pointer transition-all group bg-white", map.id === currentId ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-slate-200 hover:border-primary/50 hover:shadow-sm")}>
                                        <div className={cn("w-10 h-10 rounded-md flex items-center justify-center font-bold text-white shadow-sm", map.id === currentId ? "bg-primary" : "bg-slate-700 group-hover:bg-primary")}>
                                            <LayoutDashboard size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800 text-sm">{map.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Updated: {new Date(map.updatedAt).toLocaleDateString()}</div>
                                        </div>
                                        {map.id === currentId && <div className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold uppercase tracking-wider">Active</div>}
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(map.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <SheetCreateModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreate={handleCreate}
            />

            <ModalConfirm
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Hapus Sheet"
                message="Apakah Anda yakin ingin menghapus worksheet ini? Data tidak dapat dikembalikan."
                variant="danger"
            />

            <ModalMessage
                isOpen={!!message}
                onClose={() => setMessage(null)}
                type={message?.type || 'error'}
                title={message?.type === 'success' ? 'Berhasil' : 'Error'}
                message={message?.text || ''}
            />
        </>
    );
};

// --- Main Page Wrapper ---

// --- Header Portal Component ---

const HeaderActions = ({ onOpenWorksheets }: { onOpenWorksheets: () => void }) => {
    const container = document.getElementById('page-header-actions');
    if (!container) return null;

    return createPortal(
        <CustomButton onClick={onOpenWorksheets} size="sm" className="h-9 px-4 font-bold text-xs uppercase tracking-wider gap-2 shadow-sm">
            <LayoutDashboard size={14} /> Data Sheets
        </CustomButton>,
        container
    );
};

const NetworkMapPage = () => {
    const [selectedMap, setSelectedMap] = useState<{ id: string, data: any } | null>(null);
    const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
    const [isRestoring, setIsRestoring] = useState(true);

    // Initial Restore Effect
    useEffect(() => {
        const restoreSession = async () => {
            const lastId = localStorage.getItem('currentNetworkMapId');
            if (lastId) {
                try {
                    const res = await api.get(`/network-maps/${lastId}`);
                    if (res.data && res.data.id) {
                        const mapData = res.data.data;
                        const parsedData = typeof mapData === 'string' ? JSON.parse(mapData) : mapData;
                        setSelectedMap({ id: res.data.id, data: parsedData || {} });
                    }
                } catch (err) {
                    localStorage.removeItem('currentNetworkMapId');
                }
            }
            setIsRestoring(false);
        };
        restoreSession();
    }, []);

    const handleSelectMap = (id: string, data: any) => {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        setSelectedMap({ id, data: parsedData || {} });
        localStorage.setItem('currentNetworkMapId', id);
    };

    if (isRestoring) {
        return (
            <div className="flex flex-col h-[calc(100vh-140px)] w-full bg-[#0a0c10] rounded-3xl overflow-hidden border border-white/5 shadow-2xl items-center justify-center">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Memulihkan Sesi...</span>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            {/* Portal the button to the layout header */}
            <HeaderActions onOpenWorksheets={() => setIsWorksheetModalOpen(true)} />

            <div className="flex flex-col h-[calc(100vh-140px)] w-full bg-[#0a0c10] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">

                <div className="flex-1 relative overflow-hidden">
                    {selectedMap ? (
                        <NetworkMapCanvas
                            key={selectedMap.id}
                            mapId={selectedMap.id}
                            initialData={selectedMap.data}
                        />
                    ) : (
                        <NetworkMapDashboard onSelectMap={handleSelectMap} />
                    )}
                </div>

                <WorksheetListModal
                    isOpen={isWorksheetModalOpen}
                    onClose={() => setIsWorksheetModalOpen(false)}
                    onSelect={handleSelectMap}
                    currentId={selectedMap?.id}
                />
            </div>
        </ErrorBoundary>
    );
};

export default NetworkMapPage;
