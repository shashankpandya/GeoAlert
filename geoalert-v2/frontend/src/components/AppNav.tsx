'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function useApiStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
        if (mounted) setOnline(r.ok);
      } catch {
        if (mounted) setOnline(false);
      }
    };
    check();
    const iv = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);
  return online;
}

// Clean SVG icons — no emoji
function IconMap() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  );
}

const NAV_LINKS = [
  { href: '/map',    label: 'Live Map',  Icon: IconMap },
  { href: '/crisis', label: 'Crisis',    Icon: IconAlert },
  { href: '/admin',  label: 'Dashboard', Icon: IconSettings },
];

export function AppNav() {
  const pathname = usePathname();
  const apiOnline = useApiStatus();

  return (
    <nav className="ga-nav" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontWeight: 800, fontSize: '1rem',
          color: 'var(--text-primary)', textDecoration: 'none',
          letterSpacing: '-0.03em', marginRight: 4, flexShrink: 0,
        }}
        aria-label="GeoAlert home"
      >
        <span style={{ color: 'var(--accent)', display: 'flex' }}>
          <IconGlobe />
        </span>
        <span>GeoAlert</span>
        <span style={{
          fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px',
          background: 'var(--accent)', color: '#fff',
          borderRadius: 'var(--radius-full)', letterSpacing: '0.04em',
          lineHeight: 1.6,
        }}>
          v2
        </span>
      </Link>

      {/* Divider */}
      <span style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0, marginRight: 4 }} aria-hidden="true" />

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '0 10px', height: 32, borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem', fontWeight: active ? 600 : 500,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                background: active ? 'var(--surface-2)' : 'transparent',
                textDecoration: 'none',
                transition: 'all var(--transition)',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                minHeight: 'unset',
              }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        {/* API status */}
        <div
          title={
            apiOnline === null
              ? 'Checking API status...'
              : apiOnline
              ? `Backend online — ${API_BASE}`
              : 'Backend offline'
          }
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.72rem', fontWeight: 600,
            color: apiOnline === null
              ? 'var(--text-subtle)'
              : apiOnline
              ? 'var(--status-online)'
              : 'var(--status-offline)',
            padding: '0 8px', height: 26, borderRadius: 'var(--radius-full)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'default', flexShrink: 0,
          }}
          role="status"
          aria-label={`API ${apiOnline === null ? 'checking' : apiOnline ? 'online' : 'offline'}`}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: apiOnline === null
              ? 'var(--text-subtle)'
              : apiOnline
              ? 'var(--status-online)'
              : 'var(--status-offline)',
            boxShadow: apiOnline === true ? '0 0 0 2px rgba(22,163,74,.2)' : 'none',
          }} />
          API
        </div>

        {/* Classic version */}
        <a
          href="/classic/"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', fontWeight: 500,
            color: 'var(--text-muted)',
            padding: '0 8px', height: 26, borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            textDecoration: 'none', transition: 'all var(--transition)',
            minHeight: 'unset', flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          aria-label="View classic Earth Pulse version"
        >
          v1 Classic
        </a>

        <ThemeToggle />
      </div>
    </nav>
  );
}
