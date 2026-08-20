'use client';

import React, { useState } from 'react';
import { SourceProvenance, VerificationLevel } from '@/types';

interface SourceBadgeProps {
  source: SourceProvenance;
  size?: 'small' | 'medium' | 'large';
  expandable?: boolean;
}

const BORDER_COLOR: Record<VerificationLevel, string> = {
  verified: '#15803d',
  unverified: '#b45309',
  suspicious: '#b91c1c',
};

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <path d='M3 8l3.5 3.5L13 4' stroke='currentColor' strokeWidth='2'
            strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width={14} height={14} viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <circle cx='8' cy='8' r='6.5' stroke='currentColor' strokeWidth='1.5' />
      <path d='M8 7v5M8 5v.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width={14} height={14} viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <path d='M8 2L14.5 13.5H1.5L8 2Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
      <path d='M8 6v4M8 11.5v.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  );
}

export function SourceBadge({ source, size = 'medium', expandable = true }: SourceBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const isOfficial = source.classification === 'official';
  const vd = source.verificationDetails;
  const verificationLevel: VerificationLevel =
    vd.listedInOfficialRegistry && vd.httpsVerified ? 'verified'
    : vd.domainReputation === 'low' ? 'suspicious'
    : 'unverified';
  const borderColor = BORDER_COLOR[verificationLevel];
  const ariaLabel = `${isOfficial ? 'Official' : 'Community'} source — ${verificationLevel}. ${source.displayName}`;

  const badge = (
    <span
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: size === 'small' ? '2px 8px' : size === 'large' ? '4px 14px' : '3px 10px',
        borderRadius: '12px', fontWeight: 700,
        fontSize: size === 'small' ? '0.7rem' : size === 'large' ? '0.9rem' : '0.8rem',
        background: isOfficial ? '#1e3a5f' : '#374151',
        color: '#ffffff',
        border: `2px solid ${borderColor}`,
        cursor: expandable ? 'pointer' : 'default',
      }}
    >
      {verificationLevel === 'suspicious' ? <WarningIcon /> : isOfficial ? <CheckIcon /> : <InfoIcon />}
      {isOfficial ? 'Official' : 'Community'}
    </span>
  );

  if (!expandable) return badge;

  return (
    <details onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
             style={{ display: 'inline-block' }}>
      <summary style={{ listStyle: 'none', outline: 'none' }} aria-expanded={expanded}>
        {badge}
      </summary>
      <div role='region' aria-label='Source verification details'
           style={{ marginTop: '8px', padding: '12px', background: '#fff',
                    border: '1px solid #e5e7eb', borderRadius: '8px',
                    boxShadow: '0 1px 6px rgba(0,0,0,.1)', minWidth: '220px', maxWidth: '320px' }}>
        <p style={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{source.displayName}</p>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem' }}>
          <li style={{ color: vd.httpsVerified ? '#15803d' : '#b91c1c' }}>
            {vd.httpsVerified ? '✓' : '✕'} HTTPS verified
          </li>
          <li style={{ marginTop: '4px' }}>
            Domain reputation: <strong style={{ color: vd.domainReputation === 'high' ? '#15803d' : vd.domainReputation === 'medium' ? '#b45309' : '#b91c1c' }}>{vd.domainReputation}</strong>
          </li>
          {vd.listedInOfficialRegistry && (
            <li style={{ marginTop: '4px', color: '#15803d' }}>✓ Listed in: {vd.registryName ?? 'official registry'}</li>
          )}
        </ul>
        <a href={source.url} target='_blank' rel='noopener noreferrer'
           style={{ marginTop: '8px', display: 'block', fontSize: '0.75rem', color: '#1d4ed8' }}
           aria-label={`Visit source: ${source.url}`}>
          {source.url}
        </a>
      </div>
    </details>
  );
}

export default SourceBadge;
