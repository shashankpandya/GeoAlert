'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Alert, Severity } from '@/types';
import { calculateFreshness } from '@/types';

interface AlertDetailsPanelProps {
  alert: Alert | null;
  onClose: () => void;
  offlineMode?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const SEV: Record<Severity, { bg: string; border: string; text: string }> = {
  extreme: { bg: '#fef2f2', border: '#dc2626', text: '#7f1d1d' },
  severe:  { bg: '#fff7ed', border: '#ea580c', text: '#7c2d12' },
  moderate:{ bg: '#fefce8', border: '#ca8a04', text: '#713f12' },
  minor:   { bg: '#f0fdf4', border: '#16a34a', text: '#14532d' },
};

const FRESH: Record<string, { label: string; symbol: string; color: string; bg: string }> = {
  fresh:  { label: 'Current', symbol: '✓', color: '#15803d', bg: '#f0fdf4' },
  aging:  { label: 'Aging',   symbol: '⚠',  color: '#b45309', bg: '#fffbeb' },
  stale:  { label: 'Stale',   symbol: '✕', color: '#b91c1c', bg: '#fef2f2' },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.toUTCString()} (${d.toLocaleString()})`;
}

export function AlertDetailsPanel({ alert, onClose, offlineMode = false, triggerRef }: AlertDetailsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (alert) closeRef.current?.focus(); }, [alert]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); triggerRef?.current?.focus(); return; }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
  }, [onClose, triggerRef]);

  if (!alert) return null;
  const c = SEV[alert.severity];
  const fs = calculateFreshness(alert.effective);
  const fd = FRESH[fs];
  const ageMin = Math.round((Date.now() - new Date(alert.effective).getTime()) / 60000);

  const handleDownload = () => {
    const b = new Blob([JSON.stringify(alert, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u;
    a.download = `alert-${alert.id}.geojson`; a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <>
      <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:40 }}
           aria-hidden='true' onClick={onClose} />
      <div ref={panelRef} role='dialog' aria-modal='true'
           aria-labelledby='adp-headline' onKeyDown={handleKey}
           style={{ position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:'480px',
                    background:'#fff',boxShadow:'-4px 0 24px rgba(0,0,0,.15)',
                    zIndex:50,overflowY:'auto',display:'flex',flexDirection:'column' }}>
        <div style={{ padding:'16px 20px',borderBottom:`4px solid ${c.border}`,
                      background:c.bg,flexShrink:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
            <div>
              <span aria-label={`Severity: ${alert.severity}`}
                    style={{ display:'inline-block',padding:'2px 10px',borderRadius:'12px',
                             background:c.border,color:'#fff',fontSize:'0.75rem',fontWeight:700,
                             textTransform:'uppercase',marginBottom:'6px' }}>
                {alert.severity}
              </span>
              <span aria-label={fd.label === 'Stale' ? 'Status: Stale - information may be outdated' : `Status: ${fd.label}`}
                    style={{ display:'inline-flex',alignItems:'center',gap:'4px',marginLeft:'8px',
                             padding:'2px 8px',borderRadius:'12px',fontSize:'0.75rem',fontWeight:600,
                             color:fd.color,background:fd.bg,border:`1px solid ${fd.color}` }}>
                <span aria-hidden='true'>{fd.symbol}</span>
                {fd.label}
                {ageMin > 0 && <span style={{ fontWeight:400,opacity:0.8 }}>
                  {ageMin < 60 ? ` - ${ageMin}min ago` : ` - ${Math.floor(ageMin/60)}h ago`}</span>}
              </span>
            </div>
            <button ref={closeRef} onClick={onClose} aria-label='Close alert details'
                    style={{ background:'none',border:'none',cursor:'pointer',padding:'4px',
                             borderRadius:'4px',fontSize:'1.25rem',color:'#6b7280' }}>
              &times;
            </button>
          </div>
          <h2 id='adp-headline' style={{ fontSize:'1.1rem',fontWeight:700,color:c.text,marginTop:'4px' }}>
            {alert.event}
          </h2>
        </div>
        <div style={{ padding:'20px',flex:1 }}>
          {offlineMode && <p role='status' style={{ fontSize:'0.8rem',color:'#b45309',marginBottom:'12px',padding:'6px 10px',background:'#fffbeb',borderRadius:'4px' }}>Offline - this data may be outdated</p>}
          <p style={{ fontSize:'0.9rem',color:'#374151',marginBottom:'16px' }}>{alert.headline}</p>
          {alert.instruction && (
            <section aria-label='What to do' style={{ marginBottom:'16px',padding:'12px',background:'#eff6ff',borderRadius:'6px',borderLeft:'4px solid #1d4ed8' }}>
              <h3 style={{ fontSize:'0.8rem',textTransform:'uppercase',color:'#1d4ed8',marginBottom:'6px' }}>What to do</h3>
              <p style={{ fontSize:'0.9rem',fontWeight:500 }}>{alert.instruction}</p>
            </section>
          )}
          {alert.areas.length > 0 && (
            <section aria-label='Affected areas' style={{ marginBottom:'16px' }}>
              <h3 style={{ fontSize:'0.8rem',textTransform:'uppercase',color:'#6b7280',marginBottom:'6px' }}>Affected Areas</h3>
              <ul style={{ listStyle:'none',padding:0 }}>
                {alert.areas.map((area, i) => <li key={i} style={{ fontSize:'0.9rem',color:'#374151',padding:'2px 0' }}>{area}</li>)}
              </ul>
            </section>
          )}
          <section aria-label='Timing' style={{ marginBottom:'16px' }}>
            <h3 style={{ fontSize:'0.8rem',textTransform:'uppercase',color:'#6b7280',marginBottom:'6px' }}>Timing</h3>
            <dl style={{ fontSize:'0.85rem',display:'grid',gridTemplateColumns:'auto 1fr',gap:'4px 12px' }}>
              <dt style={{ fontWeight:600 }}>Issued:</dt>
              <dd><time dateTime={alert.effective}>{fmt(alert.effective)}</time></dd>
              <dt style={{ fontWeight:600 }}>Expires:</dt>
              <dd><time dateTime={alert.expires}>{fmt(alert.expires)}</time></dd>
            </dl>
          </section>
        </div>
        <div style={{ padding:'12px 20px',borderTop:'1px solid #e5e7eb',display:'flex',gap:'8px',flexShrink:0,background:'#f9fafb' }}>
          <button onClick={handleDownload} aria-label='Download alert as GeoJSON'
                  style={{ flex:1,padding:'8px',borderRadius:'6px',border:'1px solid #d1d5db',background:'#fff',cursor:'pointer',fontSize:'0.9rem' }}>Download</button>
          <button onClick={onClose} aria-label='Dismiss alert details'
                  style={{ flex:1,padding:'8px',borderRadius:'6px',background:'#1d4ed8',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.9rem',fontWeight:600 }}>Dismiss</button>
        </div>
      </div>
    </>
  );
}

export default AlertDetailsPanel;
