"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
  type DockviewTheme,
} from "dockview";
import { useAllEvents } from "../hooks/useAllEvents";
import { PolymarketEvent } from "../lib/types";
import { buildGeoJSON, groupEventsByLocation } from "./geo";
import { MapPageContext, type MapPageContextValue } from "./MapPageContext";
import MapPanel from "./MapPanel";
import EventsPanel from "./EventsPanel";
import MarketPanel from "./MarketPanel";
import PositionsPanel from "./PositionsPanel";
import HeaderAccount from "./HeaderAccount";
import { MapPin, Calendar } from "lucide-react";

const THEME: DockviewTheme = {
  name: "omen",
  className: "dockview-theme-custom",
};

const COMPONENTS = {
  map: MapPanel,
  events: EventsPanel,
  market: MarketPanel,
  positions: PositionsPanel,
};

export default function MapPage() {
  const apiRef = useRef<DockviewApi | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [projection, setProjection] = useState<"mercator" | "globe">(() => {
    if (typeof window === "undefined") return "globe";
    const stored = localStorage.getItem("projection");
    return stored === "mercator" ? "mercator" : "globe";
  });

  useEffect(() => {
    const check = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, []);

  const toggleProjection = useCallback(() => {
    setProjection((p) => {
      const next = p === "mercator" ? "globe" : "mercator";
      localStorage.setItem("projection", next);
      return next;
    });
  }, []);

  const { events, loading } = useAllEvents({
    tagIds: ["100265", "2"],
    excludeTagIds: ["972"],
    closed: false,
  });
  const eventsByLocation = useMemo(
    () => groupEventsByLocation(events),
    [events]
  );
  const volume24hrByLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const [location, evts] of eventsByLocation) {
      m.set(
        location,
        evts.reduce((sum, e) => sum + (e.volume24hr || 0), 0)
      );
    }
    console.table(
      Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]))
    );
    return m;
  }, [eventsByLocation]);
  const mappedEventCount = useMemo(() => {
    let count = 0;
    for (const evts of eventsByLocation.values()) count += evts.length;
    return count;
  }, [eventsByLocation]);
  const geojson = useMemo(() => buildGeoJSON(events), [events]);

  // --- Panel management callbacks ---

  const onLocationSelect = useCallback(
    (location: string, _events: PolymarketEvent[]) => {
      const api = apiRef.current;
      if (!api) return;

      // Toggle: clicking same location closes the panel
      if (selectedLocation === location) {
        const panel = api.getPanel("events");
        if (panel) api.removePanel(panel);
        setSelectedLocation(null);
        return;
      }

      setSelectedLocation(location);

      const existing = api.getPanel("events");
      if (existing) {
        // Update params on existing panel
        existing.api.updateParameters({ location });
      } else {
        const positionsPanel = api.getPanel("positions");
        if (positionsPanel) {
          // Tab alongside the existing positions panel
          api.addPanel({
            id: "events",
            component: "events",
            title: "Events",
            params: { location },
            position: { referencePanel: "positions" },
          });
        } else {
          // Add new events panel docked to the right of map
          api.addPanel({
            id: "events",
            component: "events",
            title: "Events",
            params: { location },
            position: { referencePanel: "map", direction: "right" },
            initialWidth: 384,
          });
        }
      }
    },
    [selectedLocation]
  );

  const onLocationDeselect = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const panel = api.getPanel("events");
    if (panel) api.removePanel(panel);
    setSelectedLocation(null);
  }, []);

  const onMarket = useCallback(
    (conditionId: string, opts?: { outcomeIndex?: number; title?: string }) => {
      const api = apiRef.current;
      if (!api) return;

      // Remove existing market panel if any
      const existing = api.getPanel("market");
      if (existing) api.removePanel(existing);

      api.addPanel({
        id: "market",
        component: "market",
        title: opts?.title || "Market",
        params: { conditionId, outcomeIndex: opts?.outcomeIndex },
        floating: { width: 400, height: 640, x: 16, y: 16 },
      });
    },
    []
  );

  const onMarketClose = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const panel = api.getPanel("market");
    if (panel) api.removePanel(panel);
  }, []);

  const onPositionsToggle = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const existing = api.getPanel("positions");
    if (existing) {
      existing.api.setActive();
      return;
    }

    const eventsPanel = api.getPanel("events");
    if (eventsPanel) {
      api.addPanel({
        id: "positions",
        component: "positions",
        title: "Positions",
        position: { referencePanel: "events" },
      });
    } else {
      api.addPanel({
        id: "positions",
        component: "positions",
        title: "Positions",
        position: { referencePanel: "map", direction: "right" },
        initialWidth: 384,
      });
    }
  }, []);

  // --- Escape key closes active non-map panel ---

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const api = apiRef.current;
      if (!api) return;

      // Close floating market panel first, then active non-map panel
      const marketPanel = api.getPanel("market");
      if (marketPanel) {
        api.removePanel(marketPanel);
        return;
      }
      for (const group of api.groups) {
        if (group.activePanel && group.activePanel.id !== "map") {
          api.removePanel(group.activePanel);
          setSelectedLocation(null);
          return;
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);

  // --- Dockview ready ---

  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    apiRef.current = api;

    // Create the map panel (fills entire space initially)
    api.addPanel({
      id: "map",
      component: "map",
      title: "Map",
    });

    // Lock the map group so it can't be closed or receive drops
    const mapPanel = api.getPanel("map");
    if (mapPanel) {
      const group = mapPanel.group;
      if (group) {
        group.locked = "no-drop-target";
        group.header.hidden = true;
      }
    }

    // Allow tab reordering but block content/edge drop targets that split panes
    api.onWillShowOverlay((event) => {
      if (event.kind === "content" || event.kind === "edge") {
        event.preventDefault();
      }
    });

    // Sync state when panels are removed (e.g. user closes via tab X)
    api.onDidRemovePanel((panel) => {
      if (panel.id === "events") {
        setSelectedLocation(null);
      }
    });
  }, []);

  // --- Context value ---

  const contextValue = useMemo<MapPageContextValue>(
    () => ({
      geojson,
      eventsByLocation,
      volume24hrByLocation,
      selectedLocation,
      darkMode,
      projection,
      loading,
      onLocationSelect,
      onLocationDeselect,
      onMarket,
      onMarketClose,
      onPositionsToggle,
      toggleDarkMode,
      toggleProjection,
    }),
    [
      geojson,
      eventsByLocation,
      volume24hrByLocation,
      selectedLocation,
      darkMode,
      projection,
      loading,
      onLocationSelect,
      onLocationDeselect,
      onMarket,
      onMarketClose,
      onPositionsToggle,
      toggleDarkMode,
      toggleProjection,
    ]
  );

  return (
    <MapPageContext.Provider value={contextValue}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          className="relative z-[60] flex items-center justify-between px-5 border-b border-border bg-background"
          style={{ height: 48, flexShrink: 0 }}
        >
          <h1 className="text-lg font-semibold text-foreground">Omen</h1>
          <HeaderAccount />
        </header>

        <div style={{ flex: 1, position: "relative" }}>
          <DockviewReact
            className="dockview-theme-custom"
            components={COMPONENTS}
            onReady={onReady}
            theme={THEME}
          />
        </div>

        <footer
          className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-5 border-t border-border bg-background text-xs text-muted-foreground"
          style={{ height: 28 }}
        >
          <span className="flex items-center gap-3">
            <span className="hidden sm:inline">Powered by Polymarket</span>
            {!loading && (
              <>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {eventsByLocation.size}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {mappedEventCount}
                </span>
              </>
            )}
          </span>
          <span className="flex items-center gap-2">
            <a href="https://x.com/OmenTrading" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="mailto:support@omen.trading" className="hover:text-foreground">Support</a>
            <a href="https://omen.trading/terms" className="hover:text-foreground">Terms</a>
            <a href="https://omen.trading/privacy" className="hover:text-foreground">Privacy</a>
          </span>
        </footer>
      </div>
    </MapPageContext.Provider>
  );
}
