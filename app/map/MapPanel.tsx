"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Source, Layer, Popup } from "react-map-gl/mapbox";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import type * as GeoJSON from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import type { IDockviewPanelProps } from "dockview";
import { useMapPageContext } from "./MapPageContext";
import {
  getIsoCode,
  getStateAbbr,
  getSlugByIso,
  getSlugByStateAbbr,
  getCoordinatesBySlug,
} from "./geo";
import {
  getClusterLayers,
  getUnclusteredPointLayers,
  getCountryFillLayer,
  getCountryLineLayer,
  getStateFillLayer,
  getStateLineLayer,
  getTradePingLayers,
  INTERACTIVE_LAYER_IDS,
} from "./layers";
import HoverTooltip from "./HoverTooltip";
import EventPopupCard from "./EventPopupCard";
import countryBoundaries from "../lib/country-boundaries.json";
import stateBoundaries from "../lib/us-state-boundaries.json";
import type { PolymarketEvent } from "../lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");

export default function MapPanel({ api }: IDockviewPanelProps) {
  const mapRef = useRef<MapRef>(null);
  const ctx = useMapPageContext();
  const {
    geojson,
    eventsByLocation,
    volume24hrByLocation,
    selectedLocation,
    darkMode,
    projection,
    loading,
    onLocationSelect,
    onLocationDeselect,
    tradePingsRef,
    flyToLocationRef,
  } = ctx;

  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const [viewState, setViewState] = useState({
    longitude: isMobile ? 35 : 0,
    latitude: isMobile ? 31 : 20,
    zoom: isMobile ? 1.8 : 2.5,
  });
  const [spinMode, setSpinMode] = useState(false);

  // Toggle spin mode via keyboard shortcut (custom event from page.tsx)
  useEffect(() => {
    const handler = () => setSpinMode((s) => !s);
    window.addEventListener("toggle-spin", handler);
    return () => window.removeEventListener("toggle-spin", handler);
  }, []);

  // Ease zoom out when entering spin mode
  useEffect(() => {
    if (!spinMode) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({ zoom: 2.5, duration: 1000 });
  }, [spinMode]);

  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    locations: string[];
    eventCount: number;
    volume24hr: number;
  } | null>(null);

  // --- Event popup (triggered from search) ---
  const [popupEvent, setPopupEvent] = useState<{
    event: PolymarketEvent;
    slug: string;
    lng: number;
    lat: number;
  } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { event: PolymarketEvent; slug: string };
      const coords = getCoordinatesBySlug(detail.slug);
      if (!coords) return;
      setPopupEvent({ event: detail.event, slug: detail.slug, lng: coords.lng, lat: coords.lat });
    };
    window.addEventListener("open-event-popup", handler);
    return () => window.removeEventListener("open-event-popup", handler);
  }, []);

  // Close popup via custom event (dispatched by Escape handler in page.tsx)
  useEffect(() => {
    const handler = () => setPopupEvent(null);
    window.addEventListener("close-event-popup", handler);
    return () => window.removeEventListener("close-event-popup", handler);
  }, []);

  // Resize map when dockview resizes the panel
  useEffect(() => {
    const disposable = api.onDidDimensionsChange(() => {
      mapRef.current?.resize();
    });
    return () => disposable.dispose();
  }, [api]);

  // Register flyToLocation so search can navigate the map
  useEffect(() => {
    flyToLocationRef.current = (slug: string) => {
      const coords = getCoordinatesBySlug(slug);
      if (!coords) return;
      const map = mapRef.current?.getMap();
      if (!map) return;
      setSpinMode(false);
      const zoom = slug.startsWith("us-") && slug !== "us-washington-dc" ? 5.5 : 4;
      map.flyTo({ center: [coords.lng, coords.lat], zoom, duration: 1500 });
    };
    return () => {
      flyToLocationRef.current = null;
    };
  }, [flyToLocationRef]);

  // Fly to selected location
  useEffect(() => {
    if (!selectedLocation) return;
    const coords = getCoordinatesBySlug(selectedLocation);
    if (!coords) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const zoom = selectedLocation.startsWith("us-") && selectedLocation !== "us-washington-dc" ? 5.5 : 4;
    map.flyTo({ center: [coords.lng, coords.lat], zoom, duration: 1500 });
  }, [selectedLocation]);

  // Trade ping animation — only runs when there are active pings
  const [pingTick, setPingTick] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      const now = Date.now();
      // Prune expired pings (>3s old)
      tradePingsRef.current = tradePingsRef.current.filter((p) => now - p.timestamp < 1200);
      // Only trigger re-render when there are active pings
      if (tradePingsRef.current.length > 0) {
        setPingTick(now);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [tradePingsRef]);

  const selectedIso = selectedLocation ? getIsoCode(selectedLocation) : null;
  const selectedStateAbbr = selectedLocation
    ? getStateAbbr(selectedLocation)
    : null;

  const tradePingData = useMemo(
    () => getTradePingLayers(tradePingsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pingTick]
  );

  // Pulse animation
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setPulse((Date.now() % 2000) / 2000);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Reveal animation — scale + fade circles in when loading finishes
  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    if (loading) return;
    const duration = 600;
    const start = performance.now();
    let frame: number;
    const animate = (now: number) => {
      const t = Math.max(0, Math.min((now - start) / duration, 1));
      // ease-out cubic
      setReveal(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [loading]);

  const clusterLayers = useMemo(() => getClusterLayers(pulse, reveal), [pulse, reveal]);
  const unclusteredPointLayers = useMemo(
    () => getUnclusteredPointLayers(selectedLocation, pulse, reveal),
    [selectedLocation, pulse, reveal]
  );
  const countryFillLayer = useMemo(
    () => getCountryFillLayer(selectedIso),
    [selectedIso]
  );
  const countryLineLayer = useMemo(
    () => getCountryLineLayer(selectedIso),
    [selectedIso]
  );
  const stateFillLayer = useMemo(
    () => getStateFillLayer(selectedStateAbbr),
    [selectedStateAbbr]
  );
  const stateLineLayer = useMemo(
    () => getStateLineLayer(selectedStateAbbr),
    [selectedStateAbbr]
  );

  const onClick = useCallback(
    (e: MapMouseEvent) => {
      setSpinMode(false);
      setPopupEvent(null);
      const feature = e.features?.[0];
      if (!feature) {
        onLocationDeselect();
        return;
      }

      const props = feature.properties;
      const map = mapRef.current?.getMap();

      if (props?.cluster && map) {
        const source = map.getSource("events") as mapboxgl.GeoJSONSource;
        const clusterId = props.cluster_id as number;

        source.getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
          if (err || !leaves) return;
          const dcLeaf = leaves.find(
            (l) => l.properties?.country === "us-washington-dc"
          );
          if (dcLeaf && eventsByLocation.has("us-washington-dc")) {
            onLocationSelect(
              "us-washington-dc",
              eventsByLocation.get("us-washington-dc")!
            );
            return;
          }

          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || zoom == null) return;

            if (zoom > 14) {
              const location = leaves[0]?.properties?.country;
              if (location && eventsByLocation.has(location)) {
                onLocationSelect(location, eventsByLocation.get(location)!);
              }
              return;
            }

            const geometry = feature.geometry as GeoJSON.Point;
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom,
            });
          });
        });
        return;
      }

      if (props?.country) {
        const events = eventsByLocation.get(props.country) ?? [];
        onLocationSelect(props.country, events);
        return;
      }

      const layerId = (feature as any).layer?.id;
      if (layerId === "country-fill" && props?.ISO_A2) {
        const slug = getSlugByIso(props.ISO_A2 as string);
        if (slug) {
          onLocationSelect(slug, eventsByLocation.get(slug) ?? []);
          return;
        }
      }

      if (layerId === "state-fill" && props?.STUSPS) {
        const slug = getSlugByStateAbbr(props.STUSPS as string);
        if (slug) {
          onLocationSelect(slug, eventsByLocation.get(slug) ?? []);
          return;
        }
      }
    },
    [eventsByLocation, onLocationSelect, onLocationDeselect]
  );

  const onHover = useCallback(
    (e: MapMouseEvent) => {
      if (isTouch) return;
      const feature = e.features?.[0];
      if (!feature) {
        setHoverInfo(null);
        return;
      }
      const props = feature.properties;
      const layerId = (feature as any).layer?.id;

      // Country/state fill hover
      if (layerId === "country-fill" && props?.ISO_A2) {
        const slug = getSlugByIso(props.ISO_A2 as string);
        if (slug) {
          setHoverInfo({
            x: e.point.x,
            y: e.point.y,
            locations: [slug],
            eventCount: eventsByLocation.get(slug)?.length ?? 0,
            volume24hr: volume24hrByLocation.get(slug) || 0,
          });
          return;
        }
      }
      if (layerId === "state-fill" && props?.STUSPS) {
        const slug = getSlugByStateAbbr(props.STUSPS as string);
        if (slug) {
          setHoverInfo({
            x: e.point.x,
            y: e.point.y,
            locations: [slug],
            eventCount: eventsByLocation.get(slug)?.length ?? 0,
            volume24hr: volume24hrByLocation.get(slug) || 0,
          });
          return;
        }
      }

      // Unclustered point hover
      if (!props?.cluster) {
        const location = props?.country;
        if (location && eventsByLocation.has(location)) {
          setHoverInfo({
            x: e.point.x,
            y: e.point.y,
            locations: [location],
            eventCount: eventsByLocation.get(location)!.length,
            volume24hr: volume24hrByLocation.get(location) || 0,
          });
        }
        return;
      }

      // Cluster hover
      const map = mapRef.current?.getMap();
      if (!map) return;
      const source = map.getSource("events") as mapboxgl.GeoJSONSource;
      source.getClusterLeaves(
        props.cluster_id as number,
        Infinity,
        0,
        (err, leaves) => {
          if (err || !leaves?.length) return;
          const locations = [
            ...new Set(
              leaves
                .map((l) => l.properties?.country as string)
                .filter(Boolean)
            ),
          ];
          if (!locations.length) return;
          const totalVolume = locations.reduce(
            (sum, loc) => sum + (volume24hrByLocation.get(loc) || 0),
            0
          );
          setHoverInfo({
            x: e.point.x,
            y: e.point.y,
            locations,
            eventCount: props.point_count as number,
            volume24hr: totalVolume,
          });
        }
      );
    },
    [isTouch, eventsByLocation, volume24hrByLocation]
  );

  const onMouseLeave = useCallback(() => setHoverInfo(null), []);

  const mapStyle = darkMode
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  // Set projection imperatively to avoid react-map-gl _calcMatrices recursion bug
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.setProjection(projection);
  }, [projection]);

  // Slowly spin the globe while loading or in spin mode
  useEffect(() => {
    if (!loading && !spinMode) return;
    let frame: number;
    let prev = performance.now();
    const spin = (now: number) => {
      const dt = now - prev;
      prev = now;
      setViewState((vs) => ({
        ...vs,
        longitude: vs.longitude + dt * 0.005,
      }));
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [loading, spinMode]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }} onMouseLeave={() => setHoverInfo(null)}>
      <MapGL
        ref={mapRef}
        {...viewState}
        onMoveStart={(evt) => {
          setHoverInfo(null);
          if (spinMode && (evt as any).originalEvent) setSpinMode(false);
        }}
        onMove={(evt) => {
          const vs = evt.viewState;
          setViewState({
            ...vs,
            latitude: Math.max(-70, Math.min(70, vs.latitude)),
          });
        }}
        minZoom={2.5}
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
          clusterProperties={{
            totalVolume24hr: ["+", ["get", "volume24hr"]],
          }}
        >
          {clusterLayers.map((layer) => (
            <Layer key={layer.id} {...layer} />
          ))}
          {unclusteredPointLayers.map((layer) => (
            <Layer key={layer.id} {...layer} />
          ))}
        </Source>

        <Source id="trade-pings" type="geojson" data={tradePingData.geojson}>
          {tradePingData.layers.map((layer) => (
            <Layer key={layer.id} {...layer} />
          ))}
        </Source>

        {popupEvent && (
          <Popup
            longitude={popupEvent.lng}
            latitude={popupEvent.lat}
            onClose={() => setPopupEvent(null)}
            closeOnClick={false}
            anchor="left"
            offset={[40, 0]}
            maxWidth="360px"
            className="event-popup"
          >
            <EventPopupCard
              event={popupEvent.event}
              slug={popupEvent.slug}
              onClose={() => setPopupEvent(null)}
            />
          </Popup>
        )}
      </MapGL>

      {hoverInfo && (
        <HoverTooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          locations={hoverInfo.locations}
          eventCount={hoverInfo.eventCount}
          volume24hr={hoverInfo.volume24hr}
        />
      )}

      {loading && (
        <div className="absolute inset-0 z-40 bg-background/50" />
      )}
    </div>
  );
}
