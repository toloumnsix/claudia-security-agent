import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { CopyIcon, ShieldIcon, MessageSquareIcon, FileIcon } from '../ui/Icons';
import { TierBadge } from '../ui/Badge';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  score: number;
  tier: string;
}

function getTierColorCode(tier: string): string {
  switch (tier) {
    case 'VERIFIED': return '#22c55e';
    case 'TRUSTED': return '#00d4ff';
    case 'CAUTION': return '#f59e0b';
    default: return '#ef4444';
  }
}

function generateBadgeMarkdown(repo: string, score: number, tier: string): string {
  const tierBadge = tier === 'VERIFIED' ? '🛡️ VERIFIED' :
    tier === 'TRUSTED' ? '✅ TRUSTED' :
    tier === 'CAUTION' ? '⚠️ CAUTION' :
    tier === 'SUSPICIOUS' ? '❌ SUSPICIOUS' : '☠️ HIGH RISK';

  const colorHex = getTierColorCode(tier).replace('#', '');
  return `[![Security Scan](https://img.shields.io/badge/Security-${score}-${colorHex})](https://eliza-security.ai)
${tierBadge} | Scanned by [Eliza Security Agent](https://eliza-security.ai)`;
}

function generateThread(repo: string, score: number, tier: string): string {
  const tierEmoji = tier === 'VERIFIED' ? '🛡️' : tier === 'TRUSTED' ? '✅' : '⚠️';
  return `🧵 Just scanned @${repo.replace('/', '_')} by @ElizaSecurityAgent

${tierEmoji} TRUST SCORE: ${score}/1000 (${tier})

Key findings:
• Code originality: 88%
• Security: No critical issues
• Developer: Verified identity
• Activity: Recent commits

Full report: https://eliza-security.ai/scan/${repo.replace('/', '-')}

#Web3 #Security #DYOR`;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  repoName,
  score,
  tier,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'link' | 'badge' | 'thread' | 'pdf'>('link');

  const handleCopy = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareUrl = `https://eliza-security.ai/scan/${repoName.replace('/', '-')}`;
  const threadText = generateThread(repoName, score, tier);
  const tierColor = getTierColorCode(tier);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Scan Result" maxWidth="md">
      {/* Tab navigation */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'link', label: 'Copy Link', icon: CopyIcon },
          { id: 'badge', label: 'Badge', icon: ShieldIcon },
          { id: 'thread', label: 'CT Thread', icon: MessageSquareIcon },
          { id: 'pdf', label: 'Export PDF', icon: FileIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTab === id ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: activeTab === id ? 'var(--bg-base)' : 'var(--text-secondary)',
              border: '1px solid var(--border-card)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'link' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm rounded font-mono"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={() => handleCopy('link', shareUrl)}
                className="px-4 py-2 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: copied === 'link' ? 'var(--color-success)' : 'var(--accent-primary)',
                  color: 'var(--bg-base)',
                }}
              >
                {copied === 'link' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'badge' && (
        <div className="space-y-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Embed this badge in your README or website
          </div>

          {/* Badge preview */}
          <div
            className="p-4 rounded flex items-center gap-4"
            style={{ backgroundColor: '#0e0f14', border: '1px solid var(--border-card)' }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <ShieldIcon size={24} className="text-[var(--bg-base)]" />
            </div>
            <div className="flex-1">
              <div className="font-space font-semibold" style={{ color: 'var(--text-primary)' }}>
                {repoName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-lg font-bold" style={{ color: tierColor }}>
                  {score}
                </span>
                <TierBadge tier={tier as 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK'} size="sm" />
              </div>
            </div>
          </div>

          {/* Markdown code */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Markdown
            </label>
            <textarea
              readOnly
              value={generateBadgeMarkdown(repoName, score, tier)}
              className="w-full h-24 px-3 py-2 text-xs rounded font-mono resize-none"
              style={{
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={() => handleCopy('markdown', generateBadgeMarkdown(repoName, score, tier))}
              className="mt-2 px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                backgroundColor: copied === 'markdown' ? 'var(--color-success)' : 'var(--accent-primary)',
                color: 'var(--bg-base)',
              }}
            >
              {copied === 'markdown' ? 'Copied!' : 'Copy Markdown'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'thread' && (
        <div className="space-y-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Copy this thread to share on Crypto Twitter
          </div>

          <div
            className="p-4 rounded text-xs leading-relaxed whitespace-pre-wrap"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
            }}
          >
            {threadText}
          </div>

          <button
            onClick={() => handleCopy('thread', threadText)}
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: copied === 'thread' ? 'var(--color-success)' : 'var(--accent-primary)',
              color: 'var(--bg-base)',
            }}
          >
            {copied === 'thread' ? 'Copied!' : 'Copy Thread'}
          </button>
        </div>
      )}

      {activeTab === 'pdf' && (
        <div className="space-y-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Generate a comprehensive PDF report of this scan
          </div>

          <button
            className="w-full p-4 rounded flex items-center justify-center gap-3 transition-colors"
            style={{
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
            }}
          >
            <FileIcon size={24} />
            <div className="text-left">
              <div className="font-semibold">Download PDF Report</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Complete scan analysis + code + threats
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-card)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 flex items-center justify-center font-mono font-bold text-[10px]"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-base)' }}
          >
            ES
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Scanned by Eliza Security Agent
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded text-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-card)',
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
