export interface Area {
    id: number;
    branchId: number;
    namaArea: string;
    kodeArea: string;
    createdAt: string;
    updatedAt: string;
}

export interface Branch {
    id: number;
    namaBranch: string;
    alamatBranch: string;
    createdAt: string;
    updatedAt: string;
    areas?: Area[];
}
