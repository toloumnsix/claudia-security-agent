// Eliza Security Agent - Compare View
// Side-by-side dual repository comparison

import React, { useState } from 'react';
import { ArrowLeftIcon, GitCompareIcon, XIcon } from '../components/ui/Icons';
import { ScoreCircle } from '../components/ScoreCircle';

interface CompareViewProps {
  leftRepo: {
    owner: string;
    name: string;
    fullName: string;
    description: string;
    score: number;
    tier: 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';
    subScores: {
      total: number;
      origin: number;
      build: number;
      security: number;
      author: number;
      activity: number;
      community: number;
      tier: string;
    };
  };
  onBack: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ leftRepo, onBack }) => {
  const [url, setUrl] = useState('');
  const [rightRepo, setRightRepo] = useState<{
    owner: string;
    name: string;
    fullName: string;
    description: string;
    score: number;
    tier: 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';
    subScores: {
      total: number;
      origin: number;
      build: number;
      security: number;
      author: number;
      activity: number;
      community: number;
      tier: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getScoreDelta = (left: number, right: number) => {
    const delta = left - right;
    if (delta === 0) return null;
    return { value: Math.abs(delta), better: delta > 0 ? 'left' : 'right' };
  };

  const subScoreLabels = [
    { key: 'origin', label: 'Origin' },
    { key: 'build', label: 'Build' },
    { key: 'security', label: 'Security' },
    { key: 'author', label: 'Author' },
    { key: 'activity', label: 'Activity' },
    { key: 'community', label: 'Community' },
  ];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0f1017' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{
          backgroundColor: '#0c0d12',
          borderColor: '#1c1f2e',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:bg-[#1c2a3a]"
          style={{
            backgroundColor: '#0d1117',
            color: '#475569',
            border: '1px solid #1c1f2e',
          }}
        >
          <ArrowLeftIcon size={14} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <GitCompareIcon size={18} style={{ color: '#7c3aed' }} />
          <span
            className="font-semibold text-sm"
            style={{ color: '#7c3aed' }}
          >
            Compare Mode
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
          <span>2-repository analysis</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left Repo Card */}
          <RepoCard
            repo={leftRepo}
            position="left"
            isActive={true}
          />

          {/* Right Repo Card - Placeholder */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: '#0a0b0f',
              border: '1px solid #1c1f2e',
            }}
          >
            <div className="flex flex-col items-center justify-center h-full py-8">
              <GitCompareIcon size={32} style={{ color: '#7c3aed', marginBottom: '12px' }} />
              <span
                className="text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                Select Second Repository
              </span>
              <span className="text-xs" style={{ color: '#475569' }}>
                Use the main app to compare repositories
              </span>
            </div>
          </div>
        </div>

        {/* Sub-score Comparison */}
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: '#0a0b0f', border: '1px solid #1c1f2e' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>
            Sub-score Breakdown
          </h3>
          <div className="space-y-3">
            {subScoreLabels.map(({ key, label }) => {
              const leftVal = leftRepo.subScores[key as keyof typeof leftRepo.subScores] as number;
              const getColor = (v: number) =>
                v >= 85 ? '#22c55e' :
                v >= 70 ? '#00d4ff' :
                v >= 50 ? '#f59e0b' :
                '#ef4444';

              return (
                <div key={key} className="flex items-center gap-4">
                  <span
                    className="text-xs font-mono w-20 uppercase"
                    style={{ color: '#475569' }}
                  >
                    {label}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1c1f2e' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${leftVal}%`, backgroundColor: getColor(leftVal) }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right" style={{ color: '#e2e8f0' }}>
                    {leftVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
interface RepoCardProps {
  repo: {
    fullName: string;
    description: string;
    score: number;
    tier: 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';
  };
  position: 'left' | 'right';
  isActive: boolean;
}

const RepoCard: React.FC<RepoCardProps> = ({
  repo,
  position,
  isActive,
}) => {
  const borderColor = position === 'left' ? '#00d4ff' : '#7c3aed';

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: '#0a0b0f',
        border: `1px solid ${isActive ? borderColor + '33' : '#1c1f2e'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <ScoreCircle score={repo.score} size={44} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>
            {repo.fullName}
          </div>
          <div className="text-xs truncate" style={{ color: '#94a3b8' }}>
            {repo.description?.slice(0, 60)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded"
          style={{
            backgroundColor: '#0d1117',
            color: repo.tier === 'VERIFIED' ? '#22c55e' :
                   repo.tier === 'TRUSTED' ? '#00d4ff' :
                   repo.tier === 'CAUTION' ? '#f59e0b' :
                   repo.tier === 'SUSPICIOUS' ? '#f97316' : '#ef4444',
            border: '1px solid currentColor',
          }}
        >
          {repo.tier.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
