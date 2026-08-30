import type { GeographicCoordinates, CoarseLocation } from '@/types';

function roundCoarse(val: number): number {
  return Math.round(val * 100) / 100; // ~1km precision
}

export function getBrowserLocation(): Promise<GeographicCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: roundCoarse(pos.coords.latitude),
        longitude: roundCoarse(pos.coords.longitude),
      }),
      (err) => reject(err),
      { maximumAge: 5 * 60 * 1000, timeout: 10000, enableHighAccuracy: false }
    );
  });
}

export async function toCoarseLocation(coords: GeographicCoordinates): Promise<CoarseLocation> {
  const lat = roundCoarse(coords.latitude);
  const lon = roundCoarse(coords.longitude);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'GeoAlert/2.0' } }
    );
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village,
      region: data.address?.state || data.address?.county || '',
      country: data.address?.country_code?.toUpperCase() || 'US',
    };
  } catch {
    return { region: `${lat},${lon}`, country: 'US' };
  }
}

export function clearLocationData(): void {
  try {
    localStorage.removeItem('geoalert-location');
    sessionStorage.removeItem('geoalert-location');
  } catch {}
}

export function saveCoarseLocation(loc: CoarseLocation): void {
  try { localStorage.setItem('geoalert-location', JSON.stringify(loc)); } catch {}
}

export function loadSavedLocation(): CoarseLocation | null {
  try {
    const v = localStorage.getItem('geoalert-location');
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
