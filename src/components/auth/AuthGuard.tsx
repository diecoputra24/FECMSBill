import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Shield } from 'lucide-react';

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isLoading, checkSession } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    // Show loading spinner while checking session
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-6">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="flex items-center gap-3 text-blue-300">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Memeriksa sesi...</span>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
