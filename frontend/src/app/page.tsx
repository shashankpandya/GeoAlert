import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'GeoAlert — Safety-first crisis alerts' };

const FEATURES = [
  { icon: '📡', title: 'Official Sources', desc: 'NWS, FEMA, and .gov verified feeds with provenance badges and multi-layer authentication.' },
  { icon: '📴', title: 'Offline-First', desc: 'Service Worker + IndexedDB persist alerts locally. Full functionality during network outages.' },
  { icon: '♿', title: 'WCAG 2.2 AA', desc: 'Full keyboard navigation, screen reader support, and 400% zoom compliance throughout.' },
  { icon: '🔒', title: 'Privacy by Design', desc: 'Location rounded to ±1km. Zero precise GPS coordinates stored or transmitted.' },
];

const STATS = [
  { value: '<100KB', label: 'Crisis mode payload' },
  { value: '2min',   label: 'Alert refresh interval' },
  { value: '4',      label: 'Severity levels tracked' },
  { value: '100%',   label: 'Offline capable' },
];

export default function Home() {
  return (
    <main role="main" style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--bg)' }}>
      {/* ── Hero ───────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1200, margin: '0 auto', padding: '72px 24px 64px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* Left — text */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-subtle)', color: 'var(--accent-text)',
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', marginBottom: 20,
            border: '1px solid var(--accent)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sev-extreme)', boxShadow: '0 0 0 3px rgba(220,38,38,.15)', display: 'inline-block' }} />
            Safety-First Emergency Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 20,
          }}>
            Know the danger.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Act immediately.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem', color: 'var(--text-secondary)',
            lineHeight: 1.7, maxWidth: 520, marginBottom: 36,
          }}>
            GeoAlert answers six critical questions in any emergency: Am I in danger? What should I do? Is this official? Where? How current? What if the internet fails?
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
            <Link href="/crisis" className="ga-btn ga-btn-danger ga-btn-lg"
              aria-label="Open Crisis Mode — text-only emergency view">
              ⚠ Crisis Mode
            </Link>
            <Link href="/map" className="ga-btn ga-btn-primary ga-btn-lg"
              aria-label="Open interactive alert map">
              🗺 Live Map
            </Link>
            <Link href="/admin" className="ga-btn ga-btn-ghost ga-btn-lg">
              ⚙ Dashboard
            </Link>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            paddingTop: 24, borderTop: '1px solid var(--border)',
          }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — dashboard preview card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Mock alert feed */}
          {[
            { sev: 'extreme', event: 'Tornado Warning', area: 'Oklahoma County, OK', age: '2min ago' },
            { sev: 'severe',  event: 'Flash Flood Watch', area: 'Harris County, TX', age: '18min ago' },
            { sev: 'moderate',event: 'Winter Storm Advisory', area: 'Denver Metro, CO', age: '1h ago' },
            { sev: 'minor',   event: 'Dense Fog Advisory', area: 'San Francisco Bay, CA', age: '2h ago' },
          ].map((a, i) => (
            <div
              key={i}
              className={`ga-alert-item sev-border-${a.sev} animate-fade-in`}
              style={{ animationDelay: `${i * 60}ms`, cursor: 'default' }}
              aria-label={`${a.event} — ${a.area}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <span className={`ga-badge ga-badge-${a.sev}`} style={{ marginBottom: 4 }}>
                    {a.sev}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: 2 }}>
                    {a.event}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    📍 {a.area}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {a.age}
                </div>
              </div>
            </div>
          ))}

          <div style={{
            textAlign: 'center', padding: '10px 0',
            fontSize: '0.8rem', color: 'var(--text-muted)',
          }}>
            Live data from{' '}
            <Link href="/map" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              the map →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature strip ──────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-1)',
          padding: '48px 24px',
        }}
        aria-labelledby="features-heading"
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 id="features-heading" style={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 24,
            textAlign: 'center',
          }}>
            Built for the worst moments
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                padding: '20px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                transition: 'all var(--transition)',
              }}>
                <div style={{ fontSize: '1.75rem', marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        role="contentinfo"
        style={{
          borderTop: '1px solid var(--border)',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          maxWidth: 1200,
          margin: '0 auto',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>GeoAlert v2 — Safety-first crisis response platform</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy</Link>
          <Link href="/admin" style={{ color: 'var(--text-muted)' }}>Admin</Link>
          <a href="/classic/" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            color: 'var(--text-muted)', padding: '4px 10px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem', minHeight: 'unset',
          }}>
            🌐 Classic version
          </a>
        </div>
      </footer>
    </main>
  );
}
