import { MinimalAlert, Severity } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GeoAlert Crisis Mode — Active Alerts',
  description: 'Text-only emergency alert view optimised for low bandwidth',
};

interface PageProps { searchParams: Promise<{ page?: string }>; }

const PAGE_SIZE = 50;
const SEV_COLORS: Record<Severity, string> = {
  extreme: '#7f1d1d', severe: '#7c2d12', moderate: '#713f12', minor: '#14532d',
};
const SEV_BG: Record<Severity, string> = {
  extreme: '#fef2f2', severe: '#fff7ed', moderate: '#fefce8', minor: '#f0fdf4',
};

function freshness(effective: string) {
  const age = (Date.now() - new Date(effective).getTime()) / 60000;
  if (age < 60) return { label: 'Current', color: '#15803d' };
  if (age < 120) return { label: 'Aging', color: '#b45309' };
  return { label: 'Stale', color: '#b91c1c' };
}

function getMockAlerts(page: number): { alerts: MinimalAlert[]; total: number } {
  const all: MinimalAlert[] = Array.from({ length: 12 }, (_, i) => ({
    id: `alert-${i + 1}`,
    severity: (['extreme', 'severe', 'moderate', 'minor'] as Severity[])[i % 4],
    event: ['Severe Thunderstorm Warning', 'Flash Flood Watch', 'Tornado Warning', 'Winter Storm Advisory'][i % 4],
    headline: `Alert ${i + 1}: Hazardous conditions expected in the affected area. Take immediate action.`,
    instruction: ['Move to the lowest interior room.', 'Avoid flood-prone areas and roads.', 'Shelter in place immediately.', 'Reduce travel if possible.'][i % 4],
    source: (i % 3 === 0 ? 'community' : 'official') as 'official' | 'community',
    areas: [`County ${i + 1}`, `District ${(i % 3) + 1}`],
    effective: new Date(Date.now() - (i * 25 + 10) * 60000).toISOString(),
    expires: new Date(Date.now() + (120 - i * 5) * 60000).toISOString(),
    isStale: i > 8,
  }));
  const order = ['extreme', 'severe', 'moderate', 'minor'];
  const sorted = all.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  const start = (page - 1) * PAGE_SIZE;
  return { alerts: sorted.slice(start, start + PAGE_SIZE), total: sorted.length };
}

const CSS = `
  .crisis-skip { position: absolute; left: -9999px; top: auto; }
  .crisis-skip:focus { position: static; padding: 8px 16px; background: #1d4ed8; color: #fff; text-decoration: none; border-radius: 4px; display: inline-block; margin: 8px; }
  .crisis-header { background: #1e3a5f; color: #fff; padding: 16px 24px; border-bottom: 4px solid #dc2626; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .crisis-header h1 { font-size: 1.25rem; font-weight: 700; font-family: system-ui, sans-serif; }
  .crisis-header a { color: #93c5fd; font-size: 0.85rem; text-decoration: none; }
  .crisis-main { max-width: 900px; margin: 0 auto; padding: 16px; font-family: system-ui, sans-serif; }
  .crisis-count { font-size: 0.875rem; color: #6b7280; margin-bottom: 12px; }
  .crisis-list { list-style: none; padding: 0; margin: 0; }
  .crisis-article { border-left: 6px solid #9ca3af; border-radius: 6px; padding: 16px; margin-bottom: 12px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .crisis-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.8rem; margin-bottom: 8px; align-items: center; }
  .badge-sev { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #fff; }
  .badge-official { background: #1d4ed8; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
  .badge-community { background: #6b7280; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; }
  .crisis-headline { font-size: 1rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .crisis-body { font-size: 0.9rem; color: #374151; margin-top: 4px; }
  .crisis-inst { background: #f3f4f6; border-radius: 4px; padding: 10px 12px; font-size: 0.9rem; margin-top: 8px; }
  .crisis-areas { font-size: 0.8rem; color: #6b7280; margin-top: 6px; }
  .crisis-expires { font-size: 0.75rem; color: #9ca3af; margin-top: 4px; }
  .crisis-footer { text-align: center; padding: 16px; font-size: 0.8rem; color: #9ca3af; margin-top: 24px; border-top: 1px solid #e5e7eb; }
  .crisis-nav { display: flex; gap: 12px; justify-content: center; margin-top: 24px; flex-wrap: wrap; align-items: center; }
  .crisis-nav a { display: inline-block; padding: 8px 20px; background: #1d4ed8; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem; }
  .crisis-nav span { padding: 8px 20px; color: #9ca3af; font-size: 0.9rem; }
  @media (prefers-color-scheme: dark) {
    .crisis-article { background: #1f2937; color: #e5e7eb; }
    .crisis-inst { background: #111827; }
  }
`;

export default async function CrisisPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const page = Math.max(1, parseInt(p.page ?? '1', 10) || 1);
  const { alerts, total } = getMockAlerts(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a href="#alert-list" className="crisis-skip">Skip to alerts</a>

      <header role="banner" className="crisis-header">
        <h1>⚠ GeoAlert Crisis Mode</h1>
        <a href="/" aria-label="Back to GeoAlert homepage">← Back to GeoAlert</a>
      </header>

      <main role="main" className="crisis-main" aria-label="Active Emergency Alerts">
        <p className="crisis-count">
          Showing {alerts.length} of {total} active alerts — Page {page} of {totalPages}
        </p>

        {alerts.length === 0 ? (
          <div role="status" aria-live="polite" style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
            No active alerts in your area.
          </div>
        ) : (
          <ol id="alert-list" className="crisis-list" aria-label="Emergency alert list">
            {alerts.map((a) => {
              const fr = freshness(a.effective);
              return (
                <li key={a.id}>
                  <article
                    className="crisis-article"
                    aria-labelledby={`headline-${a.id}`}
                    style={{ borderLeftColor: SEV_COLORS[a.severity], backgroundColor: SEV_BG[a.severity] }}
                  >
                    <div className="crisis-meta">
                      <span className="badge-sev" style={{ background: SEV_COLORS[a.severity] }} aria-label={`Severity: ${a.severity}`}>
                        {a.severity.toUpperCase()}
                      </span>
                      <span className={a.source === 'official' ? 'badge-official' : 'badge-community'} aria-label={`Source: ${a.source}`}>
                        {a.source === 'official' ? '✓ Official' : 'Community'}
                      </span>
                      <span aria-label={`Status: ${fr.label}`} style={{ fontSize: '0.8rem', fontWeight: 600, color: fr.color }}>
                        {fr.label}
                      </span>
                    </div>
                    <h2 id={`headline-${a.id}`} className="crisis-headline">{a.event}</h2>
                    <p className="crisis-body">{a.headline}</p>
                    <div className="crisis-inst">
                      <strong>What to do: </strong>{a.instruction}
                    </div>
                    <p className="crisis-areas">📍 {a.areas.join(' · ')}</p>
                    <p className="crisis-expires">Expires: {new Date(a.expires).toUTCString()}</p>
                  </article>
                </li>
              );
            })}
          </ol>
        )}

        <nav className="crisis-nav" aria-label="Pagination">
          {page > 1
            ? <a href={`/crisis?page=${page - 1}`} aria-label="Previous page">← Previous</a>
            : <span aria-hidden="true">← Previous</span>}
          <span aria-current="page">Page {page} of {totalPages}</span>
          {page < totalPages
            ? <a href={`/crisis?page=${page + 1}`} aria-label="Next page">Next →</a>
            : <span aria-hidden="true">Next →</span>}
        </nav>
      </main>

      <footer role="contentinfo" className="crisis-footer">
        <p>GeoAlert v2 — Safety-first crisis response platform</p>
        <p style={{ marginTop: '4px' }}>
          <a href="/" style={{ color: '#6b7280' }}>← Back to homepage</a>
          {' · '}
          <a href="/classic/" style={{ color: '#6b7280' }}>View Classic Version</a>
        </p>
      </footer>
    </>
  );
}
