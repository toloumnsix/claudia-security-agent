import React, { useState } from 'react';
import { ChevronLeftIcon, BarChartIcon, ChevronRightIcon, ChevronDownIcon, BotIcon } from '../ui/Icons';
import { TierBadge } from '../ui/Badge';
import { ScoreCircle } from './ScoreCircle';
import { ChatInterface } from './ChatInterface';
import { ScoreBreakdown, Threat, Author, Commit } from '../../data/mockRepoData';

interface RightPanelProps {
  score: ScoreBreakdown;
  repoName: string;
  description: string;
  language: string;
  topics?: string[];
  threats: Threat[];
  authors: Author[];
  commits: Commit[];
  createdAt: string;
  collapsed: boolean;
  onCollapse: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  score,
  repoName,
  description,
  language,
  topics = [],
  threats,
  authors,
  commits,
  createdAt,
  collapsed,
  onCollapse,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'origins', 'risk', 'dna', 'author'])
  );

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <aside
      className="h-full flex flex-col border-l panel-transition overflow-hidden relative"
      style={{
        width: collapsed ? '0px' : '380px',
        minWidth: collapsed ? '0px' : '380px',
        backgroundColor: 'var(--bg-right-panel)',
        borderColor: 'var(--border-panel)',
      }}
    >
      {/* Collapse button */}
      {!collapsed && (
        <button
          onClick={onCollapse}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full p-1 rounded-l hover:bg-[var(--bg-card)] transition-colors z-10"
          style={{ backgroundColor: 'var(--bg-right-panel)', color: 'var(--text-muted)' }}
        >
          <ChevronRightIcon size={16} />
        </button>
      )}

      {collapsed && (
        <button
          onClick={onCollapse}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-card)] transition-colors z-10"
          style={{ backgroundColor: 'var(--bg-right-panel)', color: 'var(--text-muted)' }}
        >
          <ChevronLeftIcon size={16} />
        </button>
      )}

      {!collapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-2">
              <BarChartIcon size={18} className="text-[var(--accent-primary)]" />
              <span className="font-space font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                AI Analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ScoreCircle score={score.total} size={48} />
              <TierBadge tier={score.tier} />
            </div>
          </div>

          {/* Source attribution */}
          <div
            className="px-4 py-2 text-[10px] font-mono border-b"
            style={{ borderColor: 'var(--border-panel)', color: 'var(--text-muted)' }}
          >
            SOURCE: <span className="text-[var(--accent-primary)]">ES</span> Eliza Security Agent | 1,247 tokens
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Sub-scores */}
            <SubScoreBar label="Origin" value={score.origin} />
            <SubScoreBar label="Build" value={score.build} />
            <SubScoreBar label="Security" value={score.security} />
            <SubScoreBar label="Author" value={score.author} />
            <SubScoreBar label="Activity" value={score.activity} />
            <SubScoreBar label="Community" value={score.community} />

            {/* Overview Section */}
            <AnalysisSection
              title="Overview"
              emoji="📋"
              expanded={expandedSections.has('overview')}
              onToggle={() => toggleSection('overview')}
            >
              <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {repoName}
                </span>{' '}
                {description}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono rounded"
                    style={{ backgroundColor: 'var(--accent-primary-dim)', color: 'var(--accent-primary)' }}
                  >
                    {language}
                  </span>
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono rounded"
                    style={{ backgroundColor: 'var(--accent-secondary-dim)', color: 'var(--accent-secondary)' }}
                  >
                    Created {formatDate(createdAt)}
                  </span>
                  <span
                    className="px-2 py-0.5 text-[10px] font-mono rounded"
                    style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', color: 'var(--text-muted)' }}
                  >
                    {commits.length} commits analyzed
                  </span>
                </div>
                {topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {topics.slice(0, 6).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 text-[10px] font-mono rounded"
                        style={{ backgroundColor: '#0d1117', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </AnalysisSection>

            {/* Origins Section */}
            <AnalysisSection
              title="Likely Origins"
              emoji="🔍"
              expanded={expandedSections.has('origins')}
              onToggle={() => toggleSection('origins')}
            >
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div
                  className="flex items-center gap-2 p-2 rounded mb-2"
                  style={{ backgroundColor: 'var(--color-success-dim)' }}
                >
                  <span className="text-[var(--color-success)]">✓</span>
                  <span className="text-xs">No significant external code matches detected</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Code originality analysis shows this repository contains primarily original
                  implementation with minor framework-related patterns.
                </p>
              </div>
            </AnalysisSection>

            {/* Risk Signals Section */}
            <AnalysisSection
              title="Risk Signals"
              emoji="⚠"
              expanded={expandedSections.has('risk')}
              onToggle={() => toggleSection('risk')}
              badge={threats.length > 0 ? threats.length.toString() : undefined}
              badgeVariant={threats.length > 0 ? 'red' : 'green'}
            >
              <div className="space-y-2">
                {threats.length === 0 ? (
                  <div
                    className="flex items-center gap-2 p-2 rounded"
                    style={{ backgroundColor: 'var(--color-success-dim)' }}
                  >
                    <span className="text-[var(--color-success)]">✓</span>
                    <span className="text-xs">No critical security issues detected</span>
                  </div>
                ) : (
                  threats.slice(0, 5).map((threat) => (
                    <div key={threat.id} className="flex items-start gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <span
                        className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: threat.severity === 'CRITICAL' ? 'var(--color-danger)' :
                            threat.severity === 'HIGH' ? '#f97316' :
                            threat.severity === 'MEDIUM' ? 'var(--color-warning)' : 'var(--text-muted)',
                          color: 'white',
                        }}
                      >
                        {threat.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {threat.description}
                        </p>
                        <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                          {threat.file}:{threat.line}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AnalysisSection>

            {/* Commit DNA Section */}
            <AnalysisSection
              title="Commit DNA"
              emoji="🔬"
              expanded={expandedSections.has('dna')}
              onToggle={() => toggleSection('dna')}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Pattern</span>
                  <span style={{ color: 'var(--text-primary)' }}>Consistent</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Author Entropy</span>
                  <span style={{ color: 'var(--text-primary)' }}>Low (good)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Last Activity</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatDate(commits[0]?.date || '')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Anomalies</span>
                  <span style={{ color: 'var(--color-success)' }}>None detected</span>
                </div>
              </div>
            </AnalysisSection>

            {/* Author Intel Section */}
            <AnalysisSection
              title="Author Intel"
              emoji="👤"
              expanded={expandedSections.has('author')}
              onToggle={() => toggleSection('author')}
            >
              <div className="space-y-3">
                {authors.map((author, i) => (
                  <div key={i} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'var(--accent-secondary)', color: 'white' }}
                      >
                        {author.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {author.name}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {author.email}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Repos:</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{author.totalRepos}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Avg Score:</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{author.avgScore}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Consistency:</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{author.consistency}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Member since:</span>{' '}
                        <span style={{ color: 'var(--text-primary)' }}>{new Date(author.joinedDate).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnalysisSection>
          </div>

          {/* Ask Eliza */}
          <div
            className="border-t p-4"
            style={{ borderColor: 'var(--border-panel)', backgroundColor: 'var(--bg-card)' }}
          >
            <ChatInterface repoName={repoName} />
          </div>
        </div>
      )}
    </aside>
  );
};

// Sub-score bar component
const SubScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const getColor = (val: number) => {
    if (val >= 85) return 'var(--color-success)';
    if (val >= 70) return 'var(--accent-primary)';
    if (val >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-space uppercase tracking-wider w-20" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: 'var(--border-panel)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: getColor(value) }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
};

// Collapsible section component
interface AnalysisSectionProps {
  title: string;
  emoji: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  badgeVariant?: 'green' | 'red' | 'cyan' | 'amber';
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  title,
  emoji,
  expanded,
  onToggle,
  children,
  badge,
  badgeVariant = 'cyan',
}) => {
  const badgeColors = {
    green: { bg: 'var(--color-success-dim)', text: 'var(--color-success)' },
    red: { bg: 'var(--color-danger-dim)', text: 'var(--color-danger)' },
    cyan: { bg: 'var(--accent-primary-dim)', text: 'var(--accent-primary)' },
    amber: { bg: 'var(--color-warning-dim)', text: 'var(--color-warning)' },
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 hover:bg-[var(--bg-card-hover)] -mx-2 px-2 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <span className="font-space font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {title}
          </span>
          {badge && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded"
              style={{ backgroundColor: badgeColors[badgeVariant].bg, color: badgeColors[badgeVariant].text }}
            >
              {badge}
            </span>
          )}
        </div>
        <ChevronDownIcon
          size={14}
          className="transition-transform"
          style={{
            color: 'var(--text-muted)',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </button>
      <div
        className="border-t mb-2"
        style={{ borderColor: 'var(--border-card)' }}
      />
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
};
