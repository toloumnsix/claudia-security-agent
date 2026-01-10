// Eliza Security Agent - Threat Table Component
// Table view of all security findings

import React, { useState } from 'react';
import { getSeverityConfig } from '../lib/scoring';

interface Threat {
  id: string;
  severity: string;
  file: string;
  line: number | null;
  pattern: string;
  description: string;
  fix?: string;
}

interface ThreatTableProps {
  threats: Threat[];
}

type SortField = 'severity' | 'file' | 'pattern';
type SortDirection = 'asc' | 'desc';

export const ThreatTable: React.FC<ThreatTableProps> = ({ threats }) => {
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedThreat, setExpandedThreat] = useState<string | null>(null);

  // Filter threats
  const filteredThreats = threats.filter(t => {
    if (filterSeverity === 'all') return true;
    return t.severity === filterSeverity;
  });

  // Sort threats
  const sortedThreats = [...filteredThreats].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'severity') {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
      comparison = severityOrder[a.severity] - severityOrder[b.severity];
    } else if (sortField === 'file') {
      comparison = a.file.localeCompare(b.file);
    } else if (sortField === 'pattern') {
      comparison = a.pattern.localeCompare(b.pattern);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSeverityStyle = (severity: string) => {
    const config = getSeverityConfig(severity);
    return {
      backgroundColor: config.bg,
      color: config.text,
      border: `1px solid ${config.border}`,
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: '#1c1f2e' }}>
        <span className="text-xs" style={{ color: '#475569' }}>Filter:</span>
        {['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className="px-2 py-0.5 text-[10px] font-mono rounded transition-all"
            style={{
              backgroundColor: filterSeverity === sev ? '#0d1117' : '#0a0a0f',
              color: filterSeverity === sev ? (sev === 'all' ? '#e2e8f0' : getSeverityConfig(sev).text) : '#475569',
              border: `1px solid ${filterSeverity === sev ? (sev === 'all' ? '#1c1f2e' : getSeverityConfig(sev).border) : '#1c1f2e'}`,
            }}
          >
            {sev.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0" style={{ backgroundColor: '#0a0b0f' }}>
            <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>
              <th
                className="p-3 cursor-pointer hover:text-[#e2e8f0]"
                onClick={() => handleSort('severity')}
              >
                Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="p-3 cursor-pointer hover:text-[#e2e8f0]"
                onClick={() => handleSort('file')}
              >
                File {sortField === 'file' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="p-3 cursor-pointer hover:text-[#e2e8f0]"
                onClick={() => handleSort('pattern')}
              >
                Pattern {sortField === 'pattern' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-3">Description</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sortedThreats.map((threat) => (
              <React.Fragment key={threat.id}>
                <tr
                  className="border-t cursor-pointer hover:bg-[#111420]"
                  style={{ borderColor: '#1a1d2e' }}
                  onClick={() => setExpandedThreat(expandedThreat === threat.id ? null : threat.id)}
                >
                  <td className="p-3">
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded"
                      style={getSeverityStyle(threat.severity)}
                    >
                      {threat.severity}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {threat.file}
                    {threat.line && <span style={{ color: '#475569' }}>:{threat.line}</span>}
                  </td>
                  <td className="p-3 text-xs" style={{ color: '#e2e8f0' }}>
                    {threat.pattern}
                  </td>
                  <td className="p-3 text-xs" style={{ color: '#94a3b8' }}>
                    {threat.description}
                  </td>
                  <td className="p-3 text-center" style={{ color: '#475569' }}>
                    {threat.fix ? (expandedThreat === threat.id ? '▾' : '›') : ''}
                  </td>
                </tr>
                {expandedThreat === threat.id && threat.fix && (
                  <tr className="border-t" style={{ borderColor: '#1a1d2e', backgroundColor: '#0a0b0f' }}>
                    <td colSpan={5} className="p-3">
                      <div className="text-xs">
                        <span className="font-semibold" style={{ color: '#22c55e' }}>Fix: </span>
                        <span style={{ color: '#94a3b8' }}>{threat.fix}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
