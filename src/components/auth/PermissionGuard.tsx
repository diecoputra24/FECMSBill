import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface PermissionGuardProps {
    children: ReactNode;
    permission: string;
}

export function PermissionGuard({ children, permission }: PermissionGuardProps) {
    const { user } = useAuthStore();
    const location = useLocation();

    // If no user (should be handled by AuthGuard, but safety check), wait or redirect
    if (!user) {
        return null;
    }

    // SUPERADMIN bypass
    if (user.role === 'SUPERADMIN') {
        return <>{children}</>;
    }

    const hasPermission = user.permissions?.includes(permission);

    if (!hasPermission) {
        // Redirect to dashboard or a 403 page
        // For now redirect to dashboard with a state to show a toast maybe?
        return <Navigate to="/" replace state={{ from: location, error: "Access Denied" }} />;
    }

    return <>{children}</>;
}
