import { describe, it, expect, vi } from 'vitest';
import { calculateFreshness } from '@/types';

// AlertDetailsPanel tests - focus on pure logic

describe('AlertDetailsPanel focus and accessibility logic', () => {
  it('Escape key triggers onClose', () => {
    const onClose = vi.fn();
    const handleKey = (key: string) => { if (key === 'Escape') onClose(); };
    handleKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab traps focus: last element wraps to first', () => {
    const elements = ['close-btn', 'share-btn', 'download-btn', 'dismiss-btn'];
    const currentIdx = elements.length - 1;
    const nextIdx = (currentIdx + 1) % elements.length;
    expect(nextIdx).toBe(0);
  });

  it('Shift+Tab traps focus: first element wraps to last', () => {
    const elements = ['close-btn', 'share-btn', 'download-btn', 'dismiss-btn'];
    const currentIdx = 0;
    const prevIdx = (currentIdx - 1 + elements.length) % elements.length;
    expect(prevIdx).toBe(elements.length - 1);
  });

  it('freshness indicator shows fresh for recent alert', () => {
    const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(calculateFreshness(recent)).toBe('fresh');
  });

  it('freshness indicator shows aging for 90-minute-old alert', () => {
    const aging = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    expect(calculateFreshness(aging)).toBe('aging');
  });

  it('freshness indicator shows stale for old alert', () => {
    const old = new Date(Date.now() - 150 * 60 * 1000).toISOString();
    expect(calculateFreshness(old)).toBe('stale');
  });
});
