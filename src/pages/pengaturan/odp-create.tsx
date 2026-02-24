import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOdpStore } from "@/store/odpStore";
import { useAreaStore } from "@/store/areaStore";
import { useBranchStore } from "@/store/branchStore";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInput } from "@/components/ui/custom-input";
import { CustomSelect } from "@/components/ui/custom-select";
import { ModalMessage } from "@/components/ui/modal-message";
import { ModalDetail } from "@/components/ui/modal-detail";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Save, CheckCircle2 } from "lucide-react";
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

const OdpCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { addOdp, loading, createFormData, setCreateFormData, resetCreateFormData } = useOdpStore();
    const { areas, fetchAreas, loading: areaLoading, error: areaError } = useAreaStore();
    const { branches, fetchBranches, loading: branchLoading, error: branchError } = useBranchStore();

    // Remove local state
    // const [branchId, setBranchId] = useState("");
    // const [formData, setFormData] = useState({ ... });

    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [messageConfig, setMessageConfig] = useState<{ type: "success" | "error", title: string, message: string }>({
        type: "success",
        title: "",
        message: ""
    });

    useEffect(() => {
        fetchBranches();
        fetchAreas();
    }, [fetchBranches, fetchAreas]);

    const filteredAreas = createFormData.branchId
        ? areas.filter(a => a.branchId.toString() === createFormData.branchId)
        : [];

    const handleOpenPreview = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPreviewModalOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsPreviewModalOpen(false);
        try {
            await addOdp({
                areaId: parseInt(createFormData.areaId),
                namaOdp: createFormData.namaOdp,
                portOdp: parseInt(createFormData.portOdp),
                latOdp: parseFloat(createFormData.latOdp),
                longOdp: parseFloat(createFormData.longOdp)
            });
            setMessageConfig({
                type: "success",
                title: "Berhasil!",
                message: "ODP baru berhasil ditambahkan ke sistem."
            });
            setIsMessageModalOpen(true);
        } catch (error) {
            setMessageConfig({
                type: "error",
                title: "Gagal!",
                message: "Terjadi kesalahan saat menyimpan data."
            });
            setIsMessageModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setIsMessageModalOpen(false);
        if (messageConfig.type === "success") {
            resetCreateFormData(); // Clear form on success
            navigate("/pengaturan/odp");
        }
    };

    const selectedBranch = branches.find(b => b.id.toString() === createFormData.branchId);
    const selectedArea = areas.find(a => a.id.toString() === createFormData.areaId);

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">

            <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden mt-4">
                <CardContent className="p-8">
                    <form onSubmit={handleOpenPreview} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Data Form */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <CustomSelect
                                        label="Pilih Cabang"
                                        required
                                        value={createFormData.branchId}
                                        loading={branchLoading}
                                        error={!!branchError}
                                        onChange={(val) => {
                                            setCreateFormData({ branchId: val, areaId: "" });
                                        }}
                                        options={branches.map(b => ({ label: b.namaBranch, value: b.id.toString() }))}
                                        placeholder="Pilih Cabang..."
                                    />
                                    <CustomSelect
                                        label="Pilih Area"
                                        required
                                        disabled={!createFormData.branchId}
                                        loading={areaLoading}
                                        error={!!areaError}
                                        value={createFormData.areaId}
                                        onChange={(val) => setCreateFormData({ areaId: val })}
                                        options={filteredAreas.map(a => ({ label: a.namaArea, value: a.id.toString() }))}
                                        placeholder={createFormData.branchId ? "Pilih Area..." : "Pilih Cabang dulu"}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <CustomInput
                                        label="Nama ODP"
                                        required
                                        value={createFormData.namaOdp}
                                        onChange={(e) => setCreateFormData({ namaOdp: e.target.value.toUpperCase() })}
                                        placeholder="Contoh: ODP-BYG-01"
                                    />
                                    <CustomInput
                                        label="Jumlah Port"
                                        type="number"
                                        required
                                        value={createFormData.portOdp}
                                        onChange={(e) => setCreateFormData({ portOdp: e.target.value })}
                                        placeholder="8"
                                    />
                                </div>

                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                        <MapPin size={16} className="text-primary" />
                                        Koordinat Lokasi
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <CustomInput
                                            label="Latitude"
                                            required
                                            value={createFormData.latOdp}
                                            onChange={(e) => setCreateFormData({ latOdp: e.target.value })}
                                            placeholder="-6.123456"
                                        />
                                        <CustomInput
                                            label="Longitude"
                                            required
                                            value={createFormData.longOdp}
                                            onChange={(e) => setCreateFormData({ longOdp: e.target.value })}
                                            placeholder="106.123456"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Map Side */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                                    Pilih Lokasi di Map
                                </label>
                                <div className="h-[350px] w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
                                    <MapContainer
                                        center={[parseFloat(createFormData.latOdp) || -6.2088, parseFloat(createFormData.longOdp) || 106.8456]}
                                        zoom={13}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <LocationMarker
                                            position={[parseFloat(createFormData.latOdp) || -6.2088, parseFloat(createFormData.longOdp) || 106.8456]}
                                            setPosition={(lat, lng) => setCreateFormData({ latOdp: lat.toString(), longOdp: lng.toString() })}
                                        />
                                        <MapUpdater center={[parseFloat(createFormData.latOdp) || -6.2088, parseFloat(createFormData.longOdp) || 106.8456]} />
                                    </MapContainer>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic px-1 text-center">
                                    Klik pada peta atau geser marker untuk menentukan koordinat secara otomatis
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={loading || !createFormData.areaId}
                                className="px-8"
                            >
                                <Save size={18} />
                                Simpan ODP
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ModalDetail
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                title="Konfirmasi Data ODP"
                icon={CheckCircle2}
                variant="warning"
                confirmLabel="Ya, Simpan Sekarang"
                cancelLabel="Cek Lagi"
                loading={loading}
                onConfirm={handleConfirmSave}
                items={[
                    { label: "Cabang", value: selectedBranch?.namaBranch || "-" },
                    { label: "Area", value: selectedArea?.namaArea || "-" },
                    { label: "Nama ODP", value: createFormData.namaOdp },
                    { label: "Jumlah Port", value: createFormData.portOdp },
                    { label: "Latitude", value: createFormData.latOdp },
                    { label: "Longitude", value: createFormData.longOdp }
                ]}
            />

            <ModalMessage
                isOpen={isMessageModalOpen}
                onClose={handleModalClose}
                type={messageConfig.type}
                title={messageConfig.title}
                message={messageConfig.message}
            />
        </div>
    );
};

export default OdpCreatePage;
