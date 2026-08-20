import { MinimalAlert, Severity } from '@/types';

interface PageProps { searchParams: Promise<{ page?: string }>; }
const PAGE_SIZE = 50;
const SEV_COLORS: Record<Severity,string> = { extreme:'#7f1d1d',severe:'#7c2d12',moderate:'#713f12',minor:'#14532d' };
const SEV_BG: Record<Severity,string> = { extreme:'#fef2f2',severe:'#fff7ed',moderate:'#fefce8',minor:'#f0fdf4' };

function freshness(effective: string) {
  const age = (Date.now() - new Date(effective).getTime()) / 60000;
  if (age < 60) return { label:'Current', sym:'check', color:'#15803d' };
  if (age < 120) return { label:'Aging', sym:'warn', color:'#b45309' };
  return { label:'Stale', sym:'x', color:'#b91c1c' };
}

function getSample(page: number): { alerts: MinimalAlert[]; total: number } {
  const all: MinimalAlert[] = Array.from({ length: 12 }, (_, i) => ({
    id: `alert-${i+1}`, severity: (['extreme','severe','moderate','minor'] as Severity[])[i%4],
    event: ['Severe Thunderstorm Warning','Flash Flood Watch','Tornado Warning','Winter Storm Advisory'][i%4],
    headline: `Alert ${i+1}: Hazardous conditions expected. Take immediate action.`,
    instruction: ['Move to interior room.','Avoid flood areas.','Shelter immediately.','Reduce travel.'][i%4],
    source: (i%3===0 ? 'community' : 'official') as 'official'|'community',
    areas: [`County ${i+1}`, `District ${(i%3)+1}`],
    effective: new Date(Date.now()-(i*25+10)*60000).toISOString(),
    expires: new Date(Date.now()+(120-i*5)*60000).toISOString(),
    isStale: i > 8,
  }));
  const sorted = all.sort((a,b)=>['extreme','severe','moderate','minor'].indexOf(a.severity)-['extreme','severe','moderate','minor'].indexOf(b.severity));
  const start = (page-1)*PAGE_SIZE;
  return { alerts: sorted.slice(start, start+PAGE_SIZE), total: sorted.length };
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px}body{font-family:system-ui,sans-serif;background:#f9fafb;color:#111827;line-height:1.6}
.skip{position:absolute;left:-9999px}.skip:focus{position:static;padding:8px 16px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:4px}
header{background:#1e3a5f;color:#fff;padding:16px 24px;border-bottom:4px solid #dc2626}
main{max-width:900px;margin:0 auto;padding:16px}
ol{list-style:none}article{border-left:6px solid #9ca3af;border-radius:6px;padding:16px;margin-bottom:12px;background:#fff}
article h2{font-size:1rem;font-weight:700;margin-bottom:6px}
.meta{display:flex;flex-wrap:wrap;gap:8px;font-size:0.8rem;margin-bottom:8px}
.off{background:#1d4ed8;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700}
.com{background:#6b7280;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75rem}
.sev{padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;text-transform:uppercase}
.inst{background:#f3f4f6;border-radius:4px;padding:10px 12px;font-size:0.9rem;margin-top:8px}
.areas{font-size:0.8rem;color:#6b7280;margin-top:6px}
.pnav{display:flex;gap:12px;justify-content:center;margin-top:24px}
.pnav a{display:inline-block;padding:8px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:600}
footer{text-align:center;padding:16px;font-size:0.8rem;color:#9ca3af;margin-top:24px}
`;

export default async function CrisisPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const page = Math.max(1, parseInt(p.page ?? '1', 10) || 1);
  const { alerts, total } = getSample(page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width,initial-scale=1' />
        <title>GeoAlert Crisis Mode</title>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body>
        <a href='#alert-list' className='skip'>Skip to alerts</a>
        <header role='banner'><h1>GeoAlert Crisis Mode</h1>
          <p>Text-only emergency alerts</p></header>
        <main role='main' aria-label='Active Emergency Alerts'>
          <p style={{ fontSize:'0.875rem',color:'#6b7280',marginBottom:'12px' }}>
            {alerts.length} of {total} alerts — Page {page} of {totalPages}
          </p>
          {alerts.length === 0
            ? <div role='status' aria-live='polite' style={{ padding:'48px',textAlign:'center' }}>No active alerts.</div>
            : <ol id='alert-list' aria-label='Emergency alert list'>
                {alerts.map((a) => {
                  const fr = freshness(a.effective);
                  return (
                    <li key={a.id}>
                      <article aria-labelledby={`h-${a.id}`}
                               style={{ borderLeftColor: SEV_COLORS[a.severity], backgroundColor: SEV_BG[a.severity] }}>
                        <div className='meta'>
                          <span className='sev' style={{ background:SEV_COLORS[a.severity],color:'#fff' }}
                                aria-label={`Severity: ${a.severity}`}>{a.severity.toUpperCase()}</span>
                          <span className={a.source==='official'?'off':'com'} aria-label={`Source: ${a.source}`}>
                            {a.source==='official'?'Official':'Community'}
                          </span>
                          <span aria-label={`Status: ${fr.label}`} style={{ fontSize:'0.8rem',fontWeight:600,color:fr.color }}>
                            {fr.label}
                          </span>
                        </div>
                        <h2 id={`h-${a.id}`}>{a.event}</h2>
                        <p style={{ fontSize:'0.9rem',marginTop:'4px' }}>{a.headline}</p>
                        <div className='inst'><strong>What to do: </strong>{a.instruction}</div>
                        <p className='areas'>Areas: {a.areas.join(' | ')}</p>
                        <p style={{ fontSize:'0.75rem',color:'#9ca3af',marginTop:'4px' }}>
                          Expires: {new Date(a.expires).toUTCString()}
                        </p>
                      </article>
                    </li>
                  );
                })}
              </ol>
          }
          <nav className='pnav' aria-label='Pagination'>
            {page > 1 ? <a href={`/crisis?page=${page-1}`} aria-label='Previous page'>Previous</a> : <span>Previous</span>}
            <span aria-current='page'>Page {page} of {totalPages}</span>
            {page < totalPages ? <a href={`/crisis?page=${page+1}`} aria-label='Next page'>Next</a> : <span>Next</span>}
          </nav>
        </main>
        <footer role='contentinfo'><p>GeoAlert v2</p></footer>
      </body>
    </html>
  );
}
