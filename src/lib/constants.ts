// Eliza Security Agent - Design System Constants
// Based on Zauth's dark palette with Aiko Samara's cyan + violet accent

export const COLORS = {
  // Backgrounds
  bgBase: '#0e0f14',
  bgTopbar: '#0a0b0f',
  bgLeftPanel: '#0c0d12',
  bgCenterPanel: '#0f1017',
  bgRightPanel: '#0c0d12',
  bgCard: '#111420',
  bgCardHover: '#161925',

  // Borders
  borderPanel: '#1c1f2e',
  borderCard: '#1a1d2e',
  borderSubtle: '#252a3a',

  // Accent colors
  accentPrimary: '#00d4ff', // Aiko Blue
  accentPrimaryDim: 'rgba(0, 212, 255, 0.1)',
  accentSecondary: '#7c3aed', // Samara Purple
  accentSecondaryDim: 'rgba(124, 58, 237, 0.1)',

  // Status colors
  colorSuccess: '#22c55e',
  colorSuccessDim: 'rgba(34, 197, 94, 0.1)',
  colorDanger: '#ef4444',
  colorDangerDim: 'rgba(239, 68, 68, 0.1)',
  colorWarning: '#f59e0b',
  colorWarningDim: 'rgba(245, 158, 11, 0.1)',
  colorInfo: '#6366f1',
  colorInfoDim: 'rgba(99, 102, 241, 0.1)',

  // Similarity colors
  similarityClean: '#475569',
  similarityMild: '#f59e0b',
  similaritySignificant: '#ef4444',
  similarityCritical: '#dc2626',

  // Text colors
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  textAccent: '#00d4ff',

  // Code syntax highlighting
  syntaxKeyword: '#569cd6',
  syntaxString: '#ce9178',
  syntaxFunction: '#dcdcaa',
  syntaxType: '#4ec9b0',
  syntaxComment: '#6a9955',
  syntaxNumber: '#b5cea8',
  syntaxOperator: '#d4d4d4',
  syntaxVariable: '#9cdcfe',
  syntaxProperty: '#9cdcfe',
  syntaxConstant: '#4fc1ff',

  // Scrollbar
  scrollbarTrack: '#1e2535',
  scrollbarThumb: '#00d4ff',
  scrollbarThumbHover: '#00b8d9',
};

export const FONTS = {
  spaceGrotesk: "'Space Grotesk', sans-serif",
  jetBrainsMono: "'JetBrains Mono', monospace",
  inter: "'Inter', sans-serif",
};

export const SCORE_TIERS = {
  VERIFIED: { min: 85, label: '◆ VERIFIED', color: COLORS.colorSuccess },
  TRUSTED: { min: 70, label: '✦ TRUSTED', color: COLORS.accentPrimary },
  CAUTION: { min: 55, label: '⚠ CAUTION', color: COLORS.colorWarning },
  SUSPICIOUS: { min: 40, label: '✗ SUSPICIOUS', color: '#f97316' },
  HIGH_RISK: { min: 0, label: '☠ HIGH RISK', color: COLORS.colorDanger },
};

export const SCORE_WEIGHTS = {
  origin: 0.25,
  build: 0.20,
  security: 0.20,
  author: 0.15,
  activity: 0.10,
  community: 0.10,
};

export const PANEL_SIZES = {
  leftPanel: 260,
  rightPanel: 380,
  topbar: 48,
  scrollbarWidth: 6,
};

export const THREAT_SEVERITY = {
  CRITICAL: { color: COLORS.colorDanger, label: 'CRITICAL' },
  HIGH: { color: '#f97316', label: 'HIGH' },
  MEDIUM: { color: COLORS.colorWarning, label: 'MEDIUM' },
  LOW: { color: COLORS.textMuted, label: 'LOW' },
};

export const SCAN_LOGS = [
  'Initializing Eliza Security Agent...',
  'Connecting to GitHub API v3...',
  'Fetching repository metadata...',
  'Pulling file tree...',
  'Fetching commit history (30)...',
  'Fetching language breakdown...',
  'Running commit DNA analysis...',
  'Profiling repository signals...',
  'Running security pattern scan...',
  'Analyzing author signals...',
  'Calculating sub-scores...',
  'Finalizing Eliza Trust Score...',
];

export const SUGGESTED_QUESTIONS = [
  'Why this score?',
  'Top risks?',
  'Safe to invest?',
  'CT caption',
];
