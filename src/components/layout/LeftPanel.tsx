import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, TrendingDownIcon } from '../ui/Icons';
import { TierBadge } from '../ui/Badge';
import { FileTree, FileTreeItemData } from '../file-tree/FileTree';
import { RecentScan } from '../../data/mockRepoData';

interface LeftPanelProps {
  repoName?: string;
  fileCount?: number;
  overallSimilarity?: number;
  files: FileTreeItemData[];
  recentScans: RecentScan[];
  activeFile?: string;
  collapsed: boolean;
  onCollapse: () => void;
  onFileSelect: (file: FileTreeItemData) => void;
  onRecentScanSelect: (scan: RecentScan) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  repoName = '',
  fileCount = 0,
  overallSimilarity = 0,
  files = [],
  recentScans = [],
  activeFile,
  collapsed,
  onCollapse,
  onFileSelect,
  onRecentScanSelect,
}) => {
  const getSimilarityColor = (similarity: number): string => {
    if (similarity === 0) return 'var(--text-muted)';
    if (similarity <= 30) return 'var(--color-warning)';
    if (similarity <= 70) return 'var(--color-danger)';
    return '#dc2626';
  };

  const getScoreBadgeVariant = (score: number): 'green' | 'cyan' | 'amber' | 'red' => {
    if (score >= 850) return 'green';
    if (score >= 700) return 'cyan';
    if (score >= 500) return 'amber';
    return 'red';
  };

  return (
    <aside
      className="h-full flex flex-col border-r panel-transition overflow-hidden"
      style={{
        width: collapsed ? '0px' : '260px',
        minWidth: collapsed ? '0px' : '260px',
        backgroundColor: 'var(--bg-left-panel)',
        borderColor: 'var(--border-panel)',
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: 'var(--border-panel)' }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src="/p.jpeg"
              alt="WZ"
              className="w-6 h-6 rounded-md object-cover border flex-shrink-0"
              style={{ borderColor: 'var(--border-panel)' }}
            />
            <span className="font-space font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              Eliza Security
            </span>
          </div>
          <button
            onClick={onCollapse}
            className="p-1 rounded hover:bg-[var(--bg-card)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeftIcon size={16} />
          </button>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto">
            {/* Repo info */}
            {repoName && (
              <div className="px-3 py-3">
                <div className="font-space font-semibold text-sm mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {repoName}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {fileCount} files
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    ·
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: getSimilarityColor(overallSimilarity) }}
                  >
                    {overallSimilarity}% similarity
                  </span>
                </div>
              </div>
            )}

            {/* File tree */}
            <div className="border-t" style={{ borderColor: 'var(--border-panel)' }}>
              <FileTree
                files={files}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
              />
            </div>

            {/* Recent scans */}
            {recentScans.length > 0 && (
              <div className="border-t p-3" style={{ borderColor: 'var(--border-panel)' }}>
                <div
                  className="text-[10px] font-space font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Recent Scans
                </div>
                <div className="flex flex-col gap-1">
                  {recentScans.slice(0, 5).map((scan) => (
                    <button
                      key={scan.id}
                      onClick={() => onRecentScanSelect(scan)}
                      className="flex items-center justify-between p-2 rounded transition-colors hover:bg-[var(--bg-card-hover)]"
                      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                          {scan.fullName}
                        </span>
                        {scan.trending === 'up' && (
                          <TrendingUpIcon size={12} className="text-[var(--color-success)] flex-shrink-0" />
                        )}
                        {scan.trending === 'down' && (
                          <TrendingDownIcon size={12} className="text-[var(--color-danger)] flex-shrink-0" />
                        )}
                      </div>
                      <TierBadge tier={scan.tier as any} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapse button (when collapsed) */}
      {collapsed && (
        <button
          onClick={onCollapse}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--bg-card)] transition-colors z-10"
          style={{ backgroundColor: 'var(--bg-left-panel)', color: 'var(--text-muted)' }}
        >
          <ChevronRightIcon size={16} />
        </button>
      )}
    </aside>
  );
};
