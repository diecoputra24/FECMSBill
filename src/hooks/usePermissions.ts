// hooks/usePermissions.ts
import { useMemo } from "react";

interface PermissionCheck {
  hasPermission(menuName: string, action: string): boolean;
  canView(menuName: string): boolean;
  canCreate(menuName: string): boolean;
  canEdit(menuName: string): boolean;
  canDelete(menuName: string): boolean;
  canViewAny(menuName: string): boolean;
}

// Mock implementation for CMSBill React version
export function usePermissions() {
  const permissions: any[] = [];
  const loading = false;

  const checker: PermissionCheck = useMemo(
    () => ({
      hasPermission(_menuName: string, _action: string): boolean {
        return true;
      },
      canView(_menuName: string): boolean {
        return true;
      },
      canCreate(_menuName: string): boolean {
        return true;
      },
      canEdit(_menuName: string): boolean {
        return true;
      },
      canDelete(_menuName: string): boolean {
        return true;
      },
      canViewAny(_menuName: string): boolean {
        return true;
      },
    }),
    []
  );

  const hasRole = (_roleName: string): boolean => {
    return true;
  };

  const refreshPermissions = async () => { };

  return {
    permissions,
    loading,
    error: null,
    hasRole,
    ...checker,
    hasAnyPermission(..._permissionList: string[]): boolean {
      return true;
    },
    hasAllPermissions(..._permissionList: string[]): boolean {
      return true;
    },
    can(_menuName: string, _action: string): boolean {
      return true;
    },
    hasAnyRole(..._roleNames: string[]): boolean {
      return true;
    },
    getCurrentRole(): string | undefined {
      return "admin";
    },
    isAdmin(): boolean {
      return true;
    },
    isRole(_roleName: string): boolean {
      return true;
    },
    refreshPermissions,
  };
}

export function usePermission(
  menuName: string,
  action: string
): {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const { hasPermission, loading } = usePermissions();

  return {
    hasPermission: hasPermission(menuName, action),
    loading,
    error: null,
  };
}

export function usePermissionGroup(menuName: string): {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewAny: boolean;
  loading: boolean;
  error: string | null;
} {
  const { canView, canCreate, canEdit, canDelete, canViewAny, loading } =
    usePermissions();

  return {
    canView: canView(menuName),
    canCreate: canCreate(menuName),
    canEdit: canEdit(menuName),
    canDelete: canDelete(menuName),
    canViewAny: canViewAny(menuName),
    loading,
    error: null,
  };
}

export function useRole(): {
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (...roleNames: string[]) => boolean;
  getCurrentRole: () => string | undefined;
  isAdmin: () => boolean;
  isRole: (roleName: string) => boolean;
  loading: boolean;
} {
  const { hasRole, hasAnyRole, getCurrentRole, isAdmin, isRole, loading } =
    usePermissions();

  return {
    hasRole,
    hasAnyRole,
    getCurrentRole,
    isAdmin,
    isRole,
    loading,
  };
}
