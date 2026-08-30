import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GeoAlert — Real-time Emergency Alerts',
  description: 'Safety-first crisis response platform with official source verification, offline resilience, and WCAG 2.2 AA accessibility.',
};

const MOCK_ALERTS = [
  { sev: 'extreme', label: 'EXTREME', event: 'Tornado Warning',        area: 'Oklahoma County, OK',       age: '2m',  src: 'Official' },
  { sev: 'severe',  label: 'SEVERE',  event: 'Flash Flood Watch',      area: 'Harris County, TX',          age: '18m', src: 'Official' },
  { sev: 'moderate',label: 'MOD',     event: 'Winter Storm Advisory',  area: 'Denver Metro, CO',           age: '1h',  src: 'Official' },
  { sev: 'minor',   label: 'MINOR',   event: 'Dense Fog Advisory',     area: 'San Francisco Bay, CA',      age: '2h',  src: 'Community' },
];

// bg/border use CSS vars — only dot color is hardcoded per severity
const SEV_COLORS: Record<string, { dot: string }> = {
  extreme:  { dot: 'var(--sev-extreme)' },
  severe:   { dot: 'var(--sev-severe)' },
  moderate: { dot: 'var(--sev-moderate)' },
  minor:    { dot: 'var(--sev-minor)' },
};

const FEATURES = [
  { icon: 'VFD', title: 'Verified Sources',   desc: 'NWS, FEMA, and .gov feeds are tagged Official. Community sources are always clearly marked.' },
  { icon: 'RT',  title: 'Real-Time Updates',  desc: 'Alerts refresh every 2 minutes. Severity, freshness, and expiry are always current.' },
  { icon: 'OFL', title: 'Works Offline',      desc: 'Service Worker + IndexedDB. Download a region and stay informed without internet.' },
  { icon: 'A11', title: 'Fully Accessible',   desc: 'WCAG 2.2 AA — keyboard navigation, screen reader support, 400% zoom compliance.' },
  { icon: 'PVT', title: 'Privacy First',      desc: 'Location stays on your device. Coordinates rounded to ±1km, never logged.' },
  { icon: 'CRS', title: 'Crisis Mode',        desc: 'Sub-100KB text-only view loads on 2G when every second counts.' },
];

export default function Home() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{
        maxWidth: 1200, margin: '0 auto',
        padding: 'clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 72px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
        gap: 'clamp(32px, 5vw, 64px)',
        alignItems: 'center',
      }}>

        {/* Left: hero text */}
        <div>
          {/* Eyebrow pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-subtle)',
            border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--accent-text)',
            marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#dc2626',
              animation: 'pulse-dot 2s ease infinite',
              display: 'inline-block', flexShrink: 0,
            }} />
            Emergency Alert Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
            fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.035em',
            color: 'var(--text-primary)',
            marginBottom: 20,
          }}>
            Know the danger.
            <br />
            <span style={{
              background: 'linear-gradient(120deg, var(--accent), #7c3aed 60%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Act immediately.
            </span>
          </h1>

          <p style={{
            fontSize: '1.1rem', color: 'var(--text-secondary)',
            lineHeight: 1.75, maxWidth: 480, marginBottom: 36,
          }}>
            Real-time emergency alerts with official source verification,
            offline resilience, and crisis mode that works on any connection.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 44 }}>
            <Link href="/map" className="ga-btn ga-btn-primary ga-btn-lg" style={{ gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              Live Map
            </Link>
            <Link href="/crisis" className="ga-btn ga-btn-danger ga-btn-lg" style={{ gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Crisis Mode
            </Link>
            <Link href="/admin" className="ga-btn ga-btn-ghost ga-btn-lg">
              Dashboard
            </Link>
          </div>

          {/* Metric row */}
          <div style={{
            display: 'flex', gap: 28, flexWrap: 'wrap',
            paddingTop: 24, borderTop: '1px solid var(--border)',
          }}>
            {[
              { n: '<100KB', l: 'Crisis payload' },
              { n: '2 min',  l: 'Refresh rate' },
              { n: 'WCAG AA',l: 'Accessibility' },
              { n: 'Offline',l: 'Capable' },
            ].map(m => (
              <div key={m.l}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{m.n}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: live alert feed preview */}
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--surface-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#16a34a',
                boxShadow: '0 0 0 3px rgba(22,163,74,.15)', display: 'inline-block',
              }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Live Alerts
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              4 active
            </span>
          </div>

          {/* Alert rows */}
          <div style={{ padding: '8px' }}>
            {MOCK_ALERTS.map((a, i) => {
              const c = SEV_COLORS[a.sev];
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  marginBottom: i < MOCK_ALERTS.length - 1 ? 4 : 0,
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${c.dot}`,
                }}>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800,
                    color: 'var(--text-muted)',
                    background: 'var(--surface-2)', padding: '2px 6px',
                    borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', flexShrink: 0,
                    letterSpacing: '0.04em', border: '1px solid var(--border)',
                  }}>
                    {a.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.event}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      📍 {a.area}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 2 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>{a.age}</span>
                    <span style={{ fontSize: '0.62rem', color: a.src === 'Official' ? 'var(--status-online)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {a.src === 'Official' ? '✓ Official' : '○ Community'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel footer */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              Sample preview — visit Live Map for real-time data
            </span>
            <Link href="/map" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', minHeight: 'unset' }}>
              View map →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-1)',
        padding: 'clamp(40px, 6vw, 64px) 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800,
              letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 10,
            }}>
              Built for the worst moments
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
              Six capabilities that matter when disaster strikes.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 16,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="ga-feature-card">
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.04em',
                  color: 'var(--accent)', fontFamily: 'var(--font-geist-mono), monospace',
                  marginBottom: 14, flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
        padding: 'clamp(40px, 6vw, 56px) 24px',
      }}>
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.02em', marginBottom: 12,
          }}>
            Ready when you need it most
          </h2>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1rem', marginBottom: 28 }}>
            Start with the interactive map, or go straight to Crisis Mode for a lightweight emergency view.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/map" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 24px', height: 48, borderRadius: 'var(--radius-sm)',
              background: '#fff', color: '#1d4ed8',
              fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
              minHeight: 'unset', transition: 'opacity 150ms',
            }}>
              Open Live Map
            </Link>
            <Link href="/crisis" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 24px', height: 48, borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,.15)', color: '#fff',
              border: '1px solid rgba(255,255,255,.3)',
              fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
              minHeight: 'unset',
            }}>
              Crisis Mode
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer role="contentinfo" style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        maxWidth: 1200, margin: '0 auto',
        fontSize: '0.8rem', color: 'var(--text-muted)',
      }}>
        <span>© 2026 GeoAlert v2 · Safety-first emergency alerts</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', minHeight: 'unset' }}>Privacy</Link>
          <Link href="/admin" style={{ color: 'var(--text-muted)', minHeight: 'unset' }}>Admin</Link>
          <Link href="/crisis" style={{ color: 'var(--text-muted)', minHeight: 'unset' }}>Crisis Mode</Link>
          <a href="/classic/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: 'var(--text-muted)', padding: '3px 10px', minHeight: 'unset',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem', background: 'var(--surface-2)', textDecoration: 'none',
          }}>
            🌐 Classic
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @media (max-width: 640px) {
          section:first-of-type { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
