'use client';

import React, { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { AlertFeatureCollection, GeographicCoordinates, Severity } from '@/types';

interface MapViewProps {
  alerts: AlertFeatureCollection;
  userLocation?: GeographicCoordinates;
  selectedAlertId?: string;
  onAlertSelect: (alertId: string) => void;
  offlineMode?: boolean;
}

const SEV_COLORS: Record<Severity, string> = {
  extreme: '#dc2626', severe: '#ea580c', moderate: '#ca8a04', minor: '#16a34a',
};

export function MapView({ alerts, userLocation, selectedAlertId, onAlertSelect, offlineMode = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<'pan' | 'keyboard-navigate'>('pan');
  const [focusIdx, setFocusIdx] = useState(0);
  const [announce, setAnnounce] = useState('');
  const features = alerts.features;

  const say = useCallback((msg: string) => {
    setAnnounce('');
    setTimeout(() => setAnnounce(msg), 50);
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let m: unknown;
    (async () => {
      const ml = await import('maplibre-gl');
      m = new ml.Map({
        container: containerRef.current!,
        style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: 'OpenStreetMap' } }, layers: [{ id: 'osm', type: 'raster', source: 'osm' }] },
        center: userLocation ? [userLocation.longitude, userLocation.latitude] : [-98.58, 39.83],
        zoom: 4, keyboard: true,
      });
      mapRef.current = m;
      (m as any).on('load', () => {
        setLoaded(true);
        (m as any).addSource('alerts', { type: 'geojson', data: alerts });
        (m as any).addLayer({ id: 'alert-fills', type: 'fill', source: 'alerts',
          paint: { 'fill-color': ['match',['get','severity'],'extreme',SEV_COLORS.extreme,'severe',SEV_COLORS.severe,'moderate',SEV_COLORS.moderate,'minor',SEV_COLORS.minor,'#9ca3af'], 'fill-opacity': 0.35 } });
        (m as any).addLayer({ id: 'alert-lines', type: 'line', source: 'alerts',
          paint: { 'line-color': ['match',['get','severity'],'extreme',SEV_COLORS.extreme,'severe',SEV_COLORS.severe,'moderate',SEV_COLORS.moderate,'minor',SEV_COLORS.minor,'#9ca3af'], 'line-width': 2 } });
        (m as any).on('click', 'alert-fills', (e: any) => {
          const id = e.features?.[0]?.properties?.alertId;
          if (id) onAlertSelect(id);
        });
      });
    })();
    return () => { (m as any)?.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (mapRef.current && loaded) {
      const src = (mapRef.current as any).getSource('alerts');
      if (src) src.setData(alerts);
    }
  }, [alerts, loaded]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const m = mapRef.current as any;
    if (!m) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); m.panBy([-50,0]); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); m.panBy([50,0]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); m.panBy([0,-50]); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); m.panBy([0,50]); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); m.zoomIn(); }
    else if (e.key === '-') { e.preventDefault(); m.zoomOut(); }
    else if (e.key === 'Tab' && features.length > 0) {
      e.preventDefault(); setMode('keyboard-navigate');
      const next = e.shiftKey ? (focusIdx-1+features.length)%features.length : (focusIdx+1)%features.length;
      setFocusIdx(next);
      const f = features[next];
      if (f.properties?.alertId) { onAlertSelect(f.properties.alertId); say(`Alert ${next+1} of ${features.length}: ${f.properties.event ?? 'Alert'}, ${f.properties.severity ?? ''}`); }
    } else if (e.key === 'Escape') { setMode('pan'); say('Map pan mode'); }
  }, [features, focusIdx, onAlertSelect, say]);

  return (
    <div style={{ position:'relative',width:'100%',height:'100%' }}>
      <div role='status' aria-live='polite' aria-atomic='true'
           style={{ position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)' }}>
        {announce}
      </div>
      {mode === 'keyboard-navigate' && (
        <div role='status' style={{ position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',background:'#1e3a5f',color:'#fff',padding:'4px 12px',borderRadius:'4px',fontSize:'0.75rem',zIndex:10,pointerEvents:'none' }}>
          Keyboard mode â€” Tab cycles alerts, Esc to exit
        </div>
      )}
      {offlineMode && (
        <div role='status' style={{ position:'absolute',bottom:8,left:8,background:'#b45309',color:'#fff',padding:'4px 10px',borderRadius:'4px',fontSize:'0.75rem',zIndex:10 }}>
          Offline - cached data
        </div>
      )}
      <ul role='listbox' aria-label='Alerts on map'
          style={{ position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)' }}>
        {features.map((f, i) => (
          <li key={f.properties?.alertId ?? i} role='option'
              aria-selected={f.properties?.alertId === selectedAlertId}
              id={`ma-${f.properties?.alertId}`}>
            {f.properties?.event ?? 'Alert'} - {f.properties?.severity ?? ''}
          </li>
        ))}
      </ul>
      <div ref={containerRef} role='application'
           aria-label='Interactive alert map. Arrow keys pan, plus/minus zoom, Tab cycles alerts.'
           tabIndex={0} onKeyDown={handleKey}
           aria-activedescendant={
             mode === 'keyboard-navigate' && features[focusIdx]
               ? `ma-${features[focusIdx].properties?.alertId}`
               : undefined
           }
           style={{ width:'100%',height:'100%',outline:'none' }}
      />
    </div>
  );
}

export default MapView;
