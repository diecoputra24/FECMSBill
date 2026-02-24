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
}

import type { Tax } from './tax';

export interface Customer {
    id: number;
    idPelanggan: string;
    namaPelanggan: string;
    alamatPelanggan: string;
    teleponPelanggan: string;
    identitasPelanggan: string;
    latitude: number | null;
    longitude: number | null;
    areaId: number;
    odpId: number | null;
    odpPortId: number | null;
    statusPelanggan: "AKTIF" | "ISOLIR" | "NONAKTIF";
    tanggalAktif: string | null;
    tanggalAkhir: string | null;
    tanggalToleransi: string | null;
    createdAt: string;
    updatedAt: string;
    area?: Area;
    odp?: Odp;
    diskon: number; // Manual discount in Rupiah
    useTax: boolean;
    taxId: number | null;
    tax?: Tax;
}

export interface Discount {
    id: number;
    name: string;
    type: 'FIXED' | 'PERCENT';
    value: number;
    startDate: string | null;
    endDate: string | null;
}

export interface CustomerDiscount {
    id: number;
    customerId: number;
    discountId: number;
    isActive: boolean;
    createdAt: string;
    discount?: Discount;
}

export interface Packet {
    id: number;
    routerId: number;
    namaPaket: string;
    hargaPaket: number;
    mikrotikProfile: string;
    displayPaket: boolean;
    deskripsi: string;
    createdAt: string;
    updatedAt: string;
}

export interface Connection {
    id: number;
    pelangganId: number;
    paketId: number;
    secretMode: 'NEW' | 'EXISTING' | 'NONE';
    pppUsername?: string | null;
    pppPassword?: string | null;
    pppService?: string | null;
    createdAt: string;
    updatedAt: string;
    pelanggan?: Customer;
    paket?: Packet;
}
