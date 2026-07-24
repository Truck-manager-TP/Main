import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type FleetTruck = {
  id: string;
  plate: string;
  driver: string;
  route: string;
  load: string;
  fuel: number;
  status: string;
  km: number;
  lat: number;
  lng: number;
  productType: string | null;
  routeFrom?: [number, number];
  routeTo?: [number, number];
};

type ProductMeta = { color: string; bg: string; short: string };

type Props = {
  trucks: FleetTruck[];
  selectedId: string | null;
  onSelect: (truck: FleetTruck | null) => void;
  productMeta: Record<string, ProductMeta>;
};

function truckIcon(color: string, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${selected ? 36 : 30}px;height:${selected ? 36 : 30}px;
      background:${color};border:3px solid #fff;border-radius:10px;
      box-shadow:0 4px 14px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
      font-size:${selected ? 16 : 14}px;
    ">📦</div>`,
    iconSize: [selected ? 36 : 30, selected ? 36 : 30],
    iconAnchor: [selected ? 18 : 15, selected ? 18 : 15],
  });
}

export default function FleetTrackingMap({ trucks, selectedId, onSelect, productMeta }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([34.0, -3.5], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    trucks.forEach(truck => {
      const meta = truck.productType ? productMeta[truck.productType] : { color: "#5A6882" };
      const selected = truck.id === selectedId;
      const latLng: L.LatLngExpression = [truck.lat, truck.lng];
      bounds.push(latLng);

      if (truck.routeFrom && truck.routeTo) {
        L.polyline([truck.routeFrom, [truck.lat, truck.lng], truck.routeTo], {
          color: meta.color,
          weight: selected ? 4 : 2,
          opacity: selected ? 0.9 : 0.45,
          dashArray: "8 6",
        }).addTo(group);

        L.circleMarker(truck.routeFrom, {
          radius: 4,
          color: "#1B3A6B",
          fillColor: "#1B3A6B",
          fillOpacity: 0.8,
          weight: 1,
        }).bindTooltip("Départ", { permanent: false }).addTo(group);

        L.circleMarker(truck.routeTo, {
          radius: 4,
          color: "#F97316",
          fillColor: "#F97316",
          fillOpacity: 0.8,
          weight: 1,
        }).bindTooltip("Destination", { permanent: false }).addTo(group);
      }

      const marker = L.marker(latLng, { icon: truckIcon(meta.color, selected) })
        .bindPopup(`
          <div style="min-width:180px;font-family:Inter,sans-serif">
            <strong>${truck.id}</strong> · ${truck.plate}<br/>
            <span style="color:${meta.color};font-weight:600">${truck.productType ?? "—"}</span><br/>
            ${truck.driver}<br/>
            <small>${truck.route}</small><br/>
            <small>Charge: ${truck.load} · ${truck.km} km</small>
          </div>
        `)
        .addTo(group);

      marker.on("click", () => onSelect(selected ? null : truck));
      if (selected) marker.openPopup();
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 8);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 8 });
    }

    setTimeout(() => map.invalidateSize(), 100);
  }, [trucks, selectedId, onSelect, productMeta]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border shadow-sm">
        Carte OpenStreetMap · itinéraires réels (PostgreSQL)
      </div>
    </div>
  );
}
