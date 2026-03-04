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

// Sort country names longest-first so "South Korea" matches before "Korea", etc.
const countryNames = Object.keys(countryCoords).sort((a, b) => b.length - a.length);
const countryRegexes = countryNames
  .filter((name) => name.length > 3)
  .map((name) => ({
    name,
    regex: new RegExp(`\\b${name.replace(/-/g, "[- ]")}\\b`, "i"),
  }));

const POLITICS_TAG_ID = "2";

// Common short-form tag slugs that don't match countryCoords keys
const TAG_ALIASES: Record<string, string> = {
  uk: "united kingdom",
  britain: "united kingdom",
  england: "united kingdom",
  scotland: "united kingdom",
  uae: "united arab emirates",
};

const US_KEYWORDS = /\b(us|u\.s\.|united states|american|congress|senate|house of representatives|scotus|supreme court|fbi|cia|doj|fcc|ftc|sec|fed\b|federal reserve|trump|biden|gop|republican|democrat|filibuster|impeach|oval office|white house|pentagon|midterm|electoral|epstein|pardon|medicaid|medicare|social security)\b/i;

interface LocationMatch {
  slug: string;
  lat: number;
  lng: number;
}

export function matchLocation(event: PolymarketEvent): LocationMatch | null {
  // Step 1: Country tag-slug — exact match (e.g. tag "france" → country "france")
  // Prefer the tag whose country name appears in the title. If no tag matches the
  // title but a different country IS in the title, fall through to step 3 (title regex).
  const countryTags = event.tags.filter((t) => countryCoords[t.slug]);
  if (countryTags.length > 0) {
    const titleLower = event.title.toLowerCase();
    const titleMatch = countryTags.find((t) => titleLower.includes(t.slug.replace(/-/g, " ")));
    if (titleMatch) {
      const c = countryCoords[titleMatch.slug];
      return { slug: titleMatch.slug, lat: c.lat, lng: c.lng };
    }
    // No tag country appears in the title — check if a different country is in the title
    const hasTitleCountry = countryRegexes.some(({ regex }) => regex.test(event.title));
    if (!hasTitleCountry) {
      // No country in title at all — trust the first tag
      const c = countryCoords[countryTags[0].slug];
      return { slug: countryTags[0].slug, lat: c.lat, lng: c.lng };
    }
    // A different country is in the title — fall through to step 3
  }

  // Step 1.5: Country tag-slug — alias match (e.g. tag "uk" → "united kingdom")
  for (const tag of event.tags) {
    const aliased = TAG_ALIASES[tag.slug];
    if (aliased && countryCoords[aliased]) {
      const c = countryCoords[aliased];
      return { slug: aliased, lat: c.lat, lng: c.lng };
    }
  }

  // Step 2: Country name in title — regex (e.g. "Colombia Presidential Election" → "colombia")
  for (const { name, regex } of countryRegexes) {
    if (regex.test(event.title)) {
      const c = countryCoords[name];
      return { slug: name, lat: c.lat, lng: c.lng };
    }
  }

  // Step 3: Country tag-slug — substring match (e.g. tag "colombian-politics" contains "colombia")
  for (const name of countryNames) {
    if (name.length <= 3) continue; // skip short names like "uk" — too ambiguous for substring
    const slugName = name.replace(/ /g, "-");
    if (event.tags.some((t) => t.slug.includes(slugName))) {
      const c = countryCoords[name];
      return { slug: name, lat: c.lat, lng: c.lng };
    }
  }

  // Step 4: US state name in title — regex (e.g. "Texas Primary" → "us-texas")
  for (const { name, regex } of stateRegexes) {
    if (regex.test(event.title)) {
      const s = stateCoords[name];
      return { slug: `us-${name.replace(/ /g, "-")}`, lat: s.lat, lng: s.lng };
    }
  }

  // Step 5: US state name in tag slugs (e.g. tag "texas-primary" contains "texas")
  for (const name of stateNames) {
    const slugName = name.replace(/ /g, "-");
    if (event.tags.some((t) => t.slug.includes(slugName))) {
      const s = stateCoords[name];
      return { slug: `us-${slugName}`, lat: s.lat, lng: s.lng };
    }
  }

  // Step 6: DC fallback — only if event has Politics tag AND US-specific keywords in title/tags
  const hasPoliticsTag = event.tags.some((t) => t.id === POLITICS_TAG_ID);
  if (hasPoliticsTag) {
    const tagLabels = event.tags.map((t) => t.label).join(" ");
    if (US_KEYWORDS.test(event.title) || US_KEYWORDS.test(tagLabels)) {
      const dc = stateCoords["washington dc"];
      return { slug: "us-washington-dc", lat: dc.lat, lng: dc.lng };
    }
  }

  // Step 7: Unmatched — drop
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
  const c = countryCoords[slug] || countryCoords[slug.replace(/-/g, " ")];
  return c?.iso2 ?? null;
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

export function getCoordinatesBySlug(slug: string): { lat: number; lng: number } | null {
  if (slug.startsWith("us-")) {
    const stateName = slug.slice(3).replace(/-/g, " ");
    const s = stateCoords[stateName];
    return s ? { lat: s.lat, lng: s.lng } : null;
  }
  const c = countryCoords[slug] || countryCoords[slug.replace(/-/g, " ")];
  return c ? { lat: c.lat, lng: c.lng } : null;
}

export function slugToDisplayName(slug: string): string {
  if (slug.startsWith("us-")) {
    return slug
      .slice(3)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
