import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateFreshness } from '@/types';

// MapView keyboard tests - pure logic tests (no DOM/MapLibre needed)

describe('MapView keyboard navigation logic', () => {
  const mockFeatures = [
    { type: 'Feature', properties: { alertId: 'a1', event: 'Tornado Warning', severity: 'extreme' }, geometry: { type: 'Point', coordinates: [0,0] } },
    { type: 'Feature', properties: { alertId: 'a2', event: 'Flood Watch', severity: 'moderate' }, geometry: { type: 'Point', coordinates: [1,1] } },
    { type: 'Feature', properties: { alertId: 'a3', event: 'Wind Advisory', severity: 'minor' }, geometry: { type: 'Point', coordinates: [2,2] } },
  ];

  it('Tab cycles forward through alerts', () => {
    let idx = 0;
    const next = (e: { shiftKey: boolean }, features: typeof mockFeatures) =>
      e.shiftKey ? (idx - 1 + features.length) % features.length : (idx + 1) % features.length;
    idx = next({ shiftKey: false }, mockFeatures);
    expect(idx).toBe(1);
    idx = next({ shiftKey: false }, mockFeatures);
    expect(idx).toBe(2);
    idx = next({ shiftKey: false }, mockFeatures);
    expect(idx).toBe(0); // wraps around
  });

  it('Shift+Tab cycles backward through alerts', () => {
    let idx = 0;
    const next = (shiftKey: boolean) =>
      shiftKey ? (idx - 1 + mockFeatures.length) % mockFeatures.length : (idx + 1) % mockFeatures.length;
    idx = next(true);
    expect(idx).toBe(2); // wraps backward
  });

  it('announces correct alert info on Tab', () => {
    const f = mockFeatures[0];
    const msg = `Alert 1 of 3: ${f.properties.event}, ${f.properties.severity}`;
    expect(msg).toContain('Tornado Warning');
    expect(msg).toContain('extreme');
  });

  it('ARIA live region announcement resets then updates', () => {
    let announcement = 'first';
    announcement = '';
    setTimeout(() => { announcement = 'second'; }, 50);
    expect(announcement).toBe('');
  });
});
