// Eliza Security Agent - File Tree Component
// Collapsible file tree with similarity scores

import React, { useState } from 'react';
import { getSimilarityColor } from '../lib/scoring';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  similarity: number;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect?: (file: FileNode) => void;
  activePath?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  onFileSelect,
  activePath,
}) => {
  if (!files.length) {
    return (
      <div className="px-3 py-4 text-xs" style={{ color: '#475569' }}>
        Scan a repository to load its file tree.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {files.map((file, index) => (
        <FileTreeItem
          key={`${file.name}-${index}`}
          file={file}
          depth={0}
          onFileSelect={onFileSelect}
          activePath={activePath}
        />
      ))}
    </div>
  );
};

interface FileTreeItemProps {
  file: FileNode;
  depth: number;
  onFileSelect?: (file: FileNode) => void;
  activePath?: string;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  depth,
  onFileSelect,
  activePath,
}) => {
  const [expanded, setExpanded] = useState(depth === 0);

  const isActive = activePath === file.path;
  const similarityColor = getSimilarityColor(file.similarity);

  if (file.type === 'folder') {
    return (
      <div>
        <div
          className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-[#161925] transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <span style={{ color: '#475569' }}>
            {expanded ? '▾' : '›'}
          </span>
          <span style={{ color: '#94a3b8' }}>⊞</span>
          <span className="flex-1 text-sm" style={{ color: '#e2e8f0' }}>
            {file.name}
          </span>
        </div>

        {expanded && file.children && (
          <div className="pl-4">
            {file.children.map((child, index) => (
              <FileTreeItem
                key={`${child.name}-${index}`}
                file={child}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                activePath={activePath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors ${isActive ? 'bg-[#0f1420] border-l-2' : 'hover:bg-[#161925]'
        }`}
      style={{
        borderLeftColor: isActive ? '#00d4ff' : 'transparent',
      }}
      onClick={() => onFileSelect?.(file)}
    >
      <span style={{ color: '#475569' }}>◻</span>
      <span className="flex-1 text-sm truncate" style={{ color: '#e2e8f0' }}>
        {file.name}
      </span>
      <span
        className="text-xs font-mono"
        style={{ color: similarityColor }}
      >
        {file.similarity}%
      </span>
    </div>
  );
};

/**
 * Recent Scans List Component
 */
interface RecentScan {
  id: string;
  fullName: string;
  score: number;
  tier: string;
  timestamp?: string;
  trending?: 'up' | 'down' | 'stable';
}

interface RecentScansProps {
  scans: RecentScan[];
  onScanSelect?: (scan: RecentScan) => void;
}

export const RecentScans: React.FC<RecentScansProps> = ({
  scans,
  onScanSelect,
}) => {
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

  return (
    <div className="border-t" style={{ borderColor: '#1c1f2e' }}>
      <div className="px-4 py-3">
        <div
          className="text-[10px] uppercase tracking-wider mb-3"
          style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}
        >
          RECENT SCANS
        </div>

        <div className="space-y-2">
          {scans.map((scan, index) => (
            <div
              key={scan.id}
              className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-[#161925] transition-colors"
              style={{ backgroundColor: '#111420' }}
              onClick={() => onScanSelect?.(scan)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: getTierColor(scan.tier) }}
                >
                  {scan.score}
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: '#94a3b8' }}
                >
                  {scan.fullName}
                </span>
                {scan.trending && (
                  <span
                    style={{
                      color: scan.trending === 'up' ? '#22c55e' :
                        scan.trending === 'down' ? '#ef4444' : '#475569',
                    }}
                  >
                    {scan.trending === 'up' ? '▲' : scan.trending === 'down' ? '▼' : '●'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
