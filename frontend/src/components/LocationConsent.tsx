'use client';
import React, { useState, useEffect } from 'react';
import { getBrowserLocation, toCoarseLocation, saveCoarseLocation } from '@/lib/location';
import type { CoarseLocation } from '@/types';

interface LocationConsentProps {
  onConsent: (location: CoarseLocation | null) => void;
}

export function LocationConsent({ onConsent }: LocationConsentProps) {
  const [visible, setVisible] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hasConsent = localStorage.getItem('geoalert-location-consent');
    if (!hasConsent) setVisible(true);
  }, []);

  const handleApproximate = async () => {
    setLoading(true); setError('');
    try {
      const coords = await getBrowserLocation();
      const loc = await toCoarseLocation(coords);
      saveCoarseLocation(loc);
      localStorage.setItem('geoalert-location-consent', 'approximate');
      onConsent(loc);
      setVisible(false);
    } catch { setError('Could not get location. Please try again or enter manually.'); }
    finally { setLoading(false); }
  };

  const handleManual = async () => {
    if (!manualInput.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualInput)}&format=json&limit=1`, { headers: { 'User-Agent': 'GeoAlert/2.0' } });
      const data = await res.json();
      if (!data.length) { setError('Location not found. Try a city name.'); setLoading(false); return; }
      const loc: CoarseLocation = { city: data[0].display_name.split(',')[0], region: data[0].display_name.split(',')[1]?.trim() || '', country: 'US' };
      saveCoarseLocation(loc);
      localStorage.setItem('geoalert-location-consent', 'manual');
      onConsent(loc);
      setVisible(false);
    } catch { setError('Search failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSkip = () => {
    localStorage.setItem('geoalert-location-consent', 'skipped');
    onConsent(null); setVisible(false);
  };

  if (!visible) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="consent-title"
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}>
      <div style={{ background:'#fff',borderRadius:'12px',padding:'24px',maxWidth:'480px',width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
        <h2 id="consent-title" style={{ fontSize:'1.25rem',fontWeight:700,marginBottom:'12px' }}>Location Access</h2>
        <p style={{ fontSize:'0.9rem',color:'#374151',marginBottom:'16px' }}>GeoAlert uses your approximate location (±1km) to show nearby alerts. We never store precise GPS coordinates.</p>
        {error && <p role="alert" style={{ color:'#b91c1c',fontSize:'0.85rem',marginBottom:'12px' }}>{error}</p>}
        <div style={{ display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px' }}>
          <button onClick={handleApproximate} disabled={loading} style={{ padding:'12px',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:600,minHeight:'44px' }}>
            {loading ? 'Getting location...' : 'Use approximate location'}
          </button>
          <div style={{ display:'flex',gap:'8px' }}>
            <input type="text" value={manualInput} onChange={e=>setManualInput(e.target.value)} placeholder="Enter city name..." style={{ flex:1,padding:'10px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'0.9rem',minHeight:'44px' }} onKeyDown={e=>e.key==='Enter'&&handleManual()} aria-label="Enter city name manually" />
            <button onClick={handleManual} disabled={loading||!manualInput.trim()} style={{ padding:'10px 16px',background:'#374151',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:600,minHeight:'44px' }}>Search</button>
          </div>
          <button onClick={handleSkip} style={{ padding:'12px',background:'transparent',color:'#6b7280',border:'1px solid #d1d5db',borderRadius:'6px',cursor:'pointer',minHeight:'44px' }}>Continue without location</button>
        </div>
        <p style={{ fontSize:'0.75rem',color:'#9ca3af' }}>View our <a href="/privacy" style={{ color:'#1d4ed8' }}>privacy policy</a> to learn how location data is used.</p>
      </div>
    </div>
  );
}
export default LocationConsent;
