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

const NAV_LINKS = [
  { href: '/map',    label: 'Live Map',  icon: '🗺' },
  { href: '/crisis', label: 'Crisis',    icon: '⚠' },
  { href: '/admin',  label: 'Admin',     icon: '⚙' },
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
          display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: 800, fontSize: '1.05rem',
          color: 'var(--text-primary)', textDecoration: 'none',
          letterSpacing: '-0.02em', marginRight: '8px',
        }}
        aria-label="GeoAlert home"
      >
        <span style={{ fontSize: '1.3rem' }}>🌍</span>
        <span>GeoAlert</span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px',
          background: 'var(--accent)', color: '#fff',
          borderRadius: 'var(--radius-full)', letterSpacing: '0.05em',
          verticalAlign: 'middle',
        }}>v2</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {NAV_LINKS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '0 10px', height: '32px', borderRadius: 'var(--radius-sm)',
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
              <span aria-hidden="true" style={{ fontSize: '0.85em' }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
        {/* API status dot */}
        <div
          title={apiOnline === null ? 'Checking API...' : apiOnline ? 'Backend online' : 'Backend offline — start with: uvicorn app.main:app --port 8000'}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '0.75rem', color: apiOnline === null ? 'var(--text-subtle)' : apiOnline ? 'var(--status-online)' : 'var(--status-offline)',
            padding: '0 8px', height: '28px', borderRadius: 'var(--radius-full)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'default',
          }}
          role="status"
          aria-label={`API ${apiOnline === null ? 'checking' : apiOnline ? 'online' : 'offline'}`}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: apiOnline === null ? 'var(--text-subtle)' : apiOnline ? 'var(--status-online)' : 'var(--status-offline)',
            boxShadow: apiOnline ? '0 0 0 2px rgba(22,163,74,.2)' : 'none',
          }} />
          API
        </div>

        {/* Classic version */}
        <a
          href="/classic/"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '0.75rem', color: 'var(--text-muted)',
            padding: '0 8px', height: '28px', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            textDecoration: 'none', transition: 'all var(--transition)',
            minHeight: 'unset',
            whiteSpace: 'nowrap',
          }}
          aria-label="View classic Earth Pulse version"
        >
          🌐 Classic
        </a>

        <ThemeToggle />
      </div>
    </nav>
  );
}
