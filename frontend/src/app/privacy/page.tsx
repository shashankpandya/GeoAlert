'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    try {
      localStorage.removeItem('geoalert-location');
      localStorage.removeItem('geoalert-location-consent');
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch {}
  };

  return (
    <main role="main" style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px', background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          How GeoAlert handles your data — and how it doesn&apos;t.
        </p>
      </div>

      {[
        {
          id: 'location',
          title: '📍 Location Data',
          content: 'GeoAlert uses your approximate location (rounded to ±1km) only to filter relevant alerts. Precise GPS coordinates are never sent to our servers, never stored in databases, and never logged.',
          list: null,
        },
        {
          id: 'storage',
          title: '💾 Local Storage',
          content: 'Alert data cached offline is stored only in your browser\'s IndexedDB. It never leaves your device unless you explicitly share it. You can clear it at any time below.',
          list: null,
        },
        {
          id: 'rights',
          title: '⚖️ Your Rights',
          content: null,
          list: [
            'Export all data associated with your session',
            'Delete your account and all associated data within 30 days',
            'Revoke location consent at any time — no penalty',
          ],
        },
        {
          id: 'tracking',
          title: '🚫 What We Don\'t Do',
          content: null,
          list: [
            'No advertising or third-party analytics',
            'No selling or sharing of location data',
            'No fingerprinting or cross-site tracking',
            'No server-side storage of precise GPS coordinates',
          ],
        },
      ].map(section => (
        <section
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="ga-card"
          style={{ marginBottom: 16, padding: '20px 24px' }}
        >
          <h2 id={`${section.id}-heading`} style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            {section.title}
          </h2>
          {section.content && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>{section.content}</p>
          )}
          {section.list && (
            <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 2 }}>
              {section.list.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}

      {/* Actions */}
      <section aria-labelledby="actions-heading" className="ga-card" style={{ padding: '20px 24px', marginTop: 24 }}>
        <h2 id="actions-heading" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Data Controls</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="http://localhost:8000/api/user/export" className="ga-btn ga-btn-primary ga-btn-lg">
            ⬇ Export My Data
          </a>
          <button
            onClick={handleClear}
            className={`ga-btn ga-btn-lg ${cleared ? 'ga-btn-ghost' : 'ga-btn-danger'}`}
          >
            {cleared ? '✓ Cleared!' : '🗑 Clear Location Data'}
          </button>
        </div>
        <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Data exports are provided within 60 seconds. Account deletion is processed within 30 days.
        </p>
      </section>

      <div style={{ marginTop: 32, fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
        <Link href="/" style={{ color: 'var(--text-muted)' }}>← Back to GeoAlert</Link>
      </div>
    </main>
  );
}
