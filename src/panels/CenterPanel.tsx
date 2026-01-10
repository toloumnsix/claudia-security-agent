// Eliza Security Agent - Center Panel Component
// Code viewer with tabs: Diff Viewer, Threats, Commit History, Dependencies

import React from 'react';
import { ThreatTable } from '../components/ThreatTable';
import { CommitHeatmap, CommitVelocity } from '../components/CommitHeatmap';
import { DepGraph } from '../components/DepGraph';

interface Threat {
  id: string;
  severity: string;
  file: string;
  line: number | null;
  pattern: string;
  description: string;
  fix?: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  additions?: number;
  deletions?: number;
}

interface Dependency {
  name: string;
  version: string;
  type: 'prod' | 'dev';
  health: 'trusted' | 'neutral' | 'suspicious';
}

interface CenterPanelProps {
  activeTab: 'diff' | 'threats' | 'history' | 'deps';
  onTabChange: (tab: 'diff' | 'threats' | 'history' | 'deps') => void;
  activeFile?: string;
  fileContent?: string;
  fileLanguage?: string;
  error?: string;
  threats: Threat[];
  commits: Commit[];
  dependencies: Dependency[];
  isScanning?: boolean;
  progress?: {
    fetch: number;
    analyze: number;
    threats: number;
    profile: number;
  };
  logs?: string[];
  onScan: () => void;
}

const TABS = [
  { id: 'diff', label: 'Diff Viewer' },
  { id: 'threats', label: 'Threats' },
  { id: 'history', label: 'Commit History' },
  { id: 'deps', label: 'Dependencies' },
] as const;

export const CenterPanel: React.FC<CenterPanelProps> = ({
  activeTab,
  onTabChange,
  activeFile,
  fileContent,
  fileLanguage,
  error,
  threats,
  commits,
  dependencies,
  isScanning,
  progress,
  logs,
  onScan,
}) => {
  // Count threats by severity
  const threatCount = threats.filter(t => t.severity !== 'INFO').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#0f1017' }}>
      {/* Tab bar */}
      <div
        className="flex items-center border-b px-4"
        style={{ backgroundColor: '#0c0d12', borderColor: '#1c1f2e' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-2.5 border-none cursor-pointer text-sm font-medium transition-all ${activeTab === tab.id ? 'border-b-2' : ''
              }`}
            style={{
              color: activeTab === tab.id ? '#00d4ff' : '#475569',
              borderBottomColor: activeTab === tab.id ? '#00d4ff' : 'transparent',
            }}
          >
            {tab.label}
            {tab.id === 'threats' && threatCount > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                }}
              >
                {threatCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Scanning overlay */}
      {isScanning && progress && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#0a0b0eee' }}
        >
          <div className="text-lg font-bold mb-6" style={{ color: '#00d4ff' }}>
            ELIZA SCANNING
          </div>

          {/* Progress bars */}
          <div className="w-[420px] space-y-2.5">
            {[
              { label: 'FETCHING REPOSITORY', key: 'fetch' },
              { label: 'ANALYZING FILES', key: 'analyze' },
              { label: 'RUNNING THREAT SCAN', key: 'threats' },
              { label: 'BUILDING TRUST PROFILE', key: 'profile' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="h-1.5 rounded-full overflow-hidden flex-1"
                  style={{ backgroundColor: '#1c1f2e' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${progress[key as keyof typeof progress]}%`,
                      backgroundColor: '#00d4ff',
                    }}
                  />
                </div>
                <span className="text-xs w-10 text-right" style={{ color: '#00d4ff' }}>
                  {progress[key as keyof typeof progress]}%
                </span>
              </div>
            ))}
          </div>

          {/* Log output */}
          <div
            className="mt-5 w-[420px] h-[110px] p-2.5 rounded border overflow-y-auto"
            style={{
              backgroundColor: '#08090d',
              borderColor: '#1c1f2e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
            }}
          >
            {logs?.slice(-6).map((log, i) => (
              <div key={i} className="mb-0.5" style={{ color: '#475569' }}>
                {'>'} {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {error && !isScanning && (
          <div
            className="m-4 rounded border px-3 py-2 text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        {activeTab === 'diff' && (
          <DiffViewer activeFile={activeFile} content={fileContent} language={fileLanguage} />
        )}

        {activeTab === 'threats' && (
          <ThreatTable threats={threats} />
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="rounded border" style={{ backgroundColor: '#0a0b0f', borderColor: '#1c1f2e' }}>
              <div
                className="px-4 py-3 text-[11px] uppercase tracking-wider border-b"
                style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace", borderColor: '#1c1f2e' }}
              >
                COMMIT DNA ANALYSIS
              </div>
              <CommitHeatmap commits={commits} />
            </div>

            <div className="rounded border" style={{ backgroundColor: '#0a0b0f', borderColor: '#1c1f2e' }}>
              <div
                className="px-4 py-3 text-[11px] uppercase tracking-wider border-b"
                style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace", borderColor: '#1c1f2e' }}
              >
                ACTIVITY HEATMAP (16 WEEKS)
              </div>
              <CommitVelocity commits={commits} />
            </div>
          </div>
        )}

        {activeTab === 'deps' && (
          <DepGraph dependencies={dependencies} />
        )}
      </div>
    </div>
  );
};

// Diff Viewer sub-component
interface DiffViewerProps {
  activeFile?: string;
  content?: string;
  language?: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ activeFile, content, language }) => {
  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm" style={{ color: '#475569' }}>
        Select a file from the left panel to inspect repository contents.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File header */}
      <div
        className="flex items-center justify-between px-3.5 py-2 border-b"
        style={{ backgroundColor: '#0a0b0f', borderColor: '#1c1f2e' }}
      >
        <span
          className="text-xs font-mono"
          style={{ color: '#00d4ff' }}
        >
          {activeFile || 'No file selected'}
        </span>
        <span
          className="px-2 py-0.5 text-[10px] rounded"
          style={{
            backgroundColor: '#0f2a1a',
            border: '1px solid #22c55e44',
            color: '#22c55e',
          }}
        >
          {language || 'text'}
        </span>
      </div>

      {/* Code content */}
      <div
        className="flex-1 overflow-auto p-3"
        style={{ backgroundColor: '#080a0f' }}
      >
        <pre
          className="text-xs leading-relaxed"
          style={{
            color: '#6a9955',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {content || '// File is empty or could not be loaded.'}
        </pre>
      </div>
    </div>
  );
};
