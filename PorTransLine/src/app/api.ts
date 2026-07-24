// Client API PorTransLine -> backend Spring Boot (proxifie par nginx sur /api).

const STATUS_MAP: Record<string, string> = {
  AVAILABLE: "disponible",
  ON_ROUTE: "en_route",
  MAINTENANCE: "maintenance",
  DECOMMISSIONED: "alerte",
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Recupere les vrais camions depuis la base et les projette sur la forme
// attendue par l'UI. `templates` fournit les champs purement visuels
// (carburant, coordonnees carte, itineraire) qui n'existent pas cote backend.
export async function fetchTrucks(templates: any[]): Promise<any[]> {
  const data = await apiGet<any[]>("/api/v1/fleet/trucks");
  return data.map((t: any, i: number) => ({
    ...templates[i % templates.length],
    id: `TRK-${String(t.id).padStart(3, "0")}`,
    plate: t.registrationPlate,
    status: STATUS_MAP[t.status] ?? "disponible",
    load: `${t.make ?? ""} ${t.model ?? ""}`.trim() || "—",
    productType: null,
  }));
}

// --- Carte des itineraires : recupere les vraies routes et les geocode ---
const ROUTE_STATUS_MAP: Record<string, string> = {
  IN_TRANSIT: "en_route", PLANNED: "disponible", DELAYED: "alerte",
  COMPLETED: "livraison", CANCELLED: "maintenance",
};

const CITY_COORDS: Record<string, [number, number]> = {
  casablanca:[33.5731,-7.5898], rabat:[34.0209,-6.8416], tanger:[35.7595,-5.8340],
  fes:[34.0181,-5.0078], meknes:[33.8935,-5.5473], marrakech:[31.6295,-7.9811],
  agadir:[30.4278,-9.5981], oujda:[34.6814,-1.9086], nador:[35.1681,-2.9337],
  safi:[32.2994,-9.2372], kenitra:[34.2610,-6.5802], tetouan:[35.5785,-5.3684],
  "beni mellal":[32.3373,-6.3498], settat:[33.0010,-7.6165],
  barcelona:[41.3874,2.1686], barcelone:[41.3874,2.1686], madrid:[40.4168,-3.7038],
  valence:[39.4699,-0.3763], bilbao:[43.2630,-2.9350], "algesiras":[36.1408,-5.4562],
  paris:[48.8566,2.3522], marseille:[43.2965,5.3698], lyon:[45.7640,4.8357],
  bordeaux:[44.8378,-0.5792], toulouse:[43.6047,1.4442],
  rotterdam:[51.9244,4.4777], amsterdam:[52.3676,4.9041],
  bruxelles:[50.8503,4.3517], liege:[50.6326,5.5797],
  milan:[45.4642,9.1900], rome:[41.9028,12.4964], genes:[44.4056,8.9463],
  lisbonne:[38.7223,-9.1393], porto:[41.1579,-8.6291],
  geneve:[46.2044,6.1432], zurich:[47.3769,8.5417],
  munich:[48.1351,11.5820], francfort:[50.1109,8.6821], hambourg:[53.5511,9.9937],
};

function normCity(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*\(.*\)\s*/g, "").trim();
}
function geo(city: string): [number, number] | null {
  return CITY_COORDS[normCity(city)] ?? null;
}

// Construit des "marqueurs carte" a partir des vraies routes de la base.
export async function fetchRouteMarkers(): Promise<any[]> {
  const data = await apiGet<any[]>("/api/v1/routes");
  const out: any[] = [];
  for (const r of data) {
    const from = geo(r.origin), to = geo(r.destination);
    if (!from || !to) continue;
    out.push({
      id: `RTE-${r.id}`,
      plate: r.truckId ? `Camion #${r.truckId}` : "—",
      driver: r.driverId ? `Driver #${r.driverId}` : "—",
      route: `${r.origin} → ${r.destination}`,
      load: r.scope === "INTERNATIONAL" ? "International" : "National",
      fuel: 60,
      km: Math.round(r.distanceKm || 0),
      status: ROUTE_STATUS_MAP[r.status] ?? "en_route",
      lat: r.lastKnownLat ?? from[0],
      lng: r.lastKnownLng ?? from[1],
      productType: "Produits agroalimentaires",
      routeFrom: from,
      routeTo: to,
    });
  }
  return out;
}

// --- Liste "Suivi d'itinéraire" : vraies routes formatées pour les cartes ---
const ROUTE_PROG: Record<string, number> = {
  PLANNED: 10, IN_TRANSIT: 60, DELAYED: 40, COMPLETED: 100, CANCELLED: 0,
};

export async function fetchRoutesList(): Promise<any[]> {
  const data = await apiGet<any[]>("/api/v1/routes");
  return data.map((r: any) => ({
    id: `RT-${r.scope === "INTERNATIONAL" ? "I" : "N"}${String(r.id).padStart(2, "0")}`,
    from: r.origin,
    to: r.destination,
    truck: r.truckId ? `TRK-${String(r.truckId).padStart(3, "0")}` : "—",
    driver: r.driverId ? `Driver #${r.driverId}` : "—",
    dist: `${Math.round(r.distanceKm || 0)} km`,
    status: ROUTE_STATUS_MAP[r.status] ?? "en_route",
    eta: "—",
    prog: ROUTE_PROG[r.status] ?? 50,
    scope: r.scope === "INTERNATIONAL" ? "international" : "national",
  }));
}
