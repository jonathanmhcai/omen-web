import { describe, it, expect } from "vitest";
import { matchLocation } from "../geo";
import snapshot from "./events-snapshot.json";

const events = snapshot as Array<{
  id: number;
  title: string;
  slug: string;
  tags: { id: string; label: string; slug: string }[];
  active: boolean;
  closed: boolean;
}>;

// Run matchLocation on every event and bucket the results
interface MatchResult {
  id: number;
  title: string;
  tags: string[]; // tag labels for readability
  matchedSlug: string | null;
  matchType: "country-tag" | "state-title" | "state-tag" | "dc-fallback" | "unmatched";
}

function classifyMatch(event: (typeof events)[0]): MatchResult {
  const match = matchLocation(event as any);
  const tagLabels = event.tags.map((t) => t.label);

  let matchType: MatchResult["matchType"];
  if (!match) {
    matchType = "unmatched";
  } else if (match.slug === "us-washington-dc") {
    // Is it a real DC match or a fallback?
    const hasDCInTitle = /\bwashington\s*d\.?c\.?\b|\bdc\b/i.test(event.title);
    const hasDCInTag = event.tags.some((t) => t.slug.includes("washington-dc") || t.slug.includes("district-of-columbia"));
    matchType = hasDCInTitle || hasDCInTag ? "state-title" : "dc-fallback";
  } else if (match.slug.startsWith("us-")) {
    // Check if matched via title or tag
    matchType = "state-title"; // simplification — could be state-tag too
  } else {
    matchType = "country-tag";
  }

  return {
    id: event.id,
    title: event.title,
    tags: tagLabels,
    matchedSlug: match?.slug ?? null,
    matchType,
  };
}

describe("matchLocation snapshot analysis", () => {
  const results = events.map(classifyMatch);

  const countryMatches = results.filter((r) => r.matchType === "country-tag");
  const stateMatches = results.filter((r) => r.matchType === "state-title");
  const dcFallbacks = results.filter((r) => r.matchType === "dc-fallback");
  const unmatched = results.filter((r) => r.matchType === "unmatched");

  it("should report match distribution", () => {
    console.log("\n=== Match Distribution ===");
    console.log(`Total events:    ${events.length}`);
    console.log(`Country matches: ${countryMatches.length}`);
    console.log(`State matches:   ${stateMatches.length}`);
    console.log(`DC fallbacks:    ${dcFallbacks.length}`);
    console.log(`Unmatched:       ${unmatched.length}`);
    expect(events.length).toBeGreaterThan(0);
  });

  it("should list all DC fallback events (suspected mismatches)", () => {
    console.log(`\n=== DC Fallback Events (${dcFallbacks.length}) ===`);
    for (const r of dcFallbacks) {
      console.log(`  [${r.id}] "${r.title}"`);
      console.log(`    tags: ${r.tags.join(", ")}`);
    }
    // This test intentionally just logs — we expect some fallbacks to be wrong
    expect(dcFallbacks.length).toBeGreaterThanOrEqual(0);
  });

  it("should detect obviously wrong DC fallbacks", () => {
    // Events mentioning a foreign country name in their title
    // that ended up at DC are almost certainly wrong
    const foreignCountryKeywords = [
      "colombia", "brazil", "mexico", "france", "germany", "india", "japan",
      "korea", "nepal", "philippines", "indonesia", "australia", "canada",
      "argentina", "chile", "peru", "italy", "spain", "portugal", "poland",
      "ukraine", "russia", "china", "iran", "iraq", "israel", "turkey",
      "egypt", "nigeria", "kenya", "south africa", "pakistan", "bangladesh",
      "thailand", "vietnam", "taiwan", "singapore", "malaysia", "myanmar",
      "cambodia", "sri lanka", "saudi", "qatar", "uae", "emirates",
      "uk", "britain", "england", "scotland", "ireland", "seoul",
    ];

    const wrongDCFallbacks = dcFallbacks.filter((r) => {
      const titleLower = r.title.toLowerCase();
      return foreignCountryKeywords.some((kw) => titleLower.includes(kw));
    });

    if (wrongDCFallbacks.length > 0) {
      console.log(`\n=== Obviously Wrong DC Fallbacks (${wrongDCFallbacks.length}) ===`);
      for (const r of wrongDCFallbacks) {
        console.log(`  [${r.id}] "${r.title}"`);
        console.log(`    tags: ${r.tags.join(", ")}`);
      }
    }

    // Expect this to fail until we fix the matching — documents the problem
    expect(wrongDCFallbacks.length).toBe(0);
  });

  it("should match events with country names in title to correct country", () => {
    // Find events that matched somewhere but might be wrong:
    // title says one country, but matched to a different one
    const countryTitlePatterns: [RegExp, string][] = [
      [/\bcolombia\b/i, "colombia"],
      [/\bbrazil\b/i, "brazil"],
      [/\bmexico\b/i, "mexico"],
      [/\bfrance\b/i, "france"],
      [/\bgermany\b/i, "germany"],
      [/\bindia\b/i, "india"],
      [/\bjapan\b/i, "japan"],
      [/\bsouth korea\b/i, "south-korea"],
      [/\bkorea\b/i, "south-korea"],
      [/\bnepal\b/i, "nepal"],
      [/\bcanada\b/i, "canada"],
      [/\baustralia\b/i, "australia"],
      [/\bisrael\b/i, "israel"],
      [/\biran\b/i, "iran"],
      [/\buk\b/i, "united-kingdom"],
      [/\bunited kingdom\b/i, "united-kingdom"],
    ];

    const normalize = (s: string) => s.replace(/ /g, "-");
    const mismatches: MatchResult[] = [];
    for (const r of results) {
      if (!r.matchedSlug) continue;
      const normalizedSlug = normalize(r.matchedSlug);
      for (const [regex, expectedSlug] of countryTitlePatterns) {
        if (regex.test(r.title) && normalizedSlug !== expectedSlug && !normalizedSlug.startsWith(`us-`)) {
          // Only flag if the matched slug doesn't contain the expected country
          if (!normalizedSlug.includes(expectedSlug)) {
            // Don't flag multi-country events where the matched country also appears in the title
            const matchedNameInTitle = r.title.toLowerCase().includes(normalizedSlug.replace(/-/g, " "));
            if (!matchedNameInTitle) {
              mismatches.push(r);
            }
            break;
          }
        }
      }
    }

    if (mismatches.length > 0) {
      console.log(`\n=== Country Mismatches (${mismatches.length}) ===`);
      for (const r of mismatches) {
        console.log(`  [${r.id}] "${r.title}" → ${r.matchedSlug}`);
      }
    }

    expect(mismatches.length).toBe(0);
  });
});
