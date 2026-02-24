import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation, Loader2 } from "lucide-react";


// Fix generic marker icon issue in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    lat: string;
    lng: string;
    onLocationSelect: (lat: string, lng: string, address?: string) => void;
    onSyncChange?: (syncing: boolean) => void;
    label?: string;
    autoAddress?: boolean;
}


// Map center management component
const ChangeView = ({ center }: { center: L.LatLngExpression }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

// Component to handle clicks on the map
const MapClickHandler = ({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) => {
    useMapEvents({
        click: onClick,
    });
    return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onLocationSelect, onSyncChange, autoAddress }) => {
    const [isReversing, setIsReversing] = useState(false);

    // Internal state to keep map responsive without jumping
    const [localPos, setLocalPos] = useState<L.LatLng>(L.latLng(
        lat ? parseFloat(lat) : -6.993516,
        lng ? parseFloat(lng) : 108.443805
    ));



    const getAddress = useCallback(async (newLat: number, newLng: number) => {
        setLocalPos(L.latLng(newLat, newLng));
        onLocationSelect(newLat.toFixed(6), newLng.toFixed(6));

        if (!autoAddress) return;

        setIsReversing(true);
        onSyncChange?.(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`);
            const data = await response.json();

            let address = "";
            if (data && data.address) {
                const addr = data.address;
                const parts: string[] = [];
                const seen = new Set<string>();

                const addPart = (val: string, prefix: string = "") => {
                    if (!val) return;
                    const clean = val.replace(/Kecamatan|Kabupaten|Regency|Kota|Province|Provinsi/gi, "").trim();
                    if (clean && !seen.has(clean.toLowerCase())) {
                        parts.push(prefix + clean);
                        seen.add(clean.toLowerCase());
                    }
                };

                // 1. Dusun / Blok (Nominatim: hamlet, allotments, or neighborhood)
                addPart(addr.hamlet || addr.allotments || addr.neighborhood);

                // 2. RT/RW (Nominatim: residential)
                addPart(addr.residential);

                // 3. Desa / Kelurahan (Nominatim: village, suburb, or town)
                addPart(addr.village || addr.suburb || addr.town);

                // 4. Kecamatan (Nominatim: municipality, district, or city_district)
                const kecamatan = addr.municipality || addr.district || addr.city_district;
                addPart(kecamatan, "Kec. ");

                // 5. Kabupaten / Kota (Nominatim: city, county, or regency)
                addPart(addr.city || addr.county || addr.regency);

                // 6. Provinsi (Nominatim: state)
                addPart(addr.state);

                address = parts.join(", ");

                // Fallback to display_name if parts are too short
                if (parts.length < 3) {
                    address = data.display_name;
                }
            } else if (data && data.display_name) {
                address = data.display_name;
            }

            onLocationSelect(newLat.toFixed(6), newLng.toFixed(6), address);
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        } finally {
            setIsReversing(false);
            onSyncChange?.(false);
        }
    }, [onLocationSelect, autoAddress, onSyncChange]);

    // Auto-sync address when toggle is turned ON
    useEffect(() => {
        // Hanya trigger jika autoAddress AKTIF
        if (autoAddress && lat && lng) {
            const pLat = parseFloat(lat);
            const pLng = parseFloat(lng);

            if (!isNaN(pLat) && !isNaN(pLng)) {
                // Gunakan timeout kecil untuk menghindari tabrakan render cycle
                const timer = setTimeout(() => {
                    getAddress(pLat, pLng);
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [autoAddress]); // Cukup bergantung pada autoAddress saja

    const handleMapClick = (e: L.LeafletMouseEvent) => {

        getAddress(e.latlng.lat, e.latlng.lng);
    };

    const handleMarkerDrag = (e: any) => {
        const newPos = e.target.getLatLng();
        getAddress(newPos.lat, newPos.lng);
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                getAddress(pos.coords.latitude, pos.coords.longitude);
            });
        }
    };

    return (
        <div className="w-full h-full relative group rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 isolate">
            {/* Action Overlay */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="h-10 px-3 bg-white border border-slate-200 rounded-lg shadow-lg flex items-center justify-center gap-2 text-slate-700 hover:text-primary hover:border-primary/30 transition-all font-bold text-[10px] uppercase tracking-wider"
                    title="Gunakan Lokasi Saat Ini"
                >
                    <Navigation size={14} className="fill-current" />
                    Lokasi Saya
                </button>
            </div>

            {/* Coordinates Badge */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-slate-100 text-[9px] font-mono font-bold text-slate-600">
                {localPos.lat.toFixed(6)}, {localPos.lng.toFixed(6)}
            </div>

            {/* Loading Overlay */}
            {isReversing && (
                <div className="absolute inset-0 z-[1100] bg-white/30 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-lg border border-primary/10 flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Sync...</span>
                    </div>
                </div>
            )}

            <MapContainer
                center={localPos}
                zoom={15}
                zoomControl={false}
                className="h-full w-full"
                scrollWheelZoom={true}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeView center={localPos} />
                <MapClickHandler onClick={handleMapClick} />
                <Marker
                    position={localPos}
                    draggable={true}
                    eventHandlers={{ dragend: handleMarkerDrag }}
                />
            </MapContainer>
        </div>
    );
};
