"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
  type DockviewTheme,
} from "dockview";
import { useAllEvents } from "./hooks/useAllEvents";
import type * as GeoJSON from "geojson";
import { PolymarketEvent } from "./lib/types";
import { buildGeoJSON, groupEventsByLocation } from "./map/geo";
import { MapPageContext, type MapPageContextValue } from "./map/MapPageContext";
import type { TradePing } from "./map/layers";
import MapPanel from "./map/MapPanel";
import EventsPanel from "./map/EventsPanel";
import MarketPanel from "./map/MarketPanel";
import PositionsPanel from "./map/PositionsPanel";
import LiveTradesPanel from "./map/LiveTradesPanel";
import HotMarketsPanel from "./map/HotMarketsPanel";
import HeaderAccount from "./map/HeaderAccount";
import { MapPin, Calendar, Users } from "lucide-react";
import { useLiveUserCount } from "./hooks/useLiveUserCount";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const THEME: DockviewTheme = {
  name: "omen",
  className: "dockview-theme-custom",
};

const COMPONENTS = {
  map: MapPanel,
  events: EventsPanel,
  market: MarketPanel,
  positions: PositionsPanel,
  liveTrades: LiveTradesPanel,
  hotMarkets: HotMarketsPanel,
};

export default function MapPage() {
  const apiRef = useRef<DockviewApi | null>(null);
  const tradePingsRef = useRef<TradePing[]>([]);
  const flyToLocationRef = useRef<((slug: string) => void) | null>(null);
  const addTradePing = useCallback((lat: number, lng: number, usdValue: number) => {
    tradePingsRef.current.push({ lat, lng, usdValue, timestamp: Date.now() });
  }, []);
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

  const liveUserCount = useLiveUserCount();

  const { events, loading } = useAllEvents({
    tagIds: ["100265", "2"],
    excludeTagIds: ["972"],
    closed: false,
  });
  const emptyEventsByLocation = useMemo(() => new Map<string, PolymarketEvent[]>(), []);
  const [eventsByLocation, setEventsByLocation] = useState<Map<string, PolymarketEvent[]>>(emptyEventsByLocation);
  const emptyGeojson = useMemo<GeoJSON.GeoJSON>(() => ({ type: "FeatureCollection" as const, features: [] }), []);
  const [geojson, setGeojson] = useState<GeoJSON.GeoJSON>(emptyGeojson);
  // Defer heavy groupEventsByLocation + buildGeoJSON off the critical render path.
  // Double-rAF gives the flyTo animation one clean frame before computation starts.
  // groupEventsByLocation runs first to populate the matchLocation cache,
  // then buildGeoJSON hits the cache. startTransition lets React yield during the
  // resulting re-render so the flyTo animation stays smooth.
  useEffect(() => {
    if (events.length === 0) {
      setEventsByLocation(emptyEventsByLocation);
      setGeojson(emptyGeojson);
      return;
    }
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        const grouped = groupEventsByLocation(events);
        const geo = buildGeoJSON(events);
        startTransition(() => {
          setEventsByLocation(grouped);
          setGeojson(geo);
        });
      });
    });
    return () => { cancelled = true; };
  }, [events, emptyEventsByLocation, emptyGeojson]);
  const volume24hrByLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const [location, evts] of eventsByLocation) {
      m.set(
        location,
        evts.reduce((sum, e) => sum + (e.volume24hr || 0), 0)
      );
    }
    // console.table(
    //   Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]))
    // );
    return m;
  }, [eventsByLocation]);
  const mappedEventCount = useMemo(() => {
    let count = 0;
    for (const evts of eventsByLocation.values()) count += evts.length;
    return count;
  }, [eventsByLocation]);

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
        const sibling = api.getPanel("positions");
        if (sibling) {
          api.addPanel({
            id: "events",
            component: "events",
            title: "Events",
            params: { location },
            position: { referencePanel: sibling.id },
          });
        } else {
          api.addPanel({
            id: "events",
            component: "events",
            title: "Events",
            params: { location },
            position: { referencePanel: "map", direction: "right" },
            initialWidth: window.innerWidth < 640 ? 260 : 384,
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
        floating: { width: 400, height: 640, x: 60, y: 60 },
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
      api.removePanel(existing);
      return;
    }

    const sibling = api.getPanel("events");
    if (sibling) {
      api.addPanel({
        id: "positions",
        component: "positions",
        title: "Positions",
        position: { referencePanel: sibling.id },
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

  const onLiveTradesToggle = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const existing = api.getPanel("liveTrades");
    if (existing) {
      api.removePanel(existing);
      return;
    }

    const isMobile = window.innerWidth < 640;
    api.addPanel({
      id: "liveTrades",
      component: "liveTrades",
      title: "Pulse",
      floating: isMobile
        ? { width: window.innerWidth - 32, height: 260, x: 16, y: window.innerHeight - 260 - 28 - 48 - 16 }
        : { width: 384, height: 600, x: 16, y: 16 },
    });
  }, []);

  const onHotMarketsToggle = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const existing = api.getPanel("hotMarkets");
    if (existing) {
      api.removePanel(existing);
      return;
    }

    const isMobile = window.innerWidth < 640;
    api.addPanel({
      id: "hotMarkets",
      component: "hotMarkets",
      title: "Trending Events",
      floating: isMobile
        ? { width: window.innerWidth - 32, height: 260, x: 16, y: window.innerHeight - 260 - 28 - 48 - 16 }
        : { width: 560, height: 600, x: 16, y: 16 },
    });
  }, []);

  // --- Keyboard shortcuts ---

  const closeActivePanel = useCallback(() => {
    // Let search modal and Radix dialogs handle their own Escape
    if (document.querySelector("[data-search-modal]")) return false;
    if (document.querySelector("[role=dialog]")) return false;

    const api = apiRef.current;
    if (!api) return false;

    const marketPanel = api.getPanel("market");
    if (marketPanel) {
      api.removePanel(marketPanel);
      return;
    }

    // Close event popup if open
    if (document.querySelector(".event-popup")) {
      window.dispatchEvent(new Event("close-event-popup"));
      return;
    }
    for (const group of api.groups) {
      if (group.activePanel && group.activePanel.id !== "map") {
        api.removePanel(group.activePanel);
        setSelectedLocation(null);
        return;
      }
    }
  }, []);

  useKeyboardShortcuts([
    { key: "Escape", action: closeActivePanel, allowInInput: true },
    { key: "/", action: () => window.dispatchEvent(new Event("open-search")) },
    { key: "p", action: onPositionsToggle },
    { key: "s", action: () => window.dispatchEvent(new Event("toggle-spin")) },
    { key: "t", action: onHotMarketsToggle },
    { key: "d", action: () => window.dispatchEvent(new Event("open-deposit")) },
    { key: "w", action: () => window.dispatchEvent(new Event("open-withdraw")) },
  ]);

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

  // --- Auto-select highest-volume location on first load ---

  const didAutoFly = useRef(false);
  const didAutoPanel = useRef(false);
  const autoSlug = "iran";

  // Effect A (camera): fly immediately when loading finishes — no data dependency
  useEffect(() => {
    if (didAutoFly.current || loading) return;
    if (window.innerWidth < 640) return;
    didAutoFly.current = true;
    if (flyToLocationRef.current) {
      flyToLocationRef.current(autoSlug);
    }
  }, [loading]);

  // Effect B (panel): open events panel once data is ready
  useEffect(() => {
    if (didAutoPanel.current || loading || !apiRef.current) return;
    if (eventsByLocation.size === 0) return;
    if (window.innerWidth < 640) return;
    didAutoPanel.current = true;
    const events = eventsByLocation.get(autoSlug) ?? [];
    onLocationSelect(autoSlug, events);
  }, [loading, eventsByLocation, onLocationSelect]);

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
      onLiveTradesToggle,
      onHotMarketsToggle,
      addTradePing,
      tradePingsRef,
      flyToLocationRef,
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
      onLiveTradesToggle,
      onHotMarketsToggle,
      addTradePing,
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
          overflow: "hidden",
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
          className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-5 border-t border-border bg-background text-xs text-muted-foreground/50"
          style={{ height: 28 }}
        >
          <span className="flex items-center gap-3">
            <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="hidden sm:inline hover:text-muted-foreground">Powered by Polymarket</a>
            {!loading && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {eventsByLocation.size}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Locations with active markets</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {mappedEventCount}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">Total mapped events</TooltipContent>
                </Tooltip>
              </>
            )}
            {liveUserCount !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {liveUserCount} online
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Users currently on the site</TooltipContent>
              </Tooltip>
            )}
          </span>
          <span className="flex items-center gap-2">
            <a href="https://x.com/OmenTrading" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="mailto:support@omen.trading" className="hover:text-muted-foreground">Support</a>
            <a href="https://omen.trading/terms" className="hover:text-muted-foreground">Terms</a>
            <a href="https://omen.trading/privacy" className="hover:text-muted-foreground">Privacy</a>
          </span>
        </footer>
      </div>
    </MapPageContext.Provider>
  );
}
