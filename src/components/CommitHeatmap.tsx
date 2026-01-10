// Eliza Security Agent - Commit Heatmap Component
// Activity visualization for commit history

import React from 'react';

interface CommitHeatmapProps {
  commits?: Array<{ date: string; additions?: number; deletions?: number }>;
  weeks?: number;
}

export const CommitHeatmap: React.FC<CommitHeatmapProps> = ({
  commits = [],
  weeks = 16,
}) => {
  const totalCells = weeks * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    // Generate a sample contribution value (0-4 scale)
    const contribution = Math.floor(Math.random() * 5);
    return {
      level: contribution,
      date: new Date(Date.now() - (totalCells - i) * 24 * 60 * 60 * 1000),
    };
  });

  const getColor = (level: number) => {
    switch (level) {
      case 0: return '#1c1f2e';
      case 1: return '#0e4429';
      case 2: return '#006d32';
      case 3: return '#26a641';
      case 4: return '#39d353';
      default: return '#1c1f2e';
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4">
      {/* Month labels */}
      <div className="flex ml-8 mb-1 text-[10px]" style={{ color: '#475569' }}>
        {Array.from({ length: weeks }, (_, i) => {
          const date = new Date(Date.now() - (weeks - i) * 7 * 24 * 60 * 60 * 1000);
          return (
            <span
              key={i}
              className="flex-1 text-center"
              style={{ minWidth: '12px' }}
            >
              {months[date.getMonth()]}
            </span>
          );
        })}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-around mr-2 text-[10px]" style={{ color: '#475569' }}>
          <span>&nbsp;</span>
          <span>Mon</span>
          <span>&nbsp;</span>
          <span>Wed</span>
          <span>&nbsp;</span>
          <span>Fri</span>
          <span>&nbsp;</span>
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {Array.from({ length: weeks }, (_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const cellIndex = weekIndex * 7 + dayIndex;
                const cell = cells[cellIndex];
                return (
                  <div
                    key={dayIndex}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getColor(cell.level) }}
                    title={`${cell.date.toLocaleDateString()}: ${cell.level} contributions`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 gap-1 text-[10px]" style={{ color: '#475569' }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(level) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

/**
 * Commit velocity chart component
 */
export const CommitVelocity: React.FC<{
  commits?: Array<{ date: string; additions?: number; deletions?: number }>;
}> = ({ commits = [] }) => {
  // Calculate weekly stats
  const weeklyData = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    const weekCommits = commits.filter(c => {
      const date = new Date(c.date);
      return date >= weekStart && date < weekEnd;
    });

    weeklyData.push({
      label: `Week ${4 - i}`,
      commits: weekCommits.length,
      additions: weekCommits.reduce((sum, c) => sum + (c.additions || 0), 0),
      deletions: weekCommits.reduce((sum, c) => sum + (c.deletions || 0), 0),
    });
  }

  const maxCommits = Math.max(...weeklyData.map(w => w.commits), 1);

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>
        Weekly Activity
      </div>

      {weeklyData.map((week, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] w-12" style={{ color: '#475569' }}>
            {week.label}
          </span>
          <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ backgroundColor: '#1c1f2e' }}>
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{
                width: `${(week.commits / maxCommits) * 100}%`,
                backgroundColor: '#00d4ff',
              }}
            />
          </div>
          <span className="text-[10px] font-mono w-8 text-right" style={{ color: '#94a3b8' }}>
            {week.commits}
          </span>
        </div>
      ))}
    </div>
  );
};
