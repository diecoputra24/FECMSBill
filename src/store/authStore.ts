import { create } from 'zustand';
import { authClient } from '@/lib/auth-client';
import api from '@/lib/api';
import { z } from 'zod';
import type { Role } from '@/types/role';
import type { Area } from '@/types/area';
import type { Vendor } from '@/types/vendor';

// ========= Zod Schemas (Client-Side, Zod v4) =========

export const loginSchema = z.object({
    email: z.string({ error: 'Email wajib diisi' }).email('Format email tidak valid').transform((val) => val.toLowerCase().trim()),
    password: z.string({ error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
    name: z.string({ error: 'Nama wajib diisi' }).min(2).max(100).trim(),
    email: z.string({ error: 'Email wajib diisi' }).email().transform((val) => val.toLowerCase().trim()),
    username: z.string({ error: 'Username wajib diisi' }).min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).transform((val) => val.toLowerCase().trim()),
    password: z.string({ error: 'Password wajib diisi' }).min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
    role: z.enum(['ADMIN', 'SUPERADMIN', 'OPERATOR']).default('ADMIN'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ========= Types =========

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    username: string;
    role: string; // The role string from better-auth (e.g. "SUPERADMIN")
    roleId?: number | null; // The DB relation ID if available
    image: string | null;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    branchId: number | null;
    areas: Area[]; // Assigned areas for specific permissions
    permissions: string[]; // Added permissions list
    theme?: string;
    position?: string | null;
    vendorId?: number | null;
    vendor?: Vendor | null;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    fieldErrors: Record<string, string[]>;

    // Actions
    login: (input: LoginInput) => Promise<boolean>;
    register: (input: RegisterInput) => Promise<boolean>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    clearError: () => void;
    fetchUserPermissions: (roleId: number) => Promise<string[]>;
}

// ========= Store =========

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    fieldErrors: {},

    fetchUserPermissions: async (roleId: number) => {
        try {
            const response = await api.get<Role>(`/roles/${roleId}`);
            if (response.data && response.data.permissions) {
                return response.data.permissions.map((p) => p.permission.name);
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
            return [];
        }
    },

    login: async (input: LoginInput) => {
        set({ isLoading: true, error: null, fieldErrors: {} });

        // Validate with Zod
        const validation = loginSchema.safeParse(input);
        if (!validation.success) {
            const fieldErrors: Record<string, string[]> = {};
            validation.error.issues.forEach((issue) => {
                const field = issue.path[0]?.toString() || 'form';
                if (!fieldErrors[field]) fieldErrors[field] = [];
                fieldErrors[field].push(issue.message);
            });
            set({ isLoading: false, fieldErrors });
            return false;
        }

        try {
            const { data, error } = await authClient.signIn.email({
                email: validation.data.email,
                password: validation.data.password,
            });

            if (error) {
                set({
                    isLoading: false,
                    error: error.message || 'Login gagal. Periksa email dan password.',
                });
                return false;
            }

            if (data?.user) {
                const baseUser = data.user as unknown as AuthUser;
                let permissions: string[] = [];
                let fullProfile: any = null;

                try {
                    const profileRes = await api.get('/users/me');
                    fullProfile = profileRes.data;
                } catch (err) {
                    console.error('Failed to fetch full profile:', err);
                }

                if (fullProfile?.userRole?.permissions) {
                    permissions = fullProfile.userRole.permissions.map((p: any) => p.permission.name);
                } else if (baseUser.roleId) {
                    permissions = await get().fetchUserPermissions(baseUser.roleId);
                }

                set({
                    user: {
                        ...baseUser,
                        ...fullProfile, // Merge full DB profile (includes branchId, etc)
                        areas: fullProfile?.areas || [],
                        permissions
                    },
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
                return true;
            }

            set({ isLoading: false, error: 'Login gagal. Coba lagi.' });
            return false;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
            set({ isLoading: false, error: message });
            return false;
        }
    },

    register: async (input: RegisterInput) => {
        set({ isLoading: true, error: null, fieldErrors: {} });

        // Validate with Zod
        const validation = registerSchema.safeParse(input);
        if (!validation.success) {
            const fieldErrors: Record<string, string[]> = {};
            validation.error.issues.forEach((issue) => {
                const field = issue.path[0]?.toString() || 'form';
                if (!fieldErrors[field]) fieldErrors[field] = [];
                fieldErrors[field].push(issue.message);
            });
            set({ isLoading: false, fieldErrors });
            return false;
        }

        try {
            const { data, error } = await authClient.signUp.email({
                email: validation.data.email,
                password: validation.data.password,
                name: validation.data.name,
                username: validation.data.username,
                role: validation.data.role,
            } as any);

            if (error) {
                set({
                    isLoading: false,
                    error: error.message || 'Registrasi gagal.',
                });
                return false;
            }

            if (data?.user) {
                const user = data.user as unknown as AuthUser;
                let permissions: string[] = [];

                // Assuming new registration assigns default roleId or returns it
                // If not returned, usually register doesn't auto-login with full profile immediately in some flows,
                // but better-auth usually returns session.

                if (user.roleId) {
                    permissions = await get().fetchUserPermissions(user.roleId);
                }

                set({
                    user: { ...user, permissions },
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                });
                return true;
            }

            set({ isLoading: false, error: 'Registrasi gagal. Coba lagi.' });
            return false;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
            set({ isLoading: false, error: message });
            return false;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await authClient.signOut();
        } catch {
            // Ignore errors
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                fieldErrors: {},
            });
        }
    },

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const { data } = await authClient.getSession();
            if (data?.user) {
                const baseUser = data.user as unknown as AuthUser;
                let permissions: string[] = [];
                let fullProfile: any = null;

                try {
                    const profileRes = await api.get('/users/me');
                    fullProfile = profileRes.data;
                } catch (err) {
                    console.error('Failed to fetch full profile in checkSession:', err);
                }

                if (fullProfile?.userRole?.permissions) {
                    permissions = fullProfile.userRole.permissions.map((p: any) => p.permission.name);
                } else if (baseUser.roleId) {
                    permissions = await get().fetchUserPermissions(baseUser.roleId);
                }

                set({
                    user: {
                        ...baseUser,
                        ...fullProfile, // Merge full DB profile
                        areas: fullProfile?.areas || [],
                        permissions
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    clearError: () => set({ error: null, fieldErrors: {} }),
}));
