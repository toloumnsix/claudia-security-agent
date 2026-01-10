// Eliza Security Agent - Landing View
// Landing page with scan input and features showcase

import React from 'react';

interface LandingProps {
  onScan?: (url: string) => void;
  onEnter: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onScan, onEnter }) => {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      if (onScan) {
        onScan(input.trim());
      } else {
        onEnter();
      }
    }
  };

  const features = [
    {
      icon: '◎',
      title: 'Eliza Trust Score',
      description: 'Composite 0-100 score across 6 dimensions: Origin, Build, Security, Author, Activity, Community.',
    },
    {
      icon: '🔬',
      title: 'Commit DNA',
      description: 'Detect bulk dumps, bot commits, and manufactured history. Anomaly scoring per repository.',
    },
    {
      icon: '🛡',
      title: 'Security Scanner',
      description: 'Hardcoded secrets, missing rate limits, supply chain risks. Real-time severity-ranked findings.',
    },
    {
      icon: '⑂',
      title: 'Compare Mode',
      description: 'Side-by-side dual-repo intelligence. Head-to-head scoring with delta indicators and verdict.',
    },
    {
      icon: '👤',
      title: 'Author Intel',
      description: 'Cross-repo developer identity. Consistency scoring and contributor risk profiling.',
    },
    {
      icon: '🏷',
      title: 'Proof of Scan Badge',
      description: 'Embeddable SVG badge with scan ID and timestamp. One-click CT thread export.',
    },
  ];

  const exampleRepos = [
    'bitcoin/bitcoin',
    'vercel/next.js',
    'openai/openai-python',
    'ethereum/solidity',
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#0e0f14',
        color: '#e2e8f0',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #1a1d2e 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.3,
        }}
      />

      {/* Top bar */}
      <header
        className="relative z-10 flex items-center justify-between px-10 py-3.5 border-b"
        style={{
          backgroundColor: '#08090dee',
          borderColor: '#1c1f2e',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-6 flex items-center justify-center text-xs font-bold rounded"
            style={{ backgroundColor: '#00d4ff', color: '#000' }}
          >
            ES
          </div>
          <span className="font-semibold text-base">Eliza Security Agent</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/HandInstance/eliza-security-agent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors hover:text-[#00d4ff]"
            style={{ color: '#475569' }}
          >
            GitHub
          </a>
          <a
            href="https://x.com/elizasecurityag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm transition-colors hover:text-[#00d4ff]"
            style={{ color: '#475569' }}
          >
            X (Twitter)
          </a>
          {['Docs', 'API', 'Leaderboard'].map(link => (
            <button
              key={link}
              className="bg-none border-none cursor-pointer text-sm"
              style={{ color: '#475569' }}
            >
              {link}
            </button>
          ))}
          <button
            onClick={onEnter}
            className="px-5 py-2 border-none rounded font-bold text-sm cursor-pointer"
            style={{ backgroundColor: '#00d4ff', color: '#000' }}
          >
            Launch App
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-14 h-11 flex items-center justify-center text-lg font-bold rounded"
              style={{ backgroundColor: '#00d4ff', color: '#000' }}
            >
              ES
            </div>
          </div>
          <h1
            className="text-[42px] font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Eliza Security Agent
          </h1>
          <p
            className="text-lg mb-2"
            style={{ color: '#475569', fontFamily: 'monospace' }}
          >
            Repository Intelligence. Trust Verified.
          </p>
        </div>

        {/* Scan input */}
        <form onSubmit={handleSubmit} className="w-full max-w-lg mb-10">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="github.com/owner/repo"
              className="w-full px-4 py-3.5 rounded-lg border text-sm outline-none"
              style={{
                backgroundColor: '#0a0b0f',
                borderColor: '#1c1f2e',
                color: '#e2e8f0',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 border-none rounded font-bold text-sm cursor-pointer"
              style={{ backgroundColor: '#00d4ff', color: '#000' }}
            >
              Scan Repository →
            </button>
          </div>
        </form>

        {/* Example repos */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {exampleRepos.map(repo => (
            <button
              key={repo}
              className="px-3 py-1.5 border rounded text-xs cursor-pointer transition-colors"
              style={{
                backgroundColor: '#0c0d12',
                borderColor: '#1c1f2e',
                color: '#475569',
                fontFamily: "'JetBrains Mono', monospace",
              }}
              onClick={() => {
                setInput(repo);
                if (onScan) {
                  onScan(repo);
                } else {
                  onEnter();
                }
              }}
            >
              {repo}
            </button>
          ))}
        </div>

        {/* Features grid */}
        <div
          className="grid gap-4 w-full max-w-[900px]"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {features.map(feature => (
            <div
              key={feature.title}
              className="p-4 rounded-lg border"
              style={{ backgroundColor: '#0c0d12', borderColor: '#1c1f2e' }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">{feature.icon}</span>
                <span className="font-bold text-sm" style={{ color: '#00d4ff' }}>
                  {feature.title}
                </span>
              </div>
              <p className="text-xs leading-relaxed m-0" style={{ color: '#94a3b8' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
