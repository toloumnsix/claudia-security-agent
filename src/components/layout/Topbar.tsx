import React, { useState } from 'react';
import { GitHubIcon, TwitterIcon, DiscordIcon, BellIcon, ShareIcon, ScanIcon, ChevronDownIcon, BotIcon } from '../ui/Icons';

interface TopbarProps {
  scanCount?: { current: number; max: number };
  isScanning?: boolean;
  onScanClick?: () => void;
  onShareClick?: () => void;
  onAlertsClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  scanCount = { current: 3, max: 5 },
  isScanning = false,
  onScanClick,
  onShareClick,
  onAlertsClick,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className="h-12 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'var(--bg-topbar)',
        borderColor: 'var(--border-panel)',
      }}
    >
      {/* Left section - Logo and brand */}
      <div className="flex items-center gap-3">
        <img
          src="/p.jpeg"
          alt="WZ"
          className="w-7 h-7 rounded-md object-cover border"
          style={{ borderColor: 'var(--border-panel)' }}
        />
        <span className="font-space font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
          Claudia Security Agent
        </span>
        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}>
          v1.0
        </span>
      </div>

      {/* Center section - Platform links */}
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/HandInstance/claudia-security-agent"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded hover:bg-[var(--bg-card)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <GitHubIcon size={18} />
        </a>
        <a
          href="#"
          className="p-2 rounded hover:bg-[var(--bg-card)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <DiscordIcon size={18} />
        </a>
        <a
          href="https://x.com/elizasecurityag"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded hover:bg-[var(--bg-card)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <TwitterIcon size={18} />
        </a>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-3">
        {/* Scan counter badge */}
        <div
          className="px-2 py-1 font-mono text-xs border rounded"
          style={{
            borderColor: 'var(--accent-primary)',
            color: 'var(--accent-primary)',
          }}
        >
          [{scanCount.current}/{scanCount.max} scans/hr]
        </div>

        {/* Action buttons */}
        <button
          onClick={onScanClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all"
          style={{
            backgroundColor: isScanning ? 'var(--accent-secondary)' : 'var(--accent-primary)',
            color: 'var(--bg-base)',
          }}
        >
          <ScanIcon size={16} className={isScanning ? 'animate-pulse' : ''} />
          Scan
          <ChevronDownIcon size={14} />
        </button>

        <button
          onClick={onAlertsClick}
          className="p-2 rounded hover:bg-[var(--bg-card)] transition-colors relative"
          style={{ color: 'var(--text-secondary)' }}
        >
          <BellIcon size={18} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-danger)' }}
          />
        </button>

        <button
          onClick={onShareClick}
          className="p-2 rounded hover:bg-[var(--bg-card)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ShareIcon size={18} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-card)] transition-colors"
          >
            <img
              src="/p.jpeg"
              alt="WZ"
              className="w-6 h-6 rounded-full object-cover border"
              style={{ borderColor: 'var(--border-panel)' }}
            />
            <ChevronDownIcon size={14} className="text-[var(--text-muted)]" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 py-1 rounded border shadow-lg z-50"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
            >
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-card-hover)]"
                style={{ color: 'var(--text-primary)' }}
              >
                Settings
              </button>
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-card-hover)]"
                style={{ color: 'var(--text-primary)' }}
              >
                API Keys
              </button>
              <div className="my-1" style={{ borderColor: 'var(--border-card)', borderTopWidth: '1px' }} />
              <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-card-hover)]"
                style={{ color: 'var(--color-danger)' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
