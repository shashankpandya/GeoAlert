import React from 'react';

export default function AdminPage() {
  return (
    <main
      role="main"
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'system-ui,sans-serif',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <meta httpEquiv="refresh" content="30" />
      <header role="banner" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>GeoAlert Admin Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Auto-refreshes every 30 seconds</p>
      </header>
      <section aria-labelledby="providers-heading">
        <h2
          id="providers-heading"
          style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}
        >
          Provider Health
        </h2>
        <p style={{ color: '#6b7280' }}>Connect to /api/admin/dashboard for live data.</p>
      </section>
    </main>
  );
}
