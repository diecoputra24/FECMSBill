import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type LoginInput } from '@/store/authStore';
import {
    Eye,
    EyeOff,
    Loader2,
    Shield,
    Clock,
    Zap,
    CheckCircle,
    User,
    Mail,
    Lock,
    X,
    AlertCircle
} from 'lucide-react';

interface Toast {
    id: number;
    type: "success" | "error" | "info";
    message: string;
}

const features = [
    {
        id: "easy",
        title: "EASY",
        subtitle: "(MUDAH)",
        description: "Dashboard yang intuitif dan praktis",
        icon: User,
        color: "bg-emerald-500",
        position: "top",
    },
    {
        id: "fast",
        title: "FAST",
        subtitle: "(CEPAT)",
        description: "Sinkronisasi MikroTik hitungan detik",
        icon: Zap,
        color: "bg-cyan-500",
        position: "right",
    },
    {
        id: "accurate",
        title: "ACCURATE",
        subtitle: "(AKURAT)",
        description: "Laporan penagihan yang tepat",
        icon: Clock,
        color: "bg-amber-500",
        position: "bottom",
    },
    {
        id: "integrated",
        title: "INTEGRATED",
        subtitle: "(TERPADU)",
        description: "Data pelanggan & ISP terintegrasi",
        icon: Shield,
        color: "bg-purple-500",
        position: "left",
    },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, checkSession, isAuthenticated, isLoading, error, fieldErrors, clearError } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [successMessage, setSuccessMessage] = useState("");

    // Check session on mount
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Clear errors on mount
    useEffect(() => {
        clearError();
    }, [clearError]);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Rotate features every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Animation on mount
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const showToast = (type: "success" | "error" | "info", message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 5000);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage("");

        if (!formData.email.trim()) {
            showToast("error", "Email harus diisi");
            return;
        }
        if (!formData.password) {
            showToast("error", "Password harus diisi");
            return;
        }

        try {
            const input: LoginInput = { email: formData.email, password: formData.password };
            const ok = await login(input);
            if (ok) {
                setSuccessMessage("Login berhasil! Mohon tunggu sebentar...");
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 1500);
            }
        } catch (err) {
            console.error("Login Error:", err);
        }
    };

    const getFieldError = (field: string): string | undefined => {
        return fieldErrors[field]?.[0];
    };

    const ToastContainer = () => (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center justify-between p-3 max-w-sm rounded-lg shadow-lg transition-all duration-300 transform ${toast.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : toast.type === "error"
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : "bg-blue-50 border border-blue-200 text-blue-800"
                        }`}
                >
                    <div className="flex items-center">
                        {toast.type === "success" && (
                            <CheckCircle size={18} className="mr-2 text-green-600" />
                        )}
                        {toast.type === "error" && (
                            <AlertCircle size={18} className="mr-2 text-red-600" />
                        )}
                        {toast.type === "info" && (
                            <Loader2 size={18} className="mr-2 text-blue-600 animate-spin" />
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-3 text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex bg-gray-100 font-sans">
            <ToastContainer />

            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-32 h-32 bg-white opacity-5 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-40 right-20 w-24 h-24 bg-emerald-400 opacity-10 rounded-full animate-bounce"></div>
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-cyan-400 opacity-8 rounded-full animate-ping"></div>
                    <div className="absolute bottom-20 left-1/2 w-20 h-20 bg-amber-400 opacity-6 rounded-full animate-pulse"></div>

                    <div className="absolute inset-0 opacity-5">
                        <div className="grid grid-cols-12 grid-rows-12 h-full gap-4 p-8">
                            {[...Array(144)].map((_, i) => (
                                <div key={i} className="border border-white/20 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div
                    className={`relative z-10 flex flex-col justify-center items-center w-full p-12 text-white transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                        }`}
                >
                    {/* Time Display */}
                    <div className="absolute top-8 left-8 text-sm opacity-70">
                        <div>
                            {currentTime.toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </div>
                        <div className="font-mono text-lg">
                            {currentTime.toLocaleTimeString("id-ID")}
                        </div>
                    </div>

                    {/* Circular Feature Display */}
                    <div className="mb-12 relative">
                        <div className="relative w-96 h-96">
                            <div className="absolute inset-8 rounded-full border-4 border-white bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-2xl flex items-center justify-center backdrop-blur-sm">
                                <div className="text-center">
                                    <div className="mb-4">
                                        <img
                                            src="/cms.png"
                                            alt="CMSBill Logo"
                                            className="w-[60px] h-[60px] mx-auto rounded-lg shadow-xl"
                                        />
                                    </div>
                                    <div className="text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                        CMSBill
                                    </div>
                                    <div className="text-sm opacity-80 tracking-wider">
                                        MANAGEMENT BILLING WIFI
                                    </div>
                                </div>
                            </div>

                            {features.map((feature, index) => {
                                const isActive = activeFeature === index;
                                const Icon = feature.icon;

                                let positionClasses = "";
                                switch (feature.position) {
                                    case "top":
                                        positionClasses = "-top-6 left-1/2 transform -translate-x-1/2";
                                        break;
                                    case "right":
                                        positionClasses = "top-1/2 -right-6 transform -translate-y-1/2";
                                        break;
                                    case "bottom":
                                        positionClasses = "-bottom-6 left-1/3 transform -translate-x-1/2";
                                        break;
                                    case "left":
                                        positionClasses = "top-1/3 -left-6 transform -translate-y-1/2";
                                        break;
                                }

                                return (
                                    <div
                                        key={feature.id}
                                        className={`absolute transition-all duration-500 transform hover:scale-110 cursor-pointer ${positionClasses} ${isActive ? "scale-110" : "scale-100"}`}
                                    >
                                        <div
                                            className={`text-white px-4 py-3 rounded-full text-sm font-bold border-2 border-white/20 backdrop-blur-sm flex items-center space-x-2 min-w-max ${feature.color} ${isActive ? "animate-pulse" : ""}`}
                                        >
                                            <span className="text-xs opacity-90">0{index + 1}</span>
                                            <Icon size={16} />
                                            <div className="text-left">
                                                <div className="text-xs font-bold">{feature.title}</div>
                                                <div className="text-xs opacity-90">
                                                    {feature.subtitle}
                                                </div>
                                            </div>
                                        </div>

                                        {isActive && (
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 text-white text-[10px] px-3 py-1 rounded whitespace-nowrap backdrop-blur-sm z-20">
                                                {feature.description}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div className="text-center mb-8 max-w-2xl">
                        <h1 className="text-4xl font-bold mb-4 leading-tight">
                            LAYANAN MANAGEMENT BILLING
                            <br />
                            <span className="text-cyan-400 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                MODERN & TERINTEGRASI
                            </span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-12 bg-white relative">
                <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-100 opacity-50"></div>
                <div className="w-full max-w-md relative z-10">
                    {/* Logo & Brand */}
                    <div className="text-center mb-10">
                        <div
                            className={`inline-flex items-center space-x-3 mb-1 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                                }`}
                        >
                            <div className="relative">
                                <img
                                    src="/cms.png"
                                    alt="CMSBill Logo"
                                    className="w-10 h-10 rounded-lg shadow-lg"
                                />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
                            </div>
                            <div className="text-left">
                                <span className="text-3xl font-bold text-gray-800">CMSBill</span>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
                                    Management Billing
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Text */}
                    <div
                        className={`text-center mb-8 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                            }`}
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Selamat Datang
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Silakan masuk ke akun Anda untuk mengelola sistem.
                        </p>
                    </div>

                    {/* Global Error */}
                    {error && !successMessage && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-600 font-medium">{error}</div>
                        </div>
                    )}

                    {/* Success Messages */}
                    {successMessage && (
                        <div className="mb-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm shadow-sm transition-all animate-bounce">
                                <div className="flex items-center">
                                    <CheckCircle size={18} className="mr-2" />
                                    <span className="font-bold">{successMessage}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form
                        onSubmit={handleSubmit}
                        className={`space-y-5 transition-all duration-700 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                            }`}
                    >
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter flex items-center space-x-2 ml-1">
                                <Mail size={13} />
                                <span>Email</span>
                            </label>
                            <div className="relative group">
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full h-12 px-4 pl-11 border ${getFieldError('email') ? 'border-red-400 bg-red-50' : 'border-gray-200'} rounded-xl outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 group-hover:border-slate-300 shadow-sm`}
                                    disabled={isLoading || !!successMessage}
                                />
                                <Mail
                                    size={16}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                                />
                            </div>
                            {getFieldError('email') && (
                                <p className="text-red-500 text-[10px] font-bold ml-1">{getFieldError('email')}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter flex items-center space-x-2 ml-1">
                                <Lock size={13} />
                                <span>Password</span>
                            </label>
                            <div className="relative group">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full h-12 px-4 pl-11 pr-12 border ${getFieldError('password') ? 'border-red-400 bg-red-50' : 'border-gray-200'} rounded-xl outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 group-hover:border-slate-300 shadow-sm`}
                                    disabled={isLoading || !!successMessage}
                                />
                                <Lock
                                    size={16}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors duration-200"
                                    disabled={isLoading || !!successMessage}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {getFieldError('password') && (
                                <p className="text-red-500 text-[10px] font-bold ml-1">{getFieldError('password')}</p>
                            )}
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !!successMessage}
                            className={`w-full h-12 font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center space-x-2 mt-8 ${isLoading || !!successMessage
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <span>Masuk Sekarang</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-12 text-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                            © 2026 CMSBill Platform • All Rights Reserved
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
