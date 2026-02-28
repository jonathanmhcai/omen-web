import type { GeoJSON } from "geojson";
import { PolymarketEvent } from "../lib/types";
import countryCoordinates from "../lib/country-coordinates.json";
import stateCoordinates from "../lib/us-state-coordinates.json";

const countryCoords = countryCoordinates as Record<string, { lat: number; lng: number; iso2: string }>;
const stateCoords = stateCoordinates as Record<string, { lat: number; lng: number; abbr: string }>;

// Sort state names longest-first so "West Virginia" matches before "Virginia", etc.
const stateNames = Object.keys(stateCoords).sort((a, b) => b.length - a.length);

// Pre-build word-boundary regexes for title matching
const stateRegexes = stateNames.map((name) => ({
  name,
  regex: new RegExp(`\\b${name}\\b`, "i"),
}));

const POLITICS_TAG_ID = "2";

interface LocationMatch {
  slug: string;
  lat: number;
  lng: number;
}

export function matchLocation(event: PolymarketEvent): LocationMatch | null {
  // 1. Try country tag-slug lookup (existing logic)
  const countryTag = event.tags.find((t) => countryCoords[t.slug]);
  if (countryTag) {
    const c = countryCoords[countryTag.slug];
    return { slug: countryTag.slug, lat: c.lat, lng: c.lng };
  }

  // 2. Try US state name in title (longest-first, word-boundary)
  for (const { name, regex } of stateRegexes) {
    if (regex.test(event.title)) {
      const s = stateCoords[name];
      return { slug: `us-${name.replace(/ /g, "-")}`, lat: s.lat, lng: s.lng };
    }
  }

  // 3. Try US state name in tag slugs (e.g. "texas-primary" contains "texas")
  for (const name of stateNames) {
    const slugName = name.replace(/ /g, "-");
    const hasStateTag = event.tags.some((t) => t.slug.includes(slugName));
    if (hasStateTag) {
      const s = stateCoords[name];
      return { slug: `us-${slugName}`, lat: s.lat, lng: s.lng };
    }
  }

  // 4. DC fallback for unmatched US-politics events (has "Politics" tag but no country or state match)
  const hasPoliticsTag = event.tags.some((t) => t.id === POLITICS_TAG_ID);
  if (hasPoliticsTag) {
    const dc = stateCoords["washington dc"];
    return { slug: "us-washington-dc", lat: dc.lat, lng: dc.lng };
  }

  // 5. Unmatched — drop
  return null;
}

export function buildGeoJSON(events: PolymarketEvent[]): GeoJSON {
  let countryMatches = 0;
  let stateMatches = 0;
  let dcFallbacks = 0;
  let unmatched = 0;

  const features = events
    .map((e) => {
      const match = matchLocation(e);
      if (!match) {
        unmatched++;
        return null;
      }

      // Track match stats
      if (match.slug.startsWith("us-washington-dc")) {
        // Check if it was a DC fallback vs. actual DC title match
        // If the title doesn't contain "washington dc", it's a fallback
        const hasDCInTitle = /\bwashington dc\b/i.test(e.title);
        if (hasDCInTitle) stateMatches++;
        else dcFallbacks++;
      } else if (match.slug.startsWith("us-")) {
        stateMatches++;
      } else {
        countryMatches++;
      }

      return {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [match.lng, match.lat] },
        properties: { id: e.id, title: e.title, country: match.slug, volume24hr: e.volume24hr || 0 },
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  // console.log(
  //   `[map] Match stats: ${countryMatches} country, ${stateMatches} state, ${dcFallbacks} DC fallback, ${unmatched} unmatched (${events.length} total)`,
  // );

  return { type: "FeatureCollection" as const, features } as GeoJSON;
}

export function getIsoCode(slug: string): string | null {
  if (slug === "us-washington-dc") return "US"; // DC highlights entire US
  if (slug.startsWith("us-")) return null; // other states highlight individually
  return countryCoords[slug]?.iso2 ?? null;
}

export function getStateAbbr(slug: string): string | null {
  if (!slug.startsWith("us-")) return null;
  const stateName = slug.slice(3).replace(/-/g, " ");
  return stateCoords[stateName]?.abbr ?? null;
}

// Reverse lookups: ISO → slug, state abbr → slug
const isoToSlug = new Map<string, string>();
for (const [slug, data] of Object.entries(countryCoords)) {
  isoToSlug.set(data.iso2, slug);
}

const abbrToSlug = new Map<string, string>();
for (const [name, data] of Object.entries(stateCoords)) {
  abbrToSlug.set(data.abbr, `us-${name.replace(/ /g, "-")}`);
}

export function getSlugByIso(iso2: string): string | null {
  return isoToSlug.get(iso2) ?? null;
}

export function getSlugByStateAbbr(abbr: string): string | null {
  return abbrToSlug.get(abbr) ?? null;
}

// ── Lightweight trade location matching (title + slug only, no tags) ──

const countryNames = Object.keys(countryCoords).sort((a, b) => b.length - a.length);
const countryRegexes = countryNames
  .filter((name) => name.length > 3)
  .map((name) => ({
    name,
    regex: new RegExp(`\\b${name.replace(/-/g, "[- ]")}\\b`, "i"),
  }));

const tradeLocationCache = new Map<string, LocationMatch | null>();

export function matchTradeLocation(
  title: string,
  eventSlug: string,
): LocationMatch | null {
  const cached = tradeLocationCache.get(eventSlug);
  if (cached !== undefined) return cached;

  const result = _matchTradeLocation(title, eventSlug);
  tradeLocationCache.set(eventSlug, result);
  return result;
}

function _matchTradeLocation(
  title: string,
  eventSlug: string,
): LocationMatch | null {
  for (const { name, regex } of stateRegexes) {
    if (regex.test(title)) {
      const s = stateCoords[name];
      return { slug: `us-${name.replace(/ /g, "-")}`, lat: s.lat, lng: s.lng };
    }
  }

  for (const { name, regex } of countryRegexes) {
    if (regex.test(title)) {
      const c = countryCoords[name];
      return { slug: name, lat: c.lat, lng: c.lng };
    }
  }

  for (const name of countryNames) {
    if (name.length <= 3) continue;
    const slugName = name.replace(/ /g, "-");
    if (eventSlug.includes(slugName)) {
      const c = countryCoords[name];
      return { slug: name, lat: c.lat, lng: c.lng };
    }
  }

  return null;
}

export function groupEventsByLocation(events: PolymarketEvent[]) {
  const map = new Map<string, PolymarketEvent[]>();
  for (const e of events) {
    const match = matchLocation(e);
    if (!match) continue;
    const existing = map.get(match.slug);
    if (existing) existing.push(e);
    else map.set(match.slug, [e]);
  }
  return map;
}
