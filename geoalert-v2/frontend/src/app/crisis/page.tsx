import { MinimalAlert, Severity } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crisis Mode — Active Alerts',
  description: 'Text-only emergency alert view for low-bandwidth crisis situations',
};

interface PageProps { searchParams: Promise<{ page?: string }>; }

const PAGE_SIZE = 25;

const SEV_CONFIG: Record<Severity, { label: string; accent: string }> = {
  extreme:  { label: 'Extreme',  accent: 'var(--sev-extreme)' },
  severe:   { label: 'Severe',   accent: 'var(--sev-severe)' },
  moderate: { label: 'Moderate', accent: 'var(--sev-moderate)' },
  minor:    { label: 'Minor',    accent: 'var(--sev-minor)' },
};

function getAgeLabel(effective: string): { label: string; state: 'fresh' | 'aging' | 'stale' } {
  const age = (Date.now() - new Date(effective).getTime()) / 60000;
  if (age < 60)  return { label: `${Math.round(age)}m ago`,                      state: 'fresh' };
  if (age < 120) return { label: `${Math.round(age / 60 * 10) / 10}h ago`,       state: 'aging' };
  return           { label: `${Math.floor(age / 60)}h ago`,                       state: 'stale' };
}

function getMockAlerts(page: number): { alerts: MinimalAlert[]; total: number } {
  const events = [
    { event: 'Tornado Warning',         instruction: 'Go to the lowest floor of a sturdy building. Avoid windows.' },
    { event: 'Flash Flood Watch',        instruction: 'Move to higher ground. Do not walk or drive through floodwaters.' },
    { event: 'Severe Thunderstorm',      instruction: 'Stay indoors, away from windows. Unplug electronics.' },
    { event: 'Winter Storm Advisory',    instruction: 'Limit travel. Keep emergency kit in your vehicle if you must drive.' },
    { event: 'Heat Advisory',            instruction: 'Stay hydrated. Seek air-conditioned spaces during peak heat hours.' },
    { event: 'Air Quality Alert',        instruction: 'Limit outdoor activity. Wear a mask if you must go outside.' },
  ];
  const all: MinimalAlert[] = Array.from({ length: 18 }, (_, i) => {
    const ev = events[i % events.length];
    const sevs: Severity[] = ['extreme', 'extreme', 'severe', 'severe', 'moderate', 'moderate', 'minor', 'minor', 'moderate'];
    return {
      id: `alert-${i + 1}`,
      severity: sevs[i % sevs.length],
      event: ev.event,
      headline: `${ev.event} in effect for the affected area. Conditions are deteriorating rapidly.`,
      instruction: ev.instruction,
      source: i % 4 === 0 ? 'community' : 'official',
      areas: [`${['Cook', 'Harris', 'Maricopa', 'Kings', 'Dallas'][i % 5]} County`, `${['IL', 'TX', 'AZ', 'CA', 'TX'][i % 5]}`],
      effective: new Date(Date.now() - (i * 18 + 5) * 60000).toISOString(),
      expires: new Date(Date.now() + (180 - i * 8) * 60000).toISOString(),
      isStale: i > 10,
    };
  });
  const order: Severity[] = ['extreme', 'severe', 'moderate', 'minor'];
  const sorted = [...all].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  const start = (page - 1) * PAGE_SIZE;
  return { alerts: sorted.slice(start, start + PAGE_SIZE), total: sorted.length };
}

export default async function CrisisPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const page = Math.max(1, parseInt(p.page ?? '1', 10) || 1);
  const { alerts, total } = getMockAlerts(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const extremeCount = alerts.filter(a => a.severity === 'extreme').length;
  const severeCount  = alerts.filter(a => a.severity === 'severe').length;

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 56px)' }}>
      {/* Page header — consistent with app design */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-1)',
        padding: '20px 24px',
        maxWidth: 900, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              {extremeCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--sev-extreme-bg)', color: 'var(--sev-extreme-text)',
                  border: '1px solid var(--sev-extreme)',
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sev-extreme)', display: 'inline-block' }} />
                  {extremeCount} Extreme active
                </span>
              )}
              {severeCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  background: 'var(--sev-severe-bg)', color: 'var(--sev-severe-text)',
                  border: '1px solid var(--sev-severe)',
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {severeCount} Severe active
                </span>
              )}
            </div>
            <h1 style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
              fontWeight: 800, letterSpacing: '-0.025em',
              color: 'var(--text-primary)',
            }}>
              Crisis Mode
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {total} active alerts — text-only view, works on any connection
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            <div>Page {page} of {totalPages}</div>
          </div>
        </div>
      </div>

      {/* Alert list */}
      <main
        role="main"
        aria-label="Active emergency alerts"
        style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px' }}
      >
        <a href="#alert-list" className="sr-only" style={{ position: 'absolute', left: '-9999px' }}>
          Skip to alert list
        </a>

        <ol
          id="alert-list"
          aria-label="Emergency alert list"
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {alerts.map((a) => {
            const sev = SEV_CONFIG[a.severity];
            const age = getAgeLabel(a.effective);
            const isOfficial = a.source === 'official';

            return (
              <li key={a.id}>
                <article
                  aria-labelledby={`h-${a.id}`}
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${sev.accent}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    transition: 'box-shadow var(--transition)',
                  }}
                >
                  {/* Top row: severity + source + age */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 10, flexWrap: 'wrap',
                  }}>
                    <span
                      aria-label={`Severity: ${a.severity}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '2px 9px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        background: `color-mix(in srgb, ${sev.accent} 15%, transparent)`,
                        color: sev.accent,
                        border: `1px solid color-mix(in srgb, ${sev.accent} 35%, transparent)`,
                      }}
                    >
                      {sev.label}
                    </span>

                    <span
                      aria-label={`Source: ${a.source}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '2px 9px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem', fontWeight: 600,
                        background: isOfficial ? 'var(--accent-subtle)' : 'var(--surface-2)',
                        color: isOfficial ? 'var(--accent-text)' : 'var(--text-muted)',
                        border: `1px solid ${isOfficial ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'var(--border)'}`,
                      }}
                    >
                      {isOfficial ? '✓ Official' : 'Community'}
                    </span>

                    <span
                      aria-label={`Status: ${age.state}`}
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.72rem', fontWeight: 500,
                        color: age.state === 'fresh'
                          ? 'var(--fresh-color)'
                          : age.state === 'aging'
                          ? 'var(--aging-color)'
                          : 'var(--stale-color)',
                      }}
                    >
                      {age.label}
                    </span>
                  </div>

                  {/* Event title */}
                  <h2
                    id={`h-${a.id}`}
                    style={{
                      fontSize: '1rem', fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4, lineHeight: 1.3,
                    }}
                  >
                    {a.event}
                  </h2>

                  {/* Headline */}
                  <p style={{
                    fontSize: '0.875rem', color: 'var(--text-secondary)',
                    lineHeight: 1.55, marginBottom: 12,
                  }}>
                    {a.headline}
                  </p>

                  {/* Action box */}
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--accent)',
                    marginBottom: 10,
                  }}>
                    <div style={{
                      fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.07em', color: 'var(--accent)', marginBottom: 4,
                    }}>
                      What to do
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                      {a.instruction}
                    </p>
                  </div>

                  {/* Meta row: areas + expiry */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 6,
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                  }}>
                    <span>📍 {a.areas.join(', ')}</span>
                    <span>Expires {new Date(a.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>

        {/* Pagination */}
        <nav
          aria-label="Pagination"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginTop: 24, flexWrap: 'wrap',
          }}
        >
          {page > 1 ? (
            <a
              href={`/crisis?page=${page - 1}`}
              aria-label="Previous page"
              className="ga-btn ga-btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              ← Previous
            </a>
          ) : (
            <span className="ga-btn" style={{ opacity: 0.35, cursor: 'default', pointerEvents: 'none', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              ← Previous
            </span>
          )}

          <span style={{
            padding: '0 16px', fontSize: '0.82rem',
            color: 'var(--text-muted)', lineHeight: '36px',
          }}>
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <a
              href={`/crisis?page=${page + 1}`}
              aria-label="Next page"
              className="ga-btn ga-btn-ghost"
              style={{ textDecoration: 'none' }}
            >
              Next →
            </a>
          ) : (
            <span className="ga-btn" style={{ opacity: 0.35, cursor: 'default', pointerEvents: 'none', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Next →
            </span>
          )}
        </nav>
      </main>
    </div>
  );
}
