import React, { useState } from 'react';
import {
  FileIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TypeScriptIcon,
  SolidityIcon,
  JsonIcon,
  MarkdownIcon,
} from '../ui/Icons';

export interface FileTreeItemData {
  name: string;
  type: 'file' | 'folder';
  path: string;
  similarity: number;
  authorship: 'HUMAN' | 'AI-GEN' | 'COPIED' | 'MIXED';
  confidence?: number;
  children?: FileTreeItemData[];
  language?: string;
}

interface FileTreeProps {
  files: FileTreeItemData[];
  activeFile?: string;
  onFileSelect: (file: FileTreeItemData) => void;
  depth?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFile,
  onFileSelect,
  depth = 0,
}) => {
  return (
    <div className="file-tree">
      {files.map((file) => (
        <FileTreeNode
          key={file.path}
          file={file}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
          depth={depth}
        />
      ))}
    </div>
  );
};

interface FileTreeNodeProps {
  file: FileTreeItemData;
  activeFile?: string;
  onFileSelect: (file: FileTreeItemData) => void;
  depth: number;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  file,
  activeFile,
  onFileSelect,
  depth,
}) => {
  const [expanded, setExpanded] = useState(depth === 0);

  const getSimilarityColor = (similarity: number): string => {
    if (similarity === 0) return 'var(--text-muted)';
    if (similarity <= 30) return 'var(--color-warning)';
    if (similarity <= 70) return 'var(--color-danger)';
    return '#dc2626';
  };

  const getAuthorshipIcon = (authorship: string): React.ReactNode => {
    switch (authorship) {
      case 'AI-GEN':
        return <span className="text-[10px] ml-1">🤖</span>;
      case 'COPIED':
        return <span className="text-[10px] ml-1">📋</span>;
      case 'MIXED':
        return <span className="text-[10px] ml-1">⚡</span>;
      default:
        return null;
    }
  };

  const getFileIcon = (file: FileTreeItemData): React.ReactNode => {
    if (file.type === 'folder') {
      return (
        <FolderIcon
          size={16}
          className="flex-shrink-0"
          style={{ color: 'var(--accent-primary)' }}
        />
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return <TypeScriptIcon size={14} className="flex-shrink-0" />;
      case 'sol':
        return <SolidityIcon size={14} className="flex-shrink-0" />;
      case 'json':
        return <JsonIcon size={14} className="flex-shrink-0" />;
      case 'md':
        return <MarkdownIcon size={14} className="flex-shrink-0" />;
      default:
        return (
          <FileIcon
            size={14}
            className="flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
        );
    }
  };

  if (file.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-[var(--bg-card-hover)] transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {expanded ? (
            <ChevronDownIcon size={14} className="text-[var(--text-muted)]" />
          ) : (
            <ChevronRightIcon size={14} className="text-[var(--text-muted)]" />
          )}
          <FolderIcon size={16} className="text-[var(--accent-primary)]" />
          <span className="text-sm flex-1 text-left truncate" style={{ color: 'var(--text-primary)' }}>
            {file.name}
          </span>
        </button>
        {expanded && file.children && (
          <div className="file-tree-children">
            <FileTree
              files={file.children}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFile === file.path;

  return (
    <button
      onClick={() => onFileSelect(file)}
      className={`w-full flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
        isActive ? 'border-l-2' : ''
      }`}
      style={{
        paddingLeft: `${12 + depth * 16}px`,
        backgroundColor: isActive ? '#0f1420' : 'transparent',
        borderLeftColor: isActive ? 'var(--accent-primary)' : 'transparent',
        borderLeftWidth: isActive ? '2px' : '0px',
      }}
    >
      {getFileIcon(file)}
      <span
        className="text-xs flex-1 text-left truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {file.name}
      </span>
      {getAuthorshipIcon(file.authorship)}
      <span
        className="text-[10px] font-mono"
        style={{ color: getSimilarityColor(file.similarity) }}
      >
        {file.similarity}%
      </span>
    </button>
  );
};
