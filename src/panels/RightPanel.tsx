// Eliza Security Agent - Right Panel Component
// AI Analysis with score, sections, and chat

import React, { useState } from 'react';
import { ScoreCircle } from '../components/ScoreCircle';
import { ChatInterface } from '../components/analysis/ChatInterface';
import type { Repository, CommitDNA } from '../data/mockRepoData';

interface ScoreBreakdown {
  total: number;
  origin: number;
  build: number;
  security: number;
  author: number;
  activity: number;
  community: number;
  tier: 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';
}

interface Threat {
  id: string;
  severity: string;
  file: string;
  line: number | null;
  pattern: string;
  description: string;
}

interface Author {
  name: string;
  email: string;
  joinedDate: string;
  totalRepos: number;
  avgScore: number;
  consistency: 'high' | 'medium' | 'low';
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface RightPanelProps {
  collapsed: boolean;
  onCollapse: () => void;
  repository: Repository;
  score: ScoreBreakdown;
  repoName: string;
  description: string;
  language: string;
  topics?: string[];
  threats: Threat[];
  authors: Author[];
  commits: Commit[];
  createdAt: string;
  overview?: string;
  origins?: string;
  commitDNA?: CommitDNA;
  activeFile?: {
    path: string;
    content?: string;
  } | null;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  collapsed,
  onCollapse,
  repository,
  score,
  repoName,
  description,
  language,
  topics = [],
  threats,
  authors,
  commits,
  createdAt,
  overview,
  origins,
  commitDNA,
  activeFile,
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

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      VERIFIED: '#22c55e',
      TRUSTED: '#00d4ff',
      CAUTION: '#f59e0b',
      SUSPICIOUS: '#f97316',
      HIGH_RISK: '#ef4444',
    };
    return colors[tier] || '#94a3b8';
  };

  if (collapsed) {
    return (
      <button
        onClick={onCollapse}
        className="w-6 flex-shrink-0 border-none cursor-pointer text-sm"
        style={{ backgroundColor: '#0c0d12', color: '#475569' }}
      >
        ‹
      </button>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden border-l relative"
      style={{
        width: 380,
        minWidth: 380,
        backgroundColor: '#0c0d12',
        borderColor: '#1c1f2e',
      }}
    >
      {/* Collapse button */}
      <button
        onClick={onCollapse}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full p-1 rounded-l border"
        style={{ backgroundColor: '#0c0d12', color: '#475569', borderColor: '#1c1f2e' }}
      >
        ›
      </button>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#1c1f2e', backgroundColor: '#111420' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#00d4ff' }}>📊</span>
          <span className="font-semibold text-sm">AI Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <ScoreCircle score={score.total} size={48} />
          <span
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border"
            style={{
              backgroundColor: '#0d1117',
              color: getTierColor(score.tier),
              borderColor: getTierColor(score.tier),
            }}
          >
            {score.tier === 'VERIFIED' ? '◆ VERIFIED' :
              score.tier === 'TRUSTED' ? '✦ TRUSTED' :
                score.tier === 'CAUTION' ? '⚠ CAUTION' :
                  score.tier === 'SUSPICIOUS' ? '✗ SUSPICIOUS' :
                    '☠ HIGH RISK'}
          </span>
        </div>
      </div>

      {/* Source attribution */}
      <div
        className="px-4 py-2 text-[10px] border-b"
        style={{
          borderColor: '#1c1f2e',
          color: '#475569',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        SOURCE: <span style={{ color: '#00d4ff' }}>LIVE</span> GitHub + MegaLLM context
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Sub-scores */}
        <div className="space-y-2">
          {[
            { label: 'Origin', value: score.origin },
            { label: 'Build', value: score.build },
            { label: 'Security', value: score.security },
            { label: 'Author', value: score.author },
            { label: 'Activity', value: score.activity },
            { label: 'Community', value: score.community },
          ].map(({ label, value }) => {
            const getColor = (v: number) =>
              v >= 85 ? '#22c55e' : v >= 70 ? '#00d4ff' : v >= 50 ? '#f59e0b' : '#ef4444';

            return (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="text-[10px] uppercase tracking-wider w-20"
                  style={{ color: '#475569' }}
                >
                  {label}
                </span>
                <div
                  className="flex-1 h-1 rounded-full"
                  style={{ backgroundColor: '#1c1f2e' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: getColor(value) }}
                  />
                </div>
                <span className="text-xs font-mono w-8 text-right" style={{ color: '#e2e8f0' }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Overview Section */}
        <AnalysisSection
          title="Overview"
          emoji="📋"
          expanded={expandedSections.has('overview')}
          onToggle={() => toggleSection('overview')}
        >
          <div className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
            {overview || (
              <>
                <span className="font-semibold" style={{ color: '#e2e8f0' }}>
                  {repoName}
                </span>{' '}
                {description}
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="px-2 py-0.5 text-[10px] font-mono rounded"
                style={{ backgroundColor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff' }}
              >
                {language}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-mono rounded"
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}
              >
                Created {formatDate(createdAt)}
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-mono rounded"
                style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', color: '#475569' }}
              >
                {commits.length} commits
              </span>
            </div>
            {topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topics.slice(0, 6).map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-0.5 text-[10px] font-mono rounded"
                    style={{
                      backgroundColor: '#0d1117',
                      color: '#00d4ff',
                      border: '1px solid #00d4ff',
                    }}
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
          <div className="text-sm" style={{ color: '#94a3b8' }}>
            <div
              className="flex items-center gap-2 p-2 rounded mb-2"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
            >
              <span style={{ color: '#22c55e' }}>✓</span>
              <span className="text-xs">Origin estimate generated from live GitHub metadata and sampled files</span>
            </div>
            <p className="text-xs" style={{ color: '#475569' }}>
              {origins || 'Live origin analysis is not available for this repository yet.'}
            </p>
          </div>
        </AnalysisSection>

        {/* Risk Signals Section */}
        <AnalysisSection
          title="Risk Signals"
          emoji="⚠"
          expanded={expandedSections.has('risk')}
          onToggle={() => toggleSection('risk')}
          badge={threats.filter(t => t.severity !== 'INFO').length.toString()}
          badgeVariant="red"
        >
          <div className="space-y-2">
            {threats.filter(t => t.severity !== 'INFO').slice(0, 5).map((threat) => (
              <div
                key={threat.id}
                className="flex items-start gap-2 p-2 rounded"
                style={{ backgroundColor: '#111420' }}
              >
                <span
                  className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: '#0d1117',
                    color: threat.severity === 'CRITICAL' ? '#ef4444' :
                      threat.severity === 'HIGH' ? '#f97316' :
                        threat.severity === 'MEDIUM' ? '#f59e0b' : '#475569',
                    border: `1px solid ${threat.severity === 'CRITICAL' ? '#ef4444' :
                      threat.severity === 'HIGH' ? '#f97316' :
                        threat.severity === 'MEDIUM' ? '#f59e0b' : '#475569'}`,
                  }}
                >
                  {threat.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                    {threat.description}
                  </p>
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#475569' }}>
                    {threat.file}{threat.line && `:${threat.line}`}
                  </p>
                </div>
              </div>
            ))}
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
              <span style={{ color: '#475569' }}>Pattern</span>
              <span style={{ color: '#e2e8f0' }}>{commitDNA?.pattern || 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#475569' }}>Anomaly Score</span>
              <span style={{ color: '#22c55e' }}>{commitDNA?.anomalyScore ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#475569' }}>Contributor Spread</span>
              <span style={{ color: '#e2e8f0' }}>{commitDNA?.authorEntropy || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#475569' }}>Last Activity</span>
              <span style={{ color: '#e2e8f0' }}>{commitDNA?.lastActivity ? formatDate(commitDNA.lastActivity) : formatDate(commits[0]?.date || '')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: '#475569' }}>Commit Window</span>
              <span style={{ color: '#e2e8f0' }}>{commitDNA?.commitTimes || 'N/A'}</span>
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
              <div key={i} className="p-2 rounded" style={{ backgroundColor: '#111420' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                  >
                    {author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                      {author.name}
                    </div>
                    <div className="text-[10px]" style={{ color: '#475569' }}>
                      {author.email}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span style={{ color: '#475569' }}>Repos:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{author.totalRepos}</span>
                  </div>
                  <div>
                    <span style={{ color: '#475569' }}>Avg Score:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{author.avgScore}</span>
                  </div>
                  <div>
                    <span style={{ color: '#475569' }}>Consistency:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{author.consistency}</span>
                  </div>
                  <div>
                    <span style={{ color: '#475569' }}>Member since:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{new Date(author.joinedDate).getFullYear()}</span>
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
        style={{ borderColor: '#1c1f2e', backgroundColor: '#111420' }}
      >
        <ChatInterface repoName={repoName} repository={repository} activeFile={activeFile} />
      </div>
    </div>
  );
};

// Analysis Section Component
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
    green: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
    red: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
    cyan: { bg: 'rgba(0, 212, 255, 0.1)', text: '#00d4ff' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 hover:bg-[#161925] -mx-2 px-2 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
            {title}
          </span>
          {badge && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded"
              style={{
                backgroundColor: badgeColors[badgeVariant].bg,
                color: badgeColors[badgeVariant].text,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <span
          className="transition-transform"
          style={{
            color: '#475569',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          ▾
        </span>
      </button>
      <div className="border-t mb-2" style={{ borderColor: '#1a1d2e' }} />
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
};
