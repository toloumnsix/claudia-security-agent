// Eliza Security Agent - Scoring Logic
// Calculate trust scores based on multiple dimensions

import { SCORE_WEIGHTS, SCORE_TIERS } from './constants';

/**
 * Calculate the total trust score based on sub-scores
 * @param {Object} subScores - Object containing all 6 sub-scores
 * @returns {Object} - Object with total score and tier
 */
export function calculateTotalScore(subScores) {
  const total = Math.round(
    subScores.origin * SCORE_WEIGHTS.origin +
    subScores.build * SCORE_WEIGHTS.build +
    subScores.security * SCORE_WEIGHTS.security +
    subScores.author * SCORE_WEIGHTS.author +
    subScores.activity * SCORE_WEIGHTS.activity +
    subScores.community * SCORE_WEIGHTS.community
  );

  return {
    total,
    tier: getScoreTier(total),
  };
}

/**
 * Determine the tier label based on score
 * @param {number} score - Score from 0-100
 * @returns {string} - Tier label
 */
export function getScoreTier(score) {
  if (score >= 85) return 'VERIFIED';
  if (score >= 70) return 'TRUSTED';
  if (score >= 55) return 'CAUTION';
  if (score >= 40) return 'SUSPICIOUS';
  return 'HIGH_RISK';
}

/**
 * Get tier color based on tier label
 * @param {string} tier - Tier label
 * @returns {string} - Color code
 */
export function getTierColor(tier) {
  const tierColors = {
    VERIFIED: '#22c55e',
    TRUSTED: '#00d4ff',
    CAUTION: '#f59e0b',
    SUSPICIOUS: '#f97316',
    HIGH_RISK: '#ef4444',
  };
  return tierColors[tier] || '#94a3b8';
}

/**
 * Get score color based on value
 * @param {number} score - Score from 0-100
 * @returns {string} - Color code
 */
export function getScoreColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#00d4ff';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

/**
 * Get similarity color based on percentage
 * @param {number} similarity - Similarity percentage 0-100
 * @returns {string} - Color code
 */
export function getSimilarityColor(similarity) {
  if (similarity === 0) return '#475569';
  if (similarity <= 30) return '#f59e0b';
  if (similarity <= 70) return '#ef4444';
  return '#dc2626';
}

/**
 * Get severity color based on threat severity
 * @param {string} severity - Threat severity level
 * @returns {Object} - Object with color and background color
 */
export function getSeverityConfig(severity) {
  const configs = {
    CRITICAL: { bg: '#0d1117', text: '#ef4444', border: '#ef4444' },
    HIGH: { bg: '#0d1117', text: '#f97316', border: '#f97316' },
    MEDIUM: { bg: '#0d1117', text: '#f59e0b', border: '#f59e0b' },
    LOW: { bg: '#0d1117', text: '#475569', border: '#475569' },
  };
  return configs[severity] || configs.LOW;
}

/**
 * Calculate origin score based on repository data
 * @param {Object} repo - Repository metadata
 * @param {Array} commits - Commit history
 * @param {Array} contents - File contents
 * @returns {number} - Origin score 0-100
 */
export function calculateOriginScore(repo, commits, contents) {
  let score = 50;

  // Add points for commit history
  score += Math.min(40, commits.length * 2);

  // Add points for file count
  score += contents.length > 10 ? 10 : 0;

  // Subtract points for fork
  score -= repo.fork ? 20 : 0;

  return Math.min(95, Math.max(0, score));
}

/**
 * Calculate build score based on activity
 * @param {Object} repo - Repository metadata
 * @param {Array} commits - Commit history
 * @param {Object} languages - Language breakdown
 * @returns {number} - Build score 0-100
 */
export function calculateBuildScore(repo, commits, languages) {
  let score = 40;

  // Add points for commits
  score += Math.min(30, commits.length * 1.5);

  // Add points for size
  score += repo.size > 100 ? 15 : 5;

  // Add points for multiple languages
  const langList = Object.keys(languages || {});
  score += langList.length > 1 ? 10 : 0;

  return Math.min(95, Math.max(0, score));
}

/**
 * Calculate security score based on threats and anomalies
 * @param {number} anomalyScore - Anomaly score from commit analysis
 * @param {number} ageDays - Repository age in days
 * @param {boolean} isFork - Whether the repo is a fork
 * @returns {number} - Security score 0-100
 */
export function calculateSecurityScore(anomalyScore, ageDays, isFork) {
  let score = 85;

  // Subtract points for anomalies
  score -= anomalyScore * 0.4;

  // Subtract points for new repo
  score -= ageDays < 7 ? 15 : 0;

  // Subtract points for fork
  score -= isFork ? 5 : 0;

  return Math.max(30, Math.min(95, score));
}

/**
 * Calculate author score based on contributor patterns
 * @param {Array} commits - Commit history
 * @returns {Object} - Author score and authors info
 */
export function calculateAuthorScore(commits) {
  const authors = [...new Set(commits.map(c => c.commit?.author?.name).filter(Boolean))];

  let score = 40;
  score += authors.length > 1 ? 20 : 0;
  score += Math.min(25, commits.length);

  return {
    score: Math.min(90, score),
    authors,
    authorEntropy: authors.length === 1 ? 'Low' : 'Normal',
  };
}

/**
 * Calculate activity score based on recency
 * @param {string} createdAt - Repository creation date
 * @param {Array} commits - Commit history
 * @returns {number} - Activity score 0-100
 */
export function calculateActivityScore(createdAt, commits) {
  const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

  let score = 40;
  if (ageDays > 365) score = 90;
  else if (ageDays > 90) score = 75;
  else if (ageDays > 30) score = 60;
  score += commits.length;

  return Math.min(95, Math.max(0, score));
}

/**
 * Calculate community score based on engagement
 * @param {Object} repo - Repository metadata
 * @returns {number} - Community score 0-100
 */
export function calculateCommunityScore(repo) {
  let score = 0;

  score += Math.min(50, repo.stargazers_count);
  score += Math.min(20, repo.forks_count);
  score += repo.open_issues_count > 0 ? 10 : 0;
  score += repo.description ? 10 : 0;

  return Math.min(95, score);
}

/**
 * Calculate anomaly score based on commit patterns
 * @param {Array} commits - Commit history
 * @param {number} authorCount - Number of unique authors
 * @returns {number} - Anomaly score 0-100
 */
export function calculateAnomalyScore(commits, authorCount) {
  if (commits.length < 5) return 60;
  if (authorCount === 1 && commits.length < 15) return 22;
  return 8;
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} - Formatted date string
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Today';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}yr ago`;
}

/**
 * Format age string from days
 * @param {number} ageDays - Age in days
 * @returns {string} - Formatted age string
 */
export function formatAge(ageDays) {
  if (ageDays < 30) return `${ageDays}d`;
  if (ageDays < 365) return `${Math.floor(ageDays / 30)}mo`;
  return `${Math.floor(ageDays / 365)}yr`;
}
