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
