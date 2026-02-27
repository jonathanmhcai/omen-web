"use client";

import { useCallback, useMemo, useState } from "react";
import MapGL, { Source, Layer } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "react-map-gl/mapbox";
import type { GeoJSON } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAllEvents } from "../hooks/useAllEvents";
import countryCoordinates from "../lib/country-coordinates.json";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const coords = countryCoordinates as Record<string, { lat: number; lng: number }>;

export default function MapPage() {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 1.5,
  });
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; title: string } | null>(null);

  const { events, loading } = useAllEvents({ tagIds: ["100265"] });

  const geojson: GeoJSON = useMemo(() => {
    const features = events
      .map((e) => {
        const match = e.tags.find((t) => coords[t.slug]);
        if (!match) return null;
        const { lat, lng } = coords[match.slug];
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [lng, lat] },
          properties: { id: e.id, title: e.title, country: match.slug },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    return { type: "FeatureCollection" as const, features } as GeoJSON;
  }, [events]);

  const onMouseEnter = useCallback((e: MapMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;
    const props = feature.properties;
    const title = props?.cluster
      ? `${props.point_count} events`
      : props?.title ?? "";
    setHoverInfo({ x: e.point.x, y: e.point.y, title });
  }, []);

  const onMouseLeave = useCallback(() => setHoverInfo(null), []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div className="absolute top-0 left-0 z-50 p-4">
        <span className="font-semibold text-[#0f172a]" style={{ fontSize: "24px" }}>
          Omen
        </span>
      </div>
      <MapGL
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
        interactiveLayerIds={["clusters", "unclustered-point"]}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseEnter}
        onMouseLeave={onMouseLeave}
        cursor={hoverInfo ? "pointer" : "grab"}
      >
        <Source
          id="events"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Clustered circles */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#ef4444",
              "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 30],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />

          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />

          {/* Individual points */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": "#ef4444",
              "circle-radius": 7,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
        </Source>
      </MapGL>

      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-50 rounded bg-black/80 px-3 py-1.5 text-sm text-white shadow-lg"
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y - 12 }}
        >
          {hoverInfo.title}
        </div>
      )}
    </div>
  );
}
