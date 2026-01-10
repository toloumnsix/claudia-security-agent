// Misaki Repository Intelligence - Main Application
// Refactored multi-file structure for improved Build Score

import { useState } from 'react';
import { Landing } from './views/Landing';
import { CompareView } from './views/CompareView';
import { LeftPanel } from './panels/LeftPanel';
import { CenterPanel } from './panels/CenterPanel';
import { RightPanel } from './panels/RightPanel';
import { mockRepository, mockRecentScans, Repository } from './data/mockRepoData';
import { useScan } from './hooks/useScan';

// Design tokens
const COLORS = {
  bg: '#0e0f14',
  panel: '#0c0d12',
  card: '#111420',
  border: '#1c1f2e',
  cyan: '#00d4ff',
  violet: '#7c3aed',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#475569',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
};

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'threats' | 'history' | 'deps'>('diff');
  const [activeFile, setActiveFile] = useState('Token.sol');

  const { scanState, repoData, error, logs, progress, startScan, resetScan } = useScan();

  // Use mock data for demo, or real scan result
  const activeRepo: Repository = repoData || mockRepository;

  const handleEnterApp = () => {
    setView('app');
  };

  const handleBackToLanding = () => {
    setView('landing');
    resetScan();
  };

  const handleScan = () => {
    // Trigger scan from the center panel
    startScan('github.com/misaki-intel/misaki-core');
  };

  if (view === 'landing') {
    return <Landing onEnter={handleEnterApp} />;
  }

  if (compareMode) {
    return (
      <div
        className="flex flex-col"
        style={{
          height: '100vh',
          width: '100%',
          backgroundColor: COLORS.bg,
          color: COLORS.textPrimary,
          fontFamily: "'Rajdhani', 'Space Grotesk', sans-serif",
          overflow: 'hidden',
        }}
      >
        <TopBar onHome={handleBackToLanding} />
        <CompareView
          leftRepo={{
            owner: activeRepo.owner,
            name: activeRepo.name,
            fullName: activeRepo.fullName,
            description: activeRepo.description,
            score: activeRepo.score.total,
            tier: activeRepo.score.tier,
            subScores: activeRepo.score,
          }}
          onBack={() => setCompareMode(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100vh',
        width: '100%',
        backgroundColor: COLORS.bg,
        color: COLORS.textPrimary,
        fontFamily: "'Rajdhani', 'Space Grotesk', sans-serif",
        overflow: 'hidden',
      }}
    >
      <TopBar onHome={handleBackToLanding} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - File Tree & Recent Scans */}
        <LeftPanel
          collapsed={!leftOpen}
          onCollapse={() => setLeftOpen(!leftOpen)}
          repoName={activeRepo.fullName}
          fileCount={activeRepo.fileCount}
          overallSimilarity={activeRepo.overallSimilarity}
          files={activeRepo.files}
          recentScans={mockRecentScans}
          onFileSelect={(file) => setActiveFile(file.name)}
        />

        {/* Center Panel - Code Viewer & Analysis Tabs */}
        <CenterPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeFile={activeFile}
          threats={activeRepo.threats}
          commits={activeRepo.commits}
          dependencies={activeRepo.dependencies}
          isScanning={scanState === 'SCANNING'}
          progress={progress}
          logs={logs}
          onScan={handleScan}
        />

        {/* Right Panel - AI Analysis */}
        <RightPanel
          collapsed={!rightOpen}
          onCollapse={() => setRightOpen(!rightOpen)}
          score={activeRepo.score}
          repoName={activeRepo.fullName}
          description={activeRepo.description}
          language={activeRepo.language}
          topics={activeRepo.topics}
          threats={activeRepo.threats}
          authors={activeRepo.authors}
          commits={activeRepo.commits}
          createdAt={activeRepo.createdAt}
        />
      </div>

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          repo={activeRepo}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

// Top Navigation Bar Component
function TopBar({ onHome }: { onHome: () => void }) {
  return (
    <div
      className="flex items-center px-4 flex-shrink-0 border-b"
      style={{
        height: 48,
        backgroundColor: '#08090d',
        borderColor: COLORS.border,
      }}
    >
      {/* Logo */}
      <button
        onClick={onHome}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div
          className="flex items-center justify-center font-bold"
          style={{
            width: 28,
            height: 22,
            backgroundColor: COLORS.cyan,
            borderRadius: 3,
            fontSize: 11,
            color: '#000',
          }}
        >
          MK
        </div>
        <span
          className="font-semibold tracking-wide"
          style={{ fontSize: 15 }}
        >
          Misaki Repository Intelligence
        </span>
      </button>

      <div
        className="mx-3"
        style={{
          width: 1,
          height: 20,
          backgroundColor: COLORS.border,
        }}
      />

      {/* Nav Links */}
      {['Docs', 'API', 'Leaderboard'].map((link) => (
        <button
          key={link}
          className="px-3 py-1 text-sm hover:text-white transition-colors"
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.muted,
            cursor: 'pointer',
          }}
        >
          {link}
        </button>
      ))}

      <div className="flex-1" />

      {/* Status */}
      <div
        className="flex items-center gap-2 px-3 text-xs rounded"
        style={{
          backgroundColor: '#0d0f18',
          border: `1px solid #1c2a3a`,
          borderRadius: 6,
        }}
      >
        <span style={{ color: COLORS.cyan }}>◎</span>
        <span style={{ fontFamily: 'monospace', color: COLORS.textSecondary }}>
          3/5 <span style={{ color: COLORS.muted }}>scans/hr</span>
        </span>
      </div>

      {/* User */}
      <div
        className="px-3 py-1 text-xs rounded cursor-pointer hover:bg-[#1c2a3a] transition-colors"
        style={{
          backgroundColor: '#0d0f18',
          border: `1px solid #1c2a3a`,
          borderRadius: 6,
          color: COLORS.textSecondary,
        }}
      >
        user@misaki.dev
      </div>
    </div>
  );
}

// Share Modal Component
function ShareModal({ repo, onClose }: { repo: Repository; onClose: () => void }) {
  const actions = [
    { label: 'Copy Link', icon: '🔗' },
    { label: 'Generate Badge (SVG)', icon: '🏷' },
    { label: 'Export as PDF', icon: '📄' },
    { label: 'Copy CT Thread', icon: '🐦' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 w-[420px] max-w-[90vw]"
        style={{
          backgroundColor: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="font-bold text-base" style={{ color: COLORS.textPrimary }}>
            Share Scan
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#1c2a3a] transition-colors"
            style={{ background: 'none', border: 'none', color: COLORS.muted, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Repo Summary */}
        <div
          className="flex items-center gap-4 p-4 rounded-lg mb-4"
          style={{
            backgroundColor: '#0a0b0f',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ backgroundColor: COLORS.cyan, color: '#000' }}
          >
            {repo.score.total.toString().slice(0, 2)}
          </div>
          <div>
            <div className="font-bold text-sm">{repo.fullName}</div>
            <div
              className="text-xs font-mono"
              style={{ color: COLORS.success }}
            >
              {repo.score.total}/100 {repo.score.tier}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-[#1c2a3a]"
              style={{
                backgroundColor: '#0f1420',
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary,
                cursor: 'pointer',
              }}
            >
              <span className="text-lg">{action.icon}</span>
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}