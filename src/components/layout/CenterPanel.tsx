import React, { useState, useMemo } from 'react';
import {
  GitHubIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  CompareIcon,
  UsersIcon,
  ShareIcon,
  CopyIcon,
  GitCommitIcon,
  DatabaseIcon,
} from '../ui/Icons';
import { ThreatBadge } from '../ui/Badge';
import { CodeViewer } from '../code-viewer/CodeViewer';
import { Threat, Commit, Dependency } from '../../data/mockRepoData';

type TabType = 'diff' | 'threats' | 'history' | 'dependencies';

interface CenterPanelProps {
  repoName?: string;
  fileName?: string;
  fileContent?: string;
  threats: Threat[];
  commits: Commit[];
  dependencies: Dependency[];
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  threatCount?: number;
  compareCount?: number;
  authorCount?: number;
  onShareClick?: () => void;
  onCompareClick?: () => void;
  onExternalLink?: () => void;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  repoName = '',
  fileName = '',
  fileContent = '',
  threats = [],
  commits = [],
  dependencies = [],
  activeTab = 'diff',
  onTabChange,
  threatCount = 0,
  compareCount = 0,
  authorCount = 0,
  onShareClick,
  onCompareClick,
  onExternalLink,
}) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'diff', label: 'Diff Viewer' },
    { id: 'threats', label: 'Threats' },
    { id: 'history', label: 'Commit History' },
    { id: 'dependencies', label: 'Dependencies' },
  ];

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (fileContent) {
      await navigator.clipboard.writeText(fileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-center-panel)' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--bg-card)' }}
      >
        {/* Left side - GitHub link and repo name */}
        <div className="flex items-center gap-3">
          <a
            href={onExternalLink ? '#' : `https://github.com/${repoName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-[var(--bg-card-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <GitHubIcon size={16} />
          </a>
          <span className="font-space text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {repoName}
          </span>
        </div>

        {/* Right side - Quick stats and share */}
        <div className="flex items-center gap-2">
          {threatCount > 0 && (
            <button
              onClick={() => onTabChange?.('threats')}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-danger-dim)',
                color: 'var(--color-danger)',
              }}
            >
              <AlertTriangleIcon size={12} />
              {threatCount}
            </button>
          )}
          {compareCount > 0 && (
            <button
              onClick={onCompareClick}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: 'var(--accent-secondary-dim)',
                color: 'var(--accent-secondary)',
              }}
            >
              <CompareIcon size={12} />
              {compareCount}
            </button>
          )}
          {authorCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-info-dim)',
                color: 'var(--color-info)',
              }}
            >
              <UsersIcon size={12} />
              {authorCount}
            </div>
          )}
          <button
            onClick={onShareClick}
            className="p-1.5 rounded hover:bg-[var(--bg-card-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ShareIcon size={16} />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div
        className="flex items-center px-4 border-b"
        style={{ borderColor: 'var(--border-panel)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`px-4 py-3 text-sm font-space font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-[var(--accent-primary)]' : 'border-transparent'
            }`}
            style={{
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'diff' && (
          <div className="h-full flex flex-col">
            {/* File header */}
            <div
              className="flex items-center justify-between px-4 py-2 border-b"
              style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                  {fileName}
                </span>
                {threats.length > 0 ? (
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded"
                    style={{
                      backgroundColor: 'var(--color-danger-dim)',
                      color: 'var(--color-danger)',
                    }}
                  >
                    {threats.length} matches found
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded"
                    style={{
                      backgroundColor: 'var(--color-success-dim)',
                      color: 'var(--color-success)',
                    }}
                  >
                    No matches found
                  </span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-card-hover)] transition-colors"
                style={{ color: copied ? 'var(--color-success)' : 'var(--text-muted)' }}
              >
                <CopyIcon size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {/* Code viewer */}
            <CodeViewer code={fileContent} threats={threats} language="typescript" />
          </div>
        )}

        {activeTab === 'threats' && (
          <ThreatsTab threats={threats} />
        )}

        {activeTab === 'history' && (
          <CommitHistoryTab commits={commits} />
        )}

        {activeTab === 'dependencies' && (
          <DependenciesTab dependencies={dependencies} />
        )}
      </div>
    </main>
  );
};

// Threats Tab Component
const ThreatsTab: React.FC<{ threats: Threat[] }> = ({ threats }) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredThreats = filter === 'all'
    ? threats
    : threats.filter((t) => t.severity.toLowerCase() === filter);

  return (
    <div className="p-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
          <button
            key={severity}
            onClick={() => setFilter(severity)}
            className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors"
            style={{
              backgroundColor: filter === severity ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: filter === severity ? 'var(--bg-base)' : 'var(--text-secondary)',
              border: '1px solid var(--border-card)',
            }}
          >
            {severity}
          </button>
        ))}
      </div>

      {/* Threats table */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border-card)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-card)' }}>
              <th className="px-4 py-2 text-left text-xs font-space font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Severity
              </th>
              <th className="px-4 py-2 text-left text-xs font-space font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                File
              </th>
              <th className="px-4 py-2 text-left text-xs font-space font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Line
              </th>
              <th className="px-4 py-2 text-left text-xs font-space font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Pattern
              </th>
              <th className="px-4 py-2 text-left text-xs font-space font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Description
              </th>
              <th className="px-4 py-2 text-left text-xs font-space font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                Fix
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredThreats.map((threat) => (
              <tr
                key={threat.id}
                className="border-t"
                style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--bg-base)' }}
              >
                <td className="px-4 py-3">
                  <ThreatBadge severity={threat.severity} />
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                  {threat.file}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {threat.line}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-warning)' }}>
                  {threat.pattern}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {threat.description}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {threat.fix}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Commit History Tab Component
const CommitHistoryTab: React.FC<{ commits: Commit[] }> = ({ commits }) => {
  return (
    <div className="p-4">
      {/* Mini activity heatmap */}
      <div className="mb-6 p-4 rounded" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
        <div className="text-xs font-space font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          ACTIVITY HEATMAP (LAST 30 DAYS)
        </div>
        <div className="grid grid-cols-30 gap-1">
          {Array.from({ length: 30 }).map((_, i) => {
            const intensity = Math.random();
            return (
              <div
                key={i}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: intensity > 0.7
                    ? 'var(--color-success)'
                    : intensity > 0.4
                    ? 'rgba(34, 197, 94, 0.5)'
                    : intensity > 0.1
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'var(--bg-base)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Commit list */}
      <div className="space-y-2">
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className="flex items-start gap-3 p-3 rounded"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
          >
            <GitCommitIcon size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {commit.message}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="font-mono">{commit.hash}</span>
                <span>·</span>
                <span>{commit.author}</span>
                <span>·</span>
                <span>{new Date(commit.date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--color-success)]">+{commit.additions}</span>
              <span className="text-[var(--color-danger)]">-{commit.deletions}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dependencies Tab Component
const DependenciesTab: React.FC<{ dependencies: Dependency[] }> = ({ dependencies }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'trusted': return 'var(--color-success)';
      case 'suspicious': return 'var(--color-danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="p-4">
      {/* Force graph visualization placeholder */}
      <div
        className="mb-6 p-4 rounded flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', minHeight: '200px' }}
      >
        <div className="text-center">
          <DatabaseIcon size={48} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Dependency Graph
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {dependencies.length} dependencies loaded
          </div>
        </div>
      </div>

      {/* Dependencies list */}
      <div className="space-y-2">
        {dependencies.map((dep, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getHealthColor(dep.health) }}
              />
              <div>
                <div className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>
                  {dep.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {dep.version}
                </div>
              </div>
            </div>
            <span
              className="px-2 py-0.5 text-[10px] font-mono uppercase rounded"
              style={{
                backgroundColor: dep.type === 'prod' ? 'var(--accent-primary-dim)' : 'var(--bg-base)',
                color: dep.type === 'prod' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              {dep.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
