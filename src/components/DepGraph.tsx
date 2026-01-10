// Eliza Security Agent - Dependency Graph Component
// Trust map for project dependencies

import React from 'react';

interface Dependency {
  name: string;
  version: string;
  type: 'prod' | 'dev';
  health: 'trusted' | 'neutral' | 'suspicious';
}

interface DepGraphProps {
  dependencies: Dependency[];
}

export const DepGraph: React.FC<DepGraphProps> = ({ dependencies = [] }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'trusted': return '#22c55e';
      case 'neutral': return '#f59e0b';
      case 'suspicious': return '#ef4444';
      default: return '#475569';
    }
  };

  const prodDeps = dependencies.filter(d => d.type === 'prod');
  const devDeps = dependencies.filter(d => d.type === 'dev');

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="text-[11px] uppercase tracking-wider"
          style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}
        >
          DEPENDENCY TRUST MAP
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span style={{ color: '#475569' }}>Trusted</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            <span style={{ color: '#475569' }}>Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span style={{ color: '#475569' }}>Suspicious</span>
          </div>
        </div>
      </div>

      {/* Production Dependencies */}
      <div>
        <div
          className="text-xs uppercase tracking-wider mb-3"
          style={{ color: '#94a3b8' }}
        >
          Production ({prodDeps.length})
        </div>
        <div className="space-y-2">
          {prodDeps.map((dep, i) => (
            <DependencyItem key={i} dep={dep} getHealthColor={getHealthColor} />
          ))}
        </div>
      </div>

      {/* Development Dependencies */}
      <div>
        <div
          className="text-xs uppercase tracking-wider mb-3"
          style={{ color: '#94a3b8' }}
        >
          Development ({devDeps.length})
        </div>
        <div className="space-y-2">
          {devDeps.map((dep, i) => (
            <DependencyItem key={i} dep={dep} getHealthColor={getHealthColor} />
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div
        className="p-3 rounded border"
        style={{ backgroundColor: '#0a0b0f', borderColor: '#1c1f2e' }}
      >
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold font-mono" style={{ color: '#22c55e' }}>
              {dependencies.filter(d => d.health === 'trusted').length}
            </div>
            <div className="text-[10px]" style={{ color: '#475569' }}>Trusted</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono" style={{ color: '#f59e0b' }}>
              {dependencies.filter(d => d.health === 'neutral').length}
            </div>
            <div className="text-[10px]" style={{ color: '#475569' }}>Neutral</div>
          </div>
          <div>
            <div className="text-lg font-bold font-mono" style={{ color: '#ef4444' }}>
              {dependencies.filter(d => d.health === 'suspicious').length}
            </div>
            <div className="text-[10px]" style={{ color: '#475569' }}>Suspicious</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DependencyItemProps {
  dep: Dependency;
  getHealthColor: (health: string) => string;
}

const DependencyItem: React.FC<DependencyItemProps> = ({ dep, getHealthColor }) => {
  return (
    <div className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: '#111420' }}>
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: getHealthColor(dep.health) }}
      />
      <span
        className="flex-1 text-xs truncate"
        style={{ color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {dep.name}
      </span>
      <span
        className="text-[10px]"
        style={{ color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}
      >
        {dep.version}
      </span>
    </div>
  );
};
