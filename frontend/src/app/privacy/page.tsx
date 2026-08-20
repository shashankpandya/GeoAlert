'use client';
import React from 'react';
export default function PrivacyPage() {
  return (
    <main role="main" style={{ maxWidth:'800px',margin:'0 auto',padding:'32px 16px',fontFamily:'system-ui,sans-serif' }}>
      <h1 style={{ fontSize:'2rem',fontWeight:700,marginBottom:'24px' }}>Privacy Policy</h1>
      <section aria-labelledby="loc-heading" style={{ marginBottom:'24px' }}>
        <h2 id="loc-heading" style={{ fontSize:'1.25rem',fontWeight:700,marginBottom:'8px' }}>Location Data</h2>
        <p>GeoAlert uses your approximate location (rounded to ±1km) only to filter relevant alerts. Precise GPS coordinates are <strong>never</strong> sent to our servers or stored.</p>
      </section>
      <section aria-labelledby="rights-heading" style={{ marginBottom:'24px' }}>
        <h2 id="rights-heading" style={{ fontSize:'1.25rem',fontWeight:700,marginBottom:'8px' }}>Your Rights</h2>
        <ul style={{ paddingLeft:'20px',lineHeight:'1.8' }}>
          <li>Export all your data via the button below</li>
          <li>Delete your account and all associated data</li>
          <li>Change or revoke location consent at any time</li>
        </ul>
      </section>
      <section style={{ display:'flex',gap:'12px',flexWrap:'wrap' }}>
        <a href="/api/user/export" style={{ padding:'12px 20px',background:'#1d4ed8',color:'#fff',textDecoration:'none',borderRadius:'6px',fontWeight:600,minHeight:'44px',display:'inline-flex',alignItems:'center' }}>Export My Data</a>
        <button onClick={() => { try { localStorage.removeItem('geoalert-location'); localStorage.removeItem('geoalert-location-consent'); alert('Location data cleared.'); } catch {} }}
          style={{ padding:'12px 20px',background:'#dc2626',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:600,minHeight:'44px' }}>Clear Location Data</button>
      </section>
    </main>
  );
}
