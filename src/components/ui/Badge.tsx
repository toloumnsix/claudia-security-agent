import React from 'react';

interface BadgeProps {
  variant?: 'cyan' | 'green' | 'red' | 'amber' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  size = 'sm',
  children,
  className = '',
}) => {
  const variants = {
    cyan: 'bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] border border-[var(--accent-primary)]',
    green: 'bg-[var(--color-success-dim)] text-[var(--color-success)] border border-[var(--color-success)]',
    red: 'bg-[var(--color-danger-dim)] text-[var(--color-danger)] border border-[var(--color-danger)]',
    amber: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)] border border-[var(--color-warning)]',
    purple: 'bg-[var(--accent-secondary-dim)] text-[var(--accent-secondary)] border border-[var(--accent-secondary)]',
    gray: 'bg-[rgba(71,85,105,0.2)] text-[var(--text-muted)] border border-[var(--text-muted)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span
      className={`
        inline-flex items-center
        font-mono font-semibold
        uppercase tracking-wider
        rounded-sm
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

interface ThreatBadgeProps {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export const ThreatBadge: React.FC<ThreatBadgeProps> = ({ severity }) => {
  const configs = {
    CRITICAL: { bg: '#0d1117', text: 'var(--color-danger)', border: 'var(--color-danger)' },
    HIGH: { bg: '#0d1117', text: '#f97316', border: '#f97316' },
    MEDIUM: { bg: '#0d1117', text: 'var(--color-warning)', border: 'var(--color-warning)' },
    LOW: { bg: '#0d1117', text: 'var(--text-muted)', border: 'var(--text-muted)' },
  };

  const config = configs[severity];

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm"
      style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
    >
      {severity}
    </span>
  );
};

interface TierBadgeProps {
  tier: 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';
  size?: 'sm' | 'md';
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {
  const configs = {
    VERIFIED: { bg: '#0d1117', text: 'var(--color-success)', label: '◆ VERIFIED', border: 'var(--color-success)' },
    TRUSTED: { bg: '#0d1117', text: 'var(--accent-primary)', label: '✦ TRUSTED', border: 'var(--accent-primary)' },
    CAUTION: { bg: '#0d1117', text: 'var(--color-warning)', label: '⚠ CAUTION', border: 'var(--color-warning)' },
    SUSPICIOUS: { bg: '#0d1117', text: '#f97316', label: '✗ SUSPICIOUS', border: '#f97316' },
    HIGH_RISK: { bg: '#0d1117', text: 'var(--color-danger)', label: '☠ HIGH RISK', border: 'var(--color-danger)' },
  };

  const config = configs[tier];
  const sizes = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded ${sizes} ${tier === 'HIGH_RISK' ? 'animate-pulse' : ''}`}
      style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  );
};
