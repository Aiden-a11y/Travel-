import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return Response.json({ error: "q required" }, { status: 400 });

  // Clean up destination: take first meaningful segment before →, /, ,
  const cleaned = q.split(/[→\/,]/)[0].trim();

  console.log(`[geocode] query: "${q}" → cleaned: "${cleaned}"`);

  // 1) Wikipedia REST API (no rate limit, fast)
  for (const term of [cleaned, cleaned.split(/\s+/).slice(0, 2).join(" ")]) {
    if (!term) continue;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
        { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(4000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.coordinates) {
          console.log(`[geocode] Wikipedia hit for "${term}": ${data.coordinates.lat},${data.coordinates.lon}`);
          return Response.json({ lat: data.coordinates.lat, lng: data.coordinates.lon, source: "wikipedia" });
        }
      }
    } catch {}
  }

  // 2) Nominatim fallback (OpenStreetMap)
  for (const term of [cleaned, cleaned.split(/\s+/)[0]]) {
    if (!term) continue;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=1`,
        { headers: { "User-Agent": "TravelPlannerApp/1.0" }, signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) {
          const { lat, lon } = data[0];
          console.log(`[geocode] Nominatim hit for "${term}": ${lat},${lon}`);
          return Response.json({ lat: parseFloat(lat), lng: parseFloat(lon), source: "nominatim" });
        }
      }
    } catch {}
  }

  console.log(`[geocode] NOT FOUND for "${q}"`);
  return Response.json({ error: "not found" }, { status: 404 });
}
