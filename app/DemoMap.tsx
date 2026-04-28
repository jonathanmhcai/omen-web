"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type * as GeoJSON from "geojson";
import { useAllEvents } from "./hooks/useAllEvents";
import { buildGeoJSON } from "./map/geo";
import {
  getClusterLayers,
  getUnclusteredPointLayers,
} from "./map/layers";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) throw new Error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");

const EMPTY_GEOJSON: GeoJSON.GeoJSON = {
  type: "FeatureCollection",
  features: [],
};

export default function DemoMap() {
  const mapRef = useRef<MapRef>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 2.5,
  });

  useEffect(() => {
    const check = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.setProjection("globe");
  }, []);

  useEffect(() => {
    let frame: number;
    let prev = performance.now();
    const spin = (now: number) => {
      const dt = now - prev;
      prev = now;
      setViewState((vs) => ({ ...vs, longitude: vs.longitude + dt * 0.005 }));
      frame = requestAnimationFrame(spin);
    };
    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, []);

  const { events, loading } = useAllEvents({
    tagIds: ["100265", "2"],
    excludeTagIds: ["972"],
    closed: false,
  });

  const geojson = useMemo<GeoJSON.GeoJSON>(
    () => (events.length === 0 ? EMPTY_GEOJSON : buildGeoJSON(events)),
    [events]
  );

  // Continuous pulse for the cluster ping ring (matches MapPanel)
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

  // One-shot reveal ease-out when data first lands
  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    if (loading) return;
    const duration = 600;
    const start = performance.now();
    let frame: number;
    const animate = (now: number) => {
      const t = Math.max(0, Math.min((now - start) / duration, 1));
      setReveal(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [loading]);

  const mapStyle = darkMode
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  const clusterLayers = useMemo(() => getClusterLayers(pulse, reveal), [pulse, reveal]);
  const unclusteredPointLayers = useMemo(
    () => getUnclusteredPointLayers(null, pulse, reveal),
    [pulse, reveal]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={false}
        renderWorldCopies={true}
        minZoom={2.5}
      >
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
      </MapGL>
    </div>
  );
}
