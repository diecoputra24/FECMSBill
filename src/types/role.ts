import type { Permission } from './permission';

export interface Role {
    id: number;
    name: string;
    description?: string;
    permissions: {
        permissionId: number;
        permission: Permission;
    }[];
    createdAt: string;
    updatedAt: string;
}
