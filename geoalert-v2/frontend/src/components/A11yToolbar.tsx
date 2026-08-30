'use client';
import React, { useState, useEffect } from 'react';
import type { AccessibilityPreferences } from '@/types';

const DEFAULT_PREFS: AccessibilityPreferences = {
  highContrast: false,
  textScale: 100,
  screenReaderOptimized: false,
  reducedMotion: false,
};

const STORAGE_KEY = 'geoalert-a11y-prefs';

export function useA11yPreferences() {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_PREFS);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const update = (next: AccessibilityPreferences) => {
    setPrefs(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    const html = document.documentElement;
    html.style.setProperty('--text-scale', `${next.textScale / 100}`);
    html.style.setProperty('--color-scheme', next.highContrast ? 'high-contrast' : 'normal');
    if (next.reducedMotion) {
      html.style.setProperty('--motion', 'none');
    } else {
      html.style.removeProperty('--motion');
    }
  };
  return { prefs, update };
}

interface A11yToolbarProps {
  preferences: AccessibilityPreferences;
  onPreferencesChange: (p: AccessibilityPreferences) => void;
}

export function A11yToolbar({ preferences, onPreferencesChange }: A11yToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        aria-label="Accessibility settings"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        style={{ padding: '8px 12px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', minHeight: '44px', minWidth: '44px' }}
      >
        ♿ A11y
      </button>
      {open && (
        <div role="dialog" aria-label="Accessibility settings"
          style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,.15)', minWidth: '280px', zIndex: 100 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#111827' }}>Accessibility Settings</h2>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={preferences.highContrast}
              onChange={e => onPreferencesChange({ ...preferences, highContrast: e.target.checked })}
              style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '0.9rem' }}>High contrast mode</span>
          </label>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="text-scale" style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
              Text size: {preferences.textScale}%
            </label>
            <select id="text-scale" value={preferences.textScale}
              onChange={e => onPreferencesChange({ ...preferences, textScale: Number(e.target.value) as AccessibilityPreferences['textScale'] })}
              style={{ width: '100%', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.9rem', minHeight: '44px' }}>
              {([100, 150, 200, 300, 400] as const).map(s => <option key={s} value={s}>{s}%</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
            <input type="checkbox" checked={preferences.screenReaderOptimized}
              onChange={e => onPreferencesChange({ ...preferences, screenReaderOptimized: e.target.checked })}
              style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '0.9rem' }}>Screen reader optimized</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={preferences.reducedMotion}
              onChange={e => onPreferencesChange({ ...preferences, reducedMotion: e.target.checked })}
              style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '0.9rem' }}>Reduce motion</span>
          </label>

          <button onClick={() => setOpen(false)} aria-label="Close accessibility settings"
            style={{ marginTop: '16px', width: '100%', padding: '8px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, minHeight: '44px' }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
export default A11yToolbar;
