import type { Branch } from './branch';

export interface Odp {
    id: number;
    areaId: number;
    namaOdp: string;
    portOdp: number;
    latOdp: number;
    longOdp: number;
    createdAt: string;
    updatedAt: string;
}

export interface Area {
    id: number;
    branchId: number;
    namaArea: string;
    kodeArea: string;
    createdAt: string;
    updatedAt: string;
    branch?: Branch;
    odps?: Odp[];
}
