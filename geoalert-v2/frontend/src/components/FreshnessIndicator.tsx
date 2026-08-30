import React from 'react';
import { calculateFreshness, FreshnessState, ISO8601Timestamp } from '@/types';

interface FreshnessIndicatorProps {
  effectiveTime: ISO8601Timestamp;
  expiresTime: ISO8601Timestamp;
  showTimestamps?: boolean;
  className?: string;
}

interface FreshnessConfig {
  label: string;
  symbol: string;
  color: string;
  bg: string;
  ariaLabel: string;
}

const FRESHNESS_CONFIG: Record<FreshnessState, FreshnessConfig> = {
  fresh: {
    label: 'Current',
    symbol: '✓',
    color: '#15803d',
    bg: '#f0fdf4',
    ariaLabel: 'Status: Current',
  },
  aging: {
    label: 'Aging',
    symbol: '⚠',
    color: '#b45309',
    bg: '#fffbeb',
    ariaLabel: 'Status: Aging',
  },
  stale: {
    label: 'Stale',
    symbol: '✕',
    color: '#b91c1c',
    bg: '#fef2f2',
    ariaLabel: 'Status: Stale — information may be outdated',
  },
};

function formatTime(iso: ISO8601Timestamp): { utc: string; local: string } {
  try {
    const d = new Date(iso);
    return {
      utc: d.toUTCString(),
      local: d.toLocaleString(),
    };
  } catch {
    return { utc: iso, local: iso };
  }
}

function getAgeText(effectiveTime: ISO8601Timestamp): string {
  const ageMinutes = (Date.now() - new Date(effectiveTime).getTime()) / 60000;
  if (ageMinutes < 60) return `${Math.round(ageMinutes)}min ago`;
  const hours = Math.floor(ageMinutes / 60);
  const mins = Math.round(ageMinutes % 60);
  return mins > 0 ? `${hours}h ${mins}min ago` : `${hours}h ago`;
}

export function FreshnessIndicator({
  effectiveTime,
  expiresTime,
  showTimestamps = true,
  className = '',
}: FreshnessIndicatorProps) {
  const state = calculateFreshness(effectiveTime);
  const config = FRESHNESS_CONFIG[state];
  const ageText = getAgeText(effectiveTime);
  const effective = formatTime(effectiveTime);
  const expires = formatTime(expiresTime);

  return (
    <div className={`freshness-indicator ${className}`} role="status">
      {/* Main freshness badge */}
      <span
        aria-label={config.ariaLabel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: config.color,
          background: config.bg,
          border: `1px solid ${config.color}`,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '0.9em' }}>{config.symbol}</span>
        {config.label}
        <span style={{ fontWeight: 400, fontSize: '0.75em', color: config.color, opacity: 0.85 }}>
          — {ageText}
        </span>
      </span>

      {/* Timestamps — visible for screen readers and detail views */}
      {showTimestamps && (
        <dl
          style={{
            marginTop: '6px',
            fontSize: '0.75rem',
            color: '#6b7280',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '2px 8px',
          }}
        >
          <dt style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Issued:</dt>
          <dd>
            <time dateTime={effectiveTime}>{effective.utc}</time>
            <span style={{ color: '#9ca3af', marginLeft: '4px' }}>({effective.local})</span>
          </dd>
          <dt style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Expires:</dt>
          <dd>
            <time dateTime={expiresTime}>{expires.utc}</time>
            <span style={{ color: '#9ca3af', marginLeft: '4px' }}>({expires.local})</span>
          </dd>
        </dl>
      )}
    </div>
  );
}

export default FreshnessIndicator;
