"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Source, Layer } from "react-map-gl/mapbox";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import type * as GeoJSON from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAllEvents } from "../hooks/useAllEvents";
import { PolymarketEvent, PolymarketMarket } from "../lib/types";
import { buildGeoJSON, groupEventsByLocation, getIsoCode, getStateAbbr, getSlugByIso, getSlugByStateAbbr } from "./geo";
import { getClusterLayers, getUnclusteredPointLayers, getCountryFillLayer, getCountryLineLayer, getStateFillLayer, getStateLineLayer, INTERACTIVE_LAYER_IDS } from "./layers";
import EventSidebar from "./EventSidebar";
import TradeModal from "./TradeModal";
import HoverTooltip from "./HoverTooltip";
import HeaderAccount from "./HeaderAccount";
import countryBoundaries from "../lib/country-boundaries.json";
import stateBoundaries from "../lib/us-state-boundaries.json";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");

interface SidebarData {
  location: string;
  events: PolymarketEvent[];
}

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.5,
  });
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; locations: string[]; eventCount: number; volume24hr: number } | null>(null);
  const [sidebar, setSidebar] = useState<SidebarData | null>(null);
  const [trade, setTrade] = useState<{ market: PolymarketMarket; outcomeIndex: number } | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const check = () => setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { events, loading } = useAllEvents({ tagIds: ["100265", "2"], excludeTagIds: ["972"], closed: false });
  const eventsByLocation = useMemo(() => groupEventsByLocation(events), [events]);
  const volume24hrByLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const [location, evts] of eventsByLocation) {
      m.set(location, evts.reduce((sum, e) => sum + (e.volume24hr || 0), 0));
    }
    console.table(Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1])));
    return m;
  }, [eventsByLocation]);
  const mappedEventCount = useMemo(() => {
    let count = 0;
    for (const evts of eventsByLocation.values()) count += evts.length;
    return count;
  }, [eventsByLocation]);
  const geojson = useMemo(() => buildGeoJSON(events), [events]);

  const selectedLocation = sidebar?.location ?? null;
  const selectedIso = selectedLocation ? getIsoCode(selectedLocation) : null;
  const selectedStateAbbr = selectedLocation ? getStateAbbr(selectedLocation) : null;
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setPulse(Date.now() % 2000 / 2000);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  const clusterLayers = useMemo(() => getClusterLayers(pulse), [pulse]);
  const unclusteredPointLayers = useMemo(() => getUnclusteredPointLayers(selectedLocation, pulse), [selectedLocation, pulse]);
  const countryFillLayer = useMemo(() => getCountryFillLayer(selectedIso), [selectedIso]);
  const countryLineLayer = useMemo(() => getCountryLineLayer(selectedIso), [selectedIso]);
  const stateFillLayer = useMemo(() => getStateFillLayer(selectedStateAbbr), [selectedStateAbbr]);
  const stateLineLayer = useMemo(() => getStateLineLayer(selectedStateAbbr), [selectedStateAbbr]);

  const toggleSidebar = useCallback((location: string, events: PolymarketEvent[]) => {
    setSidebar((prev) => prev?.location === location ? null : { location, events });
  }, []);

  const onClick = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) {
        setSidebar(null);
        return;
      }

      const props = feature.properties;
      const map = mapRef.current?.getMap();

      if (props?.cluster && map) {
        const source = map.getSource("events") as mapboxgl.GeoJSONSource;
        const clusterId = props.cluster_id as number;

        // Check if cluster contains DC events — if so, open DC sidebar directly
        source.getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
          if (err || !leaves) return;
          const dcLeaf = leaves.find((l) => l.properties?.country === "us-washington-dc");
          if (dcLeaf && eventsByLocation.has("us-washington-dc")) {
            toggleSidebar("us-washington-dc", eventsByLocation.get("us-washington-dc")!);
            return;
          }

          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom == null) return;

            if (zoom > 14) {
              const location = leaves[0]?.properties?.country;
              if (location && eventsByLocation.has(location)) {
                toggleSidebar(location, eventsByLocation.get(location)!);
              }
              return;
            }

            const geometry = feature.geometry as GeoJSON.Point;
            map.easeTo({ center: geometry.coordinates as [number, number], zoom });
          });
        });
        return;
      }

      // Unclustered event point
      if (props?.country && eventsByLocation.has(props.country)) {
        toggleSidebar(props.country, eventsByLocation.get(props.country)!);
        return;
      }

      // Country boundary click
      const layerId = (feature as any).layer?.id;
      if (layerId === "country-fill" && props?.ISO_A2) {
        const slug = getSlugByIso(props.ISO_A2 as string);
        if (slug) {
          toggleSidebar(slug, eventsByLocation.get(slug) ?? []);
          return;
        }
      }

      // State boundary click
      if (layerId === "state-fill" && props?.STUSPS) {
        const slug = getSlugByStateAbbr(props.STUSPS as string);
        if (slug) {
          toggleSidebar(slug, eventsByLocation.get(slug) ?? []);
          return;
        }
      }
    },
    [eventsByLocation, toggleSidebar],
  );

  const onHover = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setHoverInfo(null);
      return;
    }
    const props = feature.properties;

    // Individual point
    if (!props?.cluster) {
      const location = props?.country;
      if (location && eventsByLocation.has(location)) {
        setHoverInfo({ x: e.point.x, y: e.point.y, locations: [location], eventCount: eventsByLocation.get(location)!.length, volume24hr: volume24hrByLocation.get(location) || 0 });
      }
      return;
    }

    // Cluster — get all leaves to find unique locations
    const map = mapRef.current?.getMap();
    if (!map) return;
    const source = map.getSource("events") as mapboxgl.GeoJSONSource;
    source.getClusterLeaves(props.cluster_id as number, Infinity, 0, (err, leaves) => {
      if (err || !leaves?.length) return;
      const locations = [...new Set(leaves.map((l) => l.properties?.country as string).filter(Boolean))];
      if (!locations.length) return;
      const totalVolume = locations.reduce((sum, loc) => sum + (volume24hrByLocation.get(loc) || 0), 0);
      setHoverInfo({ x: e.point.x, y: e.point.y, locations, eventCount: props.point_count as number, volume24hr: totalVolume });
    });
  }, [eventsByLocation, volume24hrByLocation]);

  const onMouseLeave = useCallback(() => setHoverInfo(null), []);

  const mapStyle = darkMode
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="relative z-[60] flex items-center justify-between px-5 border-b border-border bg-background" style={{ height: 64, flexShrink: 0 }}>
        <span className="font-semibold text-foreground" style={{ fontSize: 20 }}>
          Omen
        </span>
        <HeaderAccount />
      </header>

      <div style={{ flex: 1, position: "relative" }}>
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={(evt) => {
          const vs = evt.viewState;
          setViewState({ ...vs, latitude: Math.max(-70, Math.min(70, vs.latitude)) });
        }}
        projection="mercator"
        minZoom={2}
        renderWorldCopies={true}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseMove={onHover}
        onMouseLeave={onMouseLeave}
        cursor={hoverInfo ? "pointer" : "grab"}
      >
        <Source
          id="country-boundaries"
          type="geojson"
          data={countryBoundaries as any}
        >
          <Layer {...countryFillLayer} />
          <Layer {...countryLineLayer} />
        </Source>

        <Source
          id="state-boundaries"
          type="geojson"
          data={stateBoundaries as any}
        >
          <Layer {...stateFillLayer} />
          <Layer {...stateLineLayer} />
        </Source>

        <Source
          id="events"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
          clusterProperties={{ totalVolume24hr: ["+", ["get", "volume24hr"]] }}
        >
          {clusterLayers.map((layer) => (
            <Layer key={layer.id} {...layer} />
          ))}
          {unclusteredPointLayers.map((layer) => (
            <Layer key={layer.id} {...layer} />
          ))}
        </Source>
      </MapGL>

      {hoverInfo && (
        <HoverTooltip x={hoverInfo.x} y={hoverInfo.y} locations={hoverInfo.locations} eventCount={hoverInfo.eventCount} volume24hr={hoverInfo.volume24hr} />
      )}

      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
        </div>
      )}

      {sidebar && (
        <EventSidebar
          location={sidebar.location}
          events={sidebar.events}
          onClose={() => setSidebar(null)}
          onTrade={(market, outcomeIndex) => setTrade({ market, outcomeIndex })}
        />
      )}

      {trade && (
        <TradeModal
          market={trade.market}
          outcomeIndex={trade.outcomeIndex}
          onClose={() => setTrade(null)}
        />
      )}

      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-5 border-t border-border bg-background text-xs text-muted-foreground" style={{ height: 28 }}>
        <span>Powered by Polymarket</span>
        {!loading && (
          <span>{eventsByLocation.size} locations &middot; {mappedEventCount} events</span>
        )}
      </footer>
    </div>
  );
}
