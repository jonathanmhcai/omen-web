"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import MapGL, { Source, Layer } from "react-map-gl/mapbox";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import type * as GeoJSON from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAllEvents } from "../hooks/useAllEvents";
import { PolymarketEvent } from "../lib/types";
import { buildGeoJSON, groupEventsByCountry, getIsoCode } from "./geo";
import { getClusterLayer, getClusterCountLayer, getUnclusteredPointLayer, getCountryFillLayer, getCountryLineLayer, INTERACTIVE_LAYER_IDS } from "./layers";
import EventSidebar from "./EventSidebar";
import HoverTooltip from "./HoverTooltip";
import countryBoundaries from "../lib/country-boundaries.json";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");

interface SidebarData {
  country: string;
  events: PolymarketEvent[];
}

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.5,
  });
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; country: string; eventCount: number } | null>(null);
  const [sidebar, setSidebar] = useState<SidebarData | null>(null);

  const { events: allEvents } = useAllEvents({ tagIds: ["100265"] });
  const events = useMemo(() => allEvents.filter((e) => !e.closed), [allEvents]);
  const eventsByCountry = useMemo(() => groupEventsByCountry(events), [events]);
  const geojson = useMemo(() => buildGeoJSON(events), [events]);

  const selectedCountry = sidebar?.country ?? null;
  const selectedIso = selectedCountry ? getIsoCode(selectedCountry) : null;
  const clusterLayer = useMemo(() => getClusterLayer(), []);
  const clusterCountLayer = useMemo(() => getClusterCountLayer(), []);
  const unclusteredPointLayer = useMemo(() => getUnclusteredPointLayer(selectedCountry), [selectedCountry]);
  const countryFillLayer = useMemo(() => getCountryFillLayer(selectedIso), [selectedIso]);
  const countryLineLayer = useMemo(() => getCountryLineLayer(selectedIso), [selectedIso]);

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

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;

          if (zoom > 14) {
            source.getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
              if (err || !leaves) return;
              const country = leaves[0]?.properties?.country;
              if (country && eventsByCountry.has(country)) {
                setSidebar({ country, events: eventsByCountry.get(country)! });
              }
            });
            return;
          }

          const geometry = feature.geometry as GeoJSON.Point;
          map.easeTo({ center: geometry.coordinates as [number, number], zoom });
        });
        return;
      }

      if (props?.country && eventsByCountry.has(props.country)) {
        setSidebar({ country: props.country, events: eventsByCountry.get(props.country)! });
      }
    },
    [eventsByCountry],
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
      const country = props?.country;
      if (country && eventsByCountry.has(country)) {
        setHoverInfo({ x: e.point.x, y: e.point.y, country, eventCount: eventsByCountry.get(country)!.length });
      }
      return;
    }

    // Cluster — get a leaf to find the country
    const map = mapRef.current?.getMap();
    if (!map) return;
    const source = map.getSource("events") as mapboxgl.GeoJSONSource;
    source.getClusterLeaves(props.cluster_id as number, 1, 0, (err, leaves) => {
      if (err || !leaves?.length) return;
      const country = leaves[0]?.properties?.country;
      if (country && eventsByCountry.has(country)) {
        setHoverInfo({ x: e.point.x, y: e.point.y, country, eventCount: props.point_count as number });
      }
    });
  }, [eventsByCountry]);

  const onMouseLeave = useCallback(() => setHoverInfo(null), []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div className="absolute top-0 left-0 z-50 p-4">
        <span className="font-semibold text-[#0f172a]" style={{ fontSize: "24px" }}>
          Omen
        </span>
      </div>

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
        mapStyle="mapbox://styles/mapbox/light-v11"
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
          id="events"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
      </MapGL>

      {hoverInfo && (
        <HoverTooltip x={hoverInfo.x} y={hoverInfo.y} country={hoverInfo.country} eventCount={hoverInfo.eventCount} />
      )}

      {sidebar && (
        <EventSidebar
          country={sidebar.country}
          events={sidebar.events}
          onClose={() => setSidebar(null)}
        />
      )}
    </div>
  );
}
