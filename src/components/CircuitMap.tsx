import { useEffect, useRef, useState } from 'react';
import { LngLatBounds, Map, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CIRCUIT_COORDINATES } from '../data/circuitCoordinates';
import { TRACK_PATHS, TRACK_VIEWBOX } from '../data/trackPaths';
import type { Race } from '../data/races';
import type { FeatureCollection, LineString } from 'geojson';

setWorkerUrl(mapLibreWorkerUrl);

export default function CircuitMap({ race }: { race: Race }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const coordinates = CIRCUIT_COORDINATES[race.Circuit.circuitId || ''];
  const lat = Number(race.Circuit.Location.lat);
  const lon = Number(race.Circuit.Location.long);

  useEffect(() => {
    if (!container.current) return;
    let map: Map;
    try {
      map = new Map({
        container: container.current,
        style: 'https://tiles.openfreemap.org/styles/fiord',
        center: [0, 0],
        zoom: 2,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      // WebGL can be unavailable on older devices or disabled by the browser.
      const frame = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(frame);
    }
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
    map.on('load', () => { setReady(true); setFailed(false); });
    map.on('error', () => { if (!map.isStyleLoaded()) setFailed(true); });
    map.on('webglcontextlost', () => setFailed(true));
    map.on('webglcontextrestored', () => { map.resize(); setFailed(false); });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const data: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: coordinates ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }] : [],
    };
    const source = map.getSource('circuit') as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else {
      map.addSource('circuit', { type: 'geojson', data });
      map.addLayer({ id: 'circuit-shadow', type: 'line', source: 'circuit', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#080c16', 'line-width': 12 } });
      map.addLayer({ id: 'circuit-line', type: 'line', source: 'circuit', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#b56bfa', 'line-width': 6 } });
    }
    const fit = (duration: number) => {
      const mobile = map.getContainer().clientWidth < 700;
      if (coordinates?.length) {
        const bounds = coordinates.reduce((bounds, point) => bounds.extend(point), new LngLatBounds(coordinates[0], coordinates[0]));
        map.fitBounds(bounds, { padding: { top: mobile ? 150 : 125, bottom: 65, left: mobile ? 35 : 100, right: mobile ? 35 : 100 }, maxZoom: 15.5, duration });
      } else if (Number.isFinite(lat) && Number.isFinite(lon)) {
        map.easeTo({ center: [lon, lat], zoom: 13, duration });
      }
    };
    fit(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850);
    const resize = () => fit(0);
    map.on('resize', resize);
    return () => { map.off('resize', resize); };
  }, [coordinates, lat, lon, ready]);

  return <>
    <div ref={container} className="schedule-vector-map" role="region" aria-label={`Interactive map of ${race.Circuit.circuitName}`} />
    {(!ready || failed) && <>
      <div className="schedule-map-track" aria-hidden="true">
        <svg viewBox={TRACK_VIEWBOX} fill="none">
          <path className="schedule-map-track-shadow" d={TRACK_PATHS[race.Circuit.circuitId || '']} vectorEffect="non-scaling-stroke" />
          <path className="schedule-map-track-line" d={TRACK_PATHS[race.Circuit.circuitId || '']} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <span className="schedule-map-status" role="status">{failed ? 'Map unavailable · circuit outline shown' : 'Loading circuit map…'}</span>
    </>}
  </>;
}
