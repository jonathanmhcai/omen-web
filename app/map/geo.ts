import type { GeoJSON } from "geojson";
import { PolymarketEvent } from "../lib/types";
import countryCoordinates from "../lib/country-coordinates.json";

const coords = countryCoordinates as Record<string, { lat: number; lng: number; iso2: string }>;

export function matchCountry(event: PolymarketEvent) {
  const tag = event.tags.find((t) => coords[t.slug]);
  if (!tag) return null;
  return { slug: tag.slug, ...coords[tag.slug] };
}

export function buildGeoJSON(events: PolymarketEvent[]): GeoJSON {
  const features = events
    .map((e) => {
      const match = matchCountry(e);
      if (!match) return null;
      return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [match.lng, match.lat] },
        properties: { id: e.id, title: e.title, country: match.slug },
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return { type: "FeatureCollection" as const, features } as GeoJSON;
}

export function getIsoCode(slug: string): string | null {
  return coords[slug]?.iso2 ?? null;
}

export function groupEventsByCountry(events: PolymarketEvent[]) {
  const map = new Map<string, PolymarketEvent[]>();
  for (const e of events) {
    const match = matchCountry(e);
    if (!match) continue;
    const existing = map.get(match.slug);
    if (existing) existing.push(e);
    else map.set(match.slug, [e]);
  }
  return map;
}
