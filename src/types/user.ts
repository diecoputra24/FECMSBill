import type { Role } from "./role";
import type { Branch } from "./branch";
import type { Area } from "./area";
import type { Vendor } from "./vendor";

export interface User {
    id: string; // UUID
    roleId: number | null;
    role?: string; // e.g. "ADMIN" from user.role field, mostly for auth/compatibility
    userRole?: Role; // Relation
    branchId: number | null;
    branch?: Branch;
    areas?: Area[];
    name: string;
    username: string;
    email: string;
    emailVerified: boolean;
    image?: string;
    createdAt: string;
    updatedAt: string;
    position?: string;
    vendorId?: number | null;
    vendor?: Vendor;
}
