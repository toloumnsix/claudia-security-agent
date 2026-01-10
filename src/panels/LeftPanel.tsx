// Eliza Security Agent - Left Panel Component
// File tree and recent scans

import React from 'react';
import { FileTree, RecentScans } from '../components/FileTree';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  similarity: number;
  children?: FileNode[];
}

interface RecentScan {
  id: string;
  fullName: string;
  score: number;
  tier: string;
  timestamp?: string;
  trending?: 'up' | 'down' | 'stable';
}

interface LeftPanelProps {
  collapsed: boolean;
  onCollapse: () => void;
  repoName?: string;
  fileCount?: number;
  overallSimilarity?: number;
  files: FileNode[];
  activePath?: string;
  onFileSelect?: (file: FileNode) => void;
  recentScans: RecentScan[];
  onScanSelect?: (scan: RecentScan) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  collapsed,
  onCollapse,
  repoName,
  fileCount = 0,
  overallSimilarity = 0,
  files,
  activePath,
  onFileSelect,
  recentScans,
  onScanSelect,
}) => {
  if (collapsed) {
    return (
      <button
        onClick={onCollapse}
        className="w-6 flex-shrink-0 border-none cursor-pointer text-sm"
        style={{ backgroundColor: '#0c0d12', color: '#475569' }}
      >
        ›
      </button>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden border-r"
      style={{
        width: 260,
        minWidth: 260,
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
        ‹
      </button>

      {/* Header */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: '#1c1f2e' }}>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-[22px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded"
            style={{ backgroundColor: '#00d4ff', color: '#000' }}
          >
            ES
          </div>
          <span className="font-bold text-xs">Eliza Security Agent</span>
        </div>
      </div>

      {/* Repo info */}
      <div className="px-3.5 py-2.5 border-b" style={{ borderColor: '#1c1f2e' }}>
        <div className="font-bold text-sm mb-0.5" style={{ color: '#e2e8f0' }}>
          {repoName || 'No repository'}
        </div>
        <div className="text-xs" style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
          {fileCount} files · {overallSimilarity}%
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1.5">
        <FileTree
          files={files}
          onFileSelect={onFileSelect}
          activePath={activePath}
        />
      </div>

      {/* Recent scans */}
      <RecentScans
        scans={recentScans}
        onScanSelect={onScanSelect}
      />
    </div>
  );
};
