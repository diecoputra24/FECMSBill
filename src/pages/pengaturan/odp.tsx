import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOdpStore } from "@/store/odpStore";
import { useAreaStore } from "@/store/areaStore";
import { useBranchStore } from "@/store/branchStore";
import { useAuthStore } from "@/store/authStore";
import { X, MapPin, Info } from "lucide-react";
import { ModalConfirm } from "@/components/ui/modal-confirm";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { CustomTable } from "@/components/ui/custom-table";
import { CustomFilter } from "@/components/ui/custom-filter";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import type { ODP } from "@/store/odpStore";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix leaflet icon issue for Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component for map interactions
const LocationMarker = ({ position, setPosition }: { position: [number, number], setPosition: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng.lat, e.latlng.lng);
        },
    });

    return position ? (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    setPosition(position.lat, position.lng);
                },
            }}
        />
    ) : null;
};

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

const OdpList: React.FC = () => {
    const {
        odps,
        loading,
        error: odpError,
        fetchOdps,
        updateOdp,
        deleteOdp,
        filterValues,
        appliedFilters,
        sortConfig,
        setFilterValues,
        setAppliedFilters,
        setSortConfig,
        resetFilters,
        addOdp
    } = useOdpStore();
    const { areas, fetchAreas, loading: areaLoading, error: areaError } = useAreaStore();
    const { branches, fetchBranches, loading: branchLoading, error: branchError } = useBranchStore();
    const { user } = useAuthStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    const [editingOdp, setEditingOdp] = useState<ODP | null>(null);
    const [odpToDelete, setOdpToDelete] = useState<ODP | null>(null);

    // Selection & Detail states
    const [selectedOdpId, setSelectedOdpId] = useState<number | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOdpForDetail, setSelectedOdpForDetail] = useState<ODP | null>(null);

    const [formData, setFormData] = useState({
        namaOdp: "",
        areaId: "",
        portOdp: "8",
        latOdp: "-6.2088",
        longOdp: "106.8456"
    });

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    // Only fetch ODPs when branch is applied via search button or if SUPERADMIN
    useEffect(() => {
        if (appliedFilters.branchId !== "" || user?.role === 'SUPERADMIN') {
            fetchOdps();
        }
    }, [appliedFilters.branchId, fetchOdps, user?.role]);

    const handleSearch = () => {
        setAppliedFilters({ ...filterValues });
        setSelectedOdpId(null);
    };

    const handleReset = () => {
        resetFilters();
        setSelectedOdpId(null);
    };

    const handleOpenModal = (odp: ODP) => {
        setEditingOdp(odp);
        setFormData({
            namaOdp: odp.namaOdp,
            areaId: odp.areaId.toString(),
            portOdp: odp.portOdp.toString(),
            latOdp: odp.latOdp.toString(),
            longOdp: odp.longOdp.toString()
        });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (odp: ODP) => {
        setOdpToDelete(odp);
        setIsDeleteModalOpen(true);
    };

    const handleSelectionChange = (id: string | number | null) => {
        setSelectedOdpId(id ? Number(id) : null);
    };

    const handleRowClick = (odp: ODP) => {
        setSelectedOdpForDetail(odp);
        setIsDetailModalOpen(true);
    };

    const handleEditSelected = () => {
        const odp = odps.find(o => o.id === selectedOdpId);
        if (odp) handleOpenModal(odp);
    };

    const handleDeleteSelected = () => {
        const odp = odps.find(o => o.id === selectedOdpId);
        if (odp) handleOpenDeleteModal(odp);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSubmit = {
                namaOdp: formData.namaOdp,
                areaId: parseInt(formData.areaId),
                portOdp: parseInt(formData.portOdp),
                latOdp: parseFloat(formData.latOdp),
                longOdp: parseFloat(formData.longOdp)
            };

            if (editingOdp) {
                await updateOdp(editingOdp.id, dataToSubmit);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "Data ODP berhasil diperbarui."
                });
            } else {
                await addOdp(dataToSubmit);
                setMessageConfig({
                    type: "success",
                    title: "Berhasil!",
                    message: "ODP baru berhasil ditambahkan."
                });
            }
            setIsModalOpen(false);
            setIsMessageModalOpen(true);
            setSelectedOdpId(null);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat menyimpan data."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleDelete = async () => {
        if (odpToDelete) {
            try {
                await deleteOdp(odpToDelete.id);
                setIsDeleteModalOpen(false);
                setOdpToDelete(null);
                setSelectedOdpId(null);
                setMessageConfig({
                    type: "success",
                    title: "Dihapus!",
                    message: "ODP berhasil dihapus secara permanen."
                });
                setIsMessageModalOpen(true);
            } catch (error) {
                setMessageConfig({
                    type: "error",
                    title: "Gagal!",
                    message: "Terjadi kesalahan saat menghapus data."
                });
                setIsMessageModalOpen(true);
            }
        }
    };

    const columns = [
        {
            header: "Nama ODP",
            sortable: true,
            sortKey: "namaOdp",
            render: (odp: ODP) => (
                <div className="text-slate-900">
                    {odp.namaOdp}
                </div>
            )
        },
        {
            header: "Area",
            render: (odp: ODP) => (
                <div className="text-slate-600">
                    {odp.area?.namaArea || "Unknown"}
                </div>
            )
        },
        {
            header: "Kapasitas",
            render: (odp: ODP) => (
                <div className="text-slate-600">
                    {odp.portOdp} Port
                </div>
            )
        },
        {
            header: "Koordinat",
            render: (odp: ODP) => (
                <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{odp.latOdp}, {odp.longOdp}</span>
                </div>
            )
        }
    ];

    const filteredOdps = odps.filter(odp => {
        if (appliedFilters.branchId === "" && user?.role !== 'SUPERADMIN') return false;

        const matchesBranch = appliedFilters.branchId === "all" || odp.area?.branchId.toString() === appliedFilters.branchId;
        const matchesArea = appliedFilters.areaId === "" || appliedFilters.areaId === "all" || odp.areaId.toString() === appliedFilters.areaId;
        const matchesSearch = odp.namaOdp.toLowerCase().includes(appliedFilters.search.toLowerCase());

        return matchesBranch && matchesArea && matchesSearch;
    });

    const sortedOdps = [...filteredOdps].sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        const aString = aValue.toString().toLowerCase();
        const bString = bValue.toString().toLowerCase();
        return sortConfig.order === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString);
    });

    const handleSort = (key: string) => {
        setSortConfig({
            key: key as keyof ODP,
            order: sortConfig.key === key && sortConfig.order === "asc" ? "desc" : "asc"
        });
    };

    return (
        <div className="space-y-4 pb-10">
            <CustomFilter
                onSearch={handleSearch}
                onReset={handleReset}
                loading={loading}
                filters={[
                    {
                        label: "Filter Cabang",
                        placeholder: "Pilih Cabang Terlebih Dahulu",
                        value: filterValues.branchId,
                        type: "select",
                        options: [
                            { label: "Semua Cabang", value: "all" },
                            ...branches.map((b: any) => ({ label: b.namaBranch, value: b.id.toString() }))
                        ],
                        loading: branchLoading,
                        error: !!branchError,
                        onChange: (val) => {
                            setFilterValues({ branchId: val, areaId: "all" });
                            if (val && val !== "all") {
                                fetchAreas();
                            }
                        }
                    },
                    {
                        label: "Filter Area",
                        placeholder: filterValues.branchId ? "Semua Area" : "Pilih Cabang dulu",
                        value: filterValues.areaId,
                        type: "select",
                        disabled: !filterValues.branchId,
                        loading: areaLoading,
                        error: !!areaError,
                        options: [
                            { label: "Semua Area", value: "all" },
                            ...areas
                                .filter((a: any) => a.branchId.toString() === filterValues.branchId)
                                .map((a: any) => ({ label: a.namaArea, value: a.id.toString() }))
                        ],
                        onChange: (val) => setFilterValues({ areaId: val })
                    },
                    {
                        label: "Cari ODP",
                        placeholder: "Nama ODP...",
                        value: filterValues.search,
                        type: "text",
                        onChange: (val) => setFilterValues({ search: val })
                    }
                ]}
            />

            <CustomTable
                data={sortedOdps}
                columns={columns}
                loading={loading}
                error={!!odpError}
                emptyMessage={appliedFilters.branchId === "" ? "Silakan pilih Cabang dan klik Cari untuk memuat data ODP." : "Tidak ada data ODP ditemukan."}
                sorting={{
                    sortKey: sortConfig.key,
                    sortOrder: sortConfig.order,
                    onSort: handleSort
                }}
                enableSelection={true}
                selectedId={selectedOdpId}
                onSelectionChange={handleSelectionChange}
                onRowClick={handleRowClick}
                actionButtons={selectedOdpId ? (
                    <>
                        <CustomButton
                            variant="secondary"
                            size="sm"
                            className="h-8 shadow-sm bg-white border-slate-200 text-slate-600 hover:text-primary hover:bg-slate-50"
                            onClick={handleEditSelected}
                        >
                            Edit
                        </CustomButton>
                        <CustomButton
                            variant="danger"
                            size="sm"
                            className="h-8 shadow-sm"
                            onClick={handleDeleteSelected}
                        >
                            Hapus
                        </CustomButton>
                    </>
                ) : null}
            />

            {/* Edit/Create Modal */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{editingOdp ? "Edit ODP" : "Tambah ODP"}</h3>
                            <CustomButton variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-sm h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={18} />
                            </CustomButton>
                        </div>
                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[90vh]">
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <CustomSelect
                                            label="Area"
                                            required
                                            value={formData.areaId}
                                            onChange={(val) => setFormData({ ...formData, areaId: val })}
                                            options={areas.map(a => ({ label: a.namaArea, value: a.id.toString() }))}
                                            placeholder="Pilih Area"
                                        />
                                        <CustomInput
                                            label="Nama ODP"
                                            required
                                            value={formData.namaOdp}
                                            onChange={(e) => setFormData({ ...formData, namaOdp: e.target.value.toUpperCase() })}
                                            placeholder="Contoh: ODP-BYG-01"
                                        />
                                        <CustomInput
                                            label="Port ODP"
                                            type="number"
                                            required
                                            value={formData.portOdp}
                                            onChange={(e) => setFormData({ ...formData, portOdp: e.target.value })}
                                            placeholder="Contoh: 8"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <CustomInput
                                                label="Latitude"
                                                required
                                                value={formData.latOdp}
                                                onChange={(e) => setFormData({ ...formData, latOdp: e.target.value })}
                                                placeholder="-6.1234"
                                            />
                                            <CustomInput
                                                label="Longitude"
                                                required
                                                value={formData.longOdp}
                                                onChange={(e) => setFormData({ ...formData, longOdp: e.target.value })}
                                                placeholder="106.1234"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                                            Pilih Lokasi Map
                                        </label>
                                        <div className="h-[280px] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative z-0">
                                            <MapContainer
                                                center={[parseFloat(formData.latOdp) || -6.2088, parseFloat(formData.longOdp) || 106.8456]}
                                                zoom={13}
                                                style={{ height: '100%', width: '100%' }}
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                />
                                                <LocationMarker
                                                    position={[parseFloat(formData.latOdp) || -6.2088, parseFloat(formData.longOdp) || 106.8456]}
                                                    setPosition={(lat, lng) => setFormData({ ...formData, latOdp: lat.toString(), longOdp: lng.toString() })}
                                                />
                                                <MapUpdater center={[parseFloat(formData.latOdp) || -6.2088, parseFloat(formData.longOdp) || 106.8456]} />
                                            </MapContainer>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic px-1 text-center">
                                            Klik pada peta atau geser marker untuk menentukan koordinat
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-2">
                                    <CustomButton type="button" variant="outline" className="h-8 px-4 font-semibold text-xs text-slate-600" onClick={() => setIsModalOpen(false)}>Batal</CustomButton>
                                    <CustomButton type="submit" variant="primary" className="h-8 px-4 font-bold text-xs shadow-sm" disabled={loading}>{loading ? "Memproses..." : editingOdp ? "Simpan Perubahan" : "Tambah ODP"}</CustomButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <ModalDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail ODP"
                icon={Info}
                maxWidth="md"
                onConfirm={() => setIsDetailModalOpen(false)}
                confirmLabel="Tutup"
                cancelLabel=""
                items={[
                    { label: "Nama ODP", value: selectedOdpForDetail?.namaOdp || "-" },
                    { label: "Area", value: selectedOdpForDetail?.area?.namaArea || "-" },
                    { label: "Kapasitas", value: `${selectedOdpForDetail?.portOdp || 0} Port` },
                    { label: "Koordinat", value: `${selectedOdpForDetail?.latOdp}, ${selectedOdpForDetail?.longOdp}` },
                ]}
            />

            <ModalConfirm
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                variant="danger"
                title="Hapus ODP?"
                message={`ODP "${odpToDelete?.namaOdp}" akan dihapus permanen.`}
                confirmLabel="Ya, Hapus"
                loading={loading}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default OdpList;
