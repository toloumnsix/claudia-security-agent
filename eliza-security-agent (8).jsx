/**
 * Eliza Security Agent v4.0
 * White/Black Swiss Editorial Design + Heavy D3.js Interactivity
 * Force Graph · Mind Map · Code Flow · Dep Nodes
 *
 * Dependencies: react, react-dom, d3
 * npm install d3
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

/* ─── GOOGLE FONTS ──────────────────────────────────────────── */
const _link = document.createElement("link");
_link.rel = "stylesheet";
_link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap";
document.head.appendChild(_link);

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const T = {
  bg: "#FFFFFF", surface: "#FAFAFA", border: "#E5E5E5",
  borderMd: "#D4D4D4", black: "#0A0A0A", white: "#FFFFFF",
  ink: "#0A0A0A", inkMd: "#525252", inkLt: "#A3A3A3",
};
const FONT = {
  display: "'DM Serif Display', serif",
  mono: "'IBM Plex Mono', monospace",
  sans: "'Instrument Sans', sans-serif",
};
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const BRAND_IMAGE = "/p.jpeg";
const SOCIAL_LINKS = {
  github: "https://github.com/HandInstance/eliza-security-agent",
  twitter: "https://x.com/elizasecurityag"
};

const GitHubIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const XIcon = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const NAV_ITEMS = [
  { id: "docs", label: "Docs" },
  { id: "api", label: "API" },
  { id: "leaderboard", label: "Leaderboard" },
];

function viewFromPathname(pathname) {
  if (pathname === "/docs") return "docs";
  if (pathname === "/developers/api") return "api";
  if (pathname === "/leaderboard") return "leaderboard";
  return "landing";
}

function pathFromView(view) {
  if (view === "docs") return "/docs";
  if (view === "api") return "/developers/api";
  if (view === "leaderboard") return "/leaderboard";
  return "/";
}

/* ─── HELPERS ───────────────────────────────────────────────── */
function scoreToTier(n) {
  if (n >= 85) return "VERIFIED";
  if (n >= 70) return "TRUSTED";
  if (n >= 55) return "CAUTION";
  if (n >= 40) return "SUSPICIOUS";
  return "HIGH RISK";
}
function tierLabel(t) {
  return { VERIFIED: "◆ VERIFIED", TRUSTED: "◈ TRUSTED", CAUTION: "◇ CAUTION", SUSPICIOUS: "⬡ SUSPICIOUS", "HIGH RISK": "✕ HIGH RISK" }[t] || t;
}
function sevColor(s) {
  return { CRITICAL: "#EF4444", HIGH: "#F97316", MEDIUM: "#EAB308", LOW: "#6366F1", INFO: "#A3A3A3" }[s] || "#A3A3A3";
}
function nodeColor(type, flag) {
  if (flag) return "#EF4444";
  return { root: "#0A0A0A", folder: "#404040", lib: "#404040", comp: "#737373", util: "#A3A3A3", config: "#525252", dep: "#FFFFFF" }[type] || "#A3A3A3";
}

/* ─── GITHUB API ─────────────────────────────────────────────── */
async function fetchGitHubRepo(input) {
  const clean = sanitizeRepoInput(input);
  const raw = await apiRequest(`/api/scan?repo=${encodeURIComponent(clean)}`);
  return { raw, ui: normalizeRepository(raw) };
}

async function fetchRepoTree(repoFullName, treePath = "") {
  return apiRequest(`/api/tree?repo=${encodeURIComponent(sanitizeRepoInput(repoFullName))}&path=${encodeURIComponent(treePath)}`);
}

async function fetchRepoFile(repoFullName, filePath) {
  return apiRequest(`/api/file?repo=${encodeURIComponent(sanitizeRepoInput(repoFullName))}&path=${encodeURIComponent(filePath)}`);
}

async function askEliza(question, repository, activeFile, enrichment = null) {
  return apiRequest(`/api/chat`, {
    method: "POST",
    body: JSON.stringify({ question, repository, activeFile, ...enrichment }),
  });
}

async function apiRequest(path, init = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || "Request failed.");
  return data;
}

async function safeJson(response) {
  try { return await response.json(); } catch { return null; }
}

function sanitizeRepoInput(input) {
  return String(input || "").trim().replace(/^https?:\/\/github\.com\//i, "").replace(/^github\.com\//i, "").replace(/\/$/, "");
}

function normalizeRepository(raw) {
  const files = flattenFileNodes(raw?.files || []);
  const fileLanguages = unique(files.map(f => f.language).filter(Boolean)).slice(0, 4);
  const graphData = buildGraphData(raw, files);
  const topAuthor = raw?.authors?.[0] || null;
  const totalScore = raw?.score?.total ?? 0;
  const preview = buildPreview(raw?.preview, raw?.threats);

  return {
    owner: raw?.owner || "",
    name: raw?.name || "",
    fullName: raw?.fullName || "",
    description: raw?.description || "No description provided.",
    fileCount: raw?.fileCount || 0,
    stars: raw?.stars || 0,
    forks: raw?.forks || 0,
    score: totalScore,
    tier: formatTier(raw?.score?.tier || scoreToTier(totalScore)),
    subScores: {
      origin: raw?.score?.origin || 0,
      build: raw?.score?.build || 0,
      security: raw?.score?.security || 0,
      author: raw?.score?.author || 0,
      activity: raw?.score?.activity || 0,
      community: raw?.score?.community || 0,
    },
    overview: raw?.overview || "No live repository overview is available yet.",
    origins: raw?.origins || "Repository origin data unavailable.",
    threats: (raw?.threats || []).map(threat => ({
      sev: threat.severity,
      pattern: humanizeLabel(threat.pattern),
      desc: threat.description,
      file: threat.file,
      line: threat.line,
    })),
    commitDNA: {
      pattern: raw?.commitDNA?.pattern || "Unknown",
      anomalyScore: raw?.commitDNA?.anomalyScore ?? 0,
      authorEntropy: raw?.commitDNA?.authorEntropy || "Unknown",
      lastActivity: raw?.commitDNA?.lastActivity ? formatRelativeAge(raw.commitDNA.lastActivity) : "Unknown",
      commitTimes: raw?.commitDNA?.commitTimes || "N/A",
    },
    author: {
      username: extractAuthorHandle(topAuthor),
      accountAge: topAuthor?.joinedDate ? formatRelativeAge(topAuthor.joinedDate) : "Unknown",
      consistency: humanizeLabel(topAuthor?.consistency || "unknown"),
      avgScore: Math.round(topAuthor?.avgScore || totalScore || 0),
      languages: fileLanguages,
    },
    graphNodes: graphData.graphNodes,
    graphLinks: graphData.graphLinks,
    mindNodes: graphData.mindNodes,
    flowNodes: graphData.flowNodes,
    flowLinks: graphData.flowLinks,
    depNodes: buildDepNodes(raw?.dependencies || []),
    insights: raw?.insights || { suggestions: [], duplicates: [] },
    preview,
  };
}

function buildCommitCadence(commits = []) {
  if (!Array.isArray(commits) || commits.length === 0) {
    return "No commit history available.";
  }

  const dates = commits
    .map(commit => new Date(commit?.date || commit?.commit?.author?.date || commit?.commit?.committer?.date || ""))
    .filter(date => !Number.isNaN(date.getTime()));

  if (dates.length < 2) {
    return `${commits.length} observed commit${commits.length === 1 ? "" : "s"} in the sampled window.`;
  }

  const first = dates[dates.length - 1];
  const last = dates[0];
  const spanDays = Math.max(1, Math.ceil((last.getTime() - first.getTime()) / 86400000));
  const perWeek = ((commits.length / spanDays) * 7).toFixed(1);
  return `${perWeek} commits/week across a ${spanDays}-day sampled window.`;
}

function buildCrossCheckFacts(rawRepo) {
  const commits = Array.isArray(rawRepo?.commits) ? rawRepo.commits : [];
  const authors = Array.isArray(rawRepo?.authors) ? rawRepo.authors : [];
  const commitDates = commits
    .map(commit => commit?.date || commit?.commit?.author?.date || commit?.commit?.committer?.date || "")
    .filter(Boolean)
    .sort();

  return {
    repoCreatedAt: rawRepo?.createdAt || null,
    firstCommitAt: commitDates[0] || null,
    contributorCount: authors.length,
    commitFrequency: buildCommitCadence(commits),
  };
}

function flattenFileNodes(nodes, target = []) {
  for (const node of nodes || []) {
    if (node.type === "file") target.push(node);
    if (Array.isArray(node.children)) flattenFileNodes(node.children, target);
  }
  return target;
}

function buildGraphData(raw, files) {
  const topLevel = Array.isArray(raw?.files) ? raw.files.slice(0, 12) : [];
  const graphNodes = [{ id: "root", label: raw?.name || "repository", type: "root", r: 18 }];
  const graphLinks = [];
  let nextMindId = 1;
  const mindNodes = [{ id: 0, label: raw?.name || "repository", depth: 0, parent: null }];

  topLevel.forEach(node => {
    graphNodes.push({
      id: node.path,
      label: node.type === "folder" ? `${node.name}/` : node.name,
      type: node.type === "folder" ? "folder" : classifyGraphType(node.name),
      r: node.type === "folder" ? 13 : 9,
      flag: node.type === "file" && (raw?.threats || []).some(threat => threat.file === node.path),
    });
    graphLinks.push({ source: "root", target: node.path });

    const parentId = nextMindId++;
    mindNodes.push({ id: parentId, label: node.name, depth: 1, parent: 0 });
    if (node.type === "folder") {
      (node.children || []).slice(0, 3).forEach(child => {
        mindNodes.push({ id: nextMindId++, label: child.name, depth: 2, parent: parentId, flag: Boolean(child.confidence && child.confidence < 0.6) });
      });
    }
  });

  buildDepNodes(raw?.dependencies || []).slice(0, 8).forEach(dep => {
    const depId = `dep_${dep.name}`;
    graphNodes.push({ id: depId, label: dep.name, type: "dep", r: Math.max(8, Math.min(14, dep.size * 4 || 8)) });
    graphLinks.push({ source: "root", target: depId });
  });

  const primaryStack = raw?.language || files[0]?.language || "Core";
  return {
    graphNodes,
    graphLinks,
    mindNodes,
    flowNodes: [
      { id: "user", label: "User Input", x: .1, y: .5, type: "io" },
      { id: "api", label: "API Route", x: .32, y: .28, type: "proc" },
      { id: "auth", label: "Threat Scan", x: .32, y: .72, type: "proc" },
      { id: "tree", label: "Repo Tree", x: .56, y: .28, type: "data" },
      { id: "core", label: primaryStack, x: .56, y: .72, type: "data" },
      { id: "score", label: "Trust Score", x: .76, y: .5, type: "io" },
      { id: "client", label: "Client UI", x: .93, y: .5, type: "io" },
    ],
    flowLinks: [
      { s: "user", t: "api" }, { s: "user", t: "auth" },
      { s: "api", t: "tree" }, { s: "api", t: "core" }, { s: "auth", t: "tree" },
      { s: "tree", t: "score" }, { s: "core", t: "score" }, { s: "score", t: "client" },
    ],
  };
}

function buildDepNodes(dependencies) {
  return (dependencies || []).slice(0, 12).map(dep => ({
    name: dep.name,
    trust: dep.health === "trusted" ? 94 : dep.health === "neutral" ? 76 : 48,
    size: Math.max(.1, Math.min(2.4, String(dep.version || "").length / 4)),
    direct: dep.type === "prod",
  }));
}

function buildPreview(preview, threats) {
  if (preview?.file && preview?.content) {
    return {
      file: preview.file.split("/").pop(),
      fullPath: preview.file,
      status: preview.line ? `line ${preview.line} highlighted` : "live preview",
      content: preview.content,
      highlightLine: preview.line || 0,
      startLine: preview.startLine || 1,
    };
  }

  const firstThreat = (threats || []).find(threat => threat.file);
  return {
    file: firstThreat?.file?.split("/").pop() || "No preview",
    fullPath: firstThreat?.file || "",
    status: firstThreat ? "threat-linked preview unavailable" : "scan required",
    content: "No live preview was returned for this repository yet.",
    highlightLine: firstThreat?.line || 0,
    startLine: Math.max(1, (firstThreat?.line || 1) - 1),
  };
}

function classifyGraphType(name) {
  const ext = String(name || "").split(".").pop();
  if (["tsx", "jsx"].includes(ext)) return "comp";
  if (["ts", "js", "mjs", "cjs"].includes(ext)) return "util";
  return "config";
}

function extractAuthorHandle(author) {
  const github = author?.socials?.github || author?.email || author?.name || "unknown";
  const match = String(github).match(/github\.com\/([^/]+)/i);
  return match?.[1] || String(author?.name || github).replace(/^@/, "");
}

function formatTier(tier) {
  return String(tier || "UNKNOWN").replace(/_/g, " ");
}

function formatRelativeAge(dateValue) {
  if (!dateValue) return "Unknown";
  const days = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 86400000));
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}yr`;
}

function humanizeLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function unique(items) {
  return [...new Set(items)];
}

function buildResult(meta, commits, langs, contents, owner, repo) {
  const authors = [...new Set(commits.map(c => c.commit?.author?.name).filter(Boolean))];
  const hours = commits.map(c => new Date(c.commit?.author?.date).getHours()).filter(h => !isNaN(h));
  const ageDays = Math.floor((Date.now() - new Date(meta.created_at)) / 86400000);
  const ageStr = ageDays < 30 ? `${ageDays}d` : ageDays < 365 ? `${Math.floor(ageDays / 30)}mo` : `${Math.floor(ageDays / 365)}yr`;
  const langList = Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const anom = commits.length < 5 ? 60 : authors.length === 1 && commits.length < 15 ? 22 : 8;
  const oS = Math.min(95, 50 + Math.min(40, commits.length * 2) + (contents.length > 10 ? 10 : 0) - (meta.fork ? 20 : 0));
  const bS = Math.min(95, 40 + Math.min(30, commits.length * 1.5) + (meta.size > 100 ? 15 : 5) + (langList.length > 1 ? 10 : 0));
  const sS = Math.max(30, 85 - anom * 0.4 - (ageDays < 7 ? 15 : 0) - (meta.fork ? 5 : 0));
  const aS = Math.min(90, 40 + (authors.length > 1 ? 20 : 0) + Math.min(25, commits.length));
  const acS = Math.min(95, ageDays > 365 ? 90 : ageDays > 90 ? 75 : ageDays > 30 ? 60 : 40 + commits.length);
  const coS = Math.min(95, Math.min(50, meta.stargazers_count) + Math.min(20, meta.forks_count) + (meta.open_issues_count > 0 ? 10 : 0) + (meta.description ? 10 : 0));
  const score = Math.round(oS * .25 + bS * .20 + sS * .20 + aS * .15 + acS * .10 + coS * .10);
  const threats = [];
  if (ageDays < 7) threats.push({ sev: "HIGH", pattern: "Brand new repo", desc: `Created ${ageDays}d ago — no track record`, file: "root" });
  if (authors.length === 1 && commits.length < 10) threats.push({ sev: "MEDIUM", pattern: "Single-author sparse", desc: "All commits from one author, minimal history", file: "commits" });
  if (!meta.license) threats.push({ sev: "LOW", pattern: "No LICENSE", desc: "No open-source license declared", file: "root" });
  if (!meta.description) threats.push({ sev: "INFO", pattern: "No description", desc: "Repository lacks a description", file: "root" });
  if (meta.fork) threats.push({ sev: "MEDIUM", pattern: "Forked repo", desc: `Fork of ${meta.parent?.full_name || "upstream"}`, file: "root" });
  if (threats.length === 0) threats.push({ sev: "INFO", pattern: "Clean", desc: "No critical threat patterns detected", file: "root" });

  // Build graph nodes from file tree
  const graphNodes = [{ id: "root", label: repo, type: "root", r: 18 }];
  const graphLinks = [];
  const folders = new Set();
  contents.slice(0, 22).forEach(f => {
    if (f.type === "dir") {
      folders.add(f.name);
      graphNodes.push({ id: f.name, label: f.name + "/", type: "folder", r: 13 });
      graphLinks.push({ source: "root", target: f.name });
    } else {
      const ext = f.name.split(".").pop();
      const type = ["tsx", "jsx"].includes(ext) ? "comp" : ["ts", "js"].includes(ext) ? "util" : "config";
      const flag = f.name.includes("config") && !f.name.includes("tailwind") && !f.name.includes("eslint");
      graphNodes.push({ id: f.name, label: f.name, type, r: 9, flag });
      graphLinks.push({ source: "root", target: f.name });
    }
  });
  // dep nodes
  const depNodes = Object.entries(langs).slice(0, 8).map(([name, bytes]) => ({
    id: "dep_" + name, label: name, type: "dep", r: Math.max(8, Math.min(14, bytes / 5000)), direct: true,
    trust: Math.floor(70 + Math.random() * 28),
  }));
  depNodes.forEach(d => { graphNodes.push(d); graphLinks.push({ source: "root", target: d.id }); });

  // mindmap nodes
  const mindNodes = [{ id: 0, label: repo, depth: 0, parent: null }];
  let mid = 1;
  const topFolders = contents.filter(f => f.type === "dir").slice(0, 5);
  const topFiles = contents.filter(f => f.type === "file").slice(0, 4);
  topFolders.forEach(f => { mindNodes.push({ id: mid++, label: f.name, depth: 1, parent: 0 }); });
  topFiles.forEach(f => { mindNodes.push({ id: mid++, label: f.name, depth: 1, parent: 0 }); });
  // add children to first 3 folders (simulated)
  topFolders.slice(0, 3).forEach((f, fi) => {
    const pId = fi + 1;
    ["index.ts", "utils.ts", "types.ts"].slice(0, 2).forEach(name => {
      mindNodes.push({ id: mid++, label: name, depth: 2, parent: pId });
    });
  });

  // flow nodes
  const flowNodes = [
    { id: "user", label: "User Input", x: .1, y: .5, type: "io" },
    { id: "api", label: "API Route", x: .32, y: .28, type: "proc" },
    { id: "auth", label: "Auth Check", x: .32, y: .72, type: "proc" },
    { id: "db", label: "Database", x: .56, y: .28, type: "data" },
    { id: "ai", label: langList[0] || "Core", x: .56, y: .72, type: "data" },
    { id: "resp", label: "Response", x: .76, y: .5, type: "io" },
    { id: "client", label: "Client UI", x: .93, y: .5, type: "io" },
  ];
  const flowLinks = [
    { s: "user", t: "api" }, { s: "user", t: "auth" },
    { s: "api", t: "db" }, { s: "api", t: "ai" }, { s: "auth", t: "db" },
    { s: "db", t: "resp" }, { s: "ai", t: "resp" }, { s: "resp", t: "client" },
  ];

  return {
    owner, name: repo, fullName: `${owner}/${repo}`,
    description: meta.description || "No description",
    fileCount: Math.max(contents.length, 5), stars: meta.stargazers_count, forks: meta.forks_count,
    score, tier: scoreToTier(score),
    subScores: { origin: Math.round(oS), build: Math.round(bS), security: Math.round(sS), author: Math.round(aS), activity: Math.round(acS), community: Math.round(coS) },
    overview: `${meta.description || "No description provided"}. Created ${ageStr} ago · ${commits.length} commits · ${authors.length > 1 ? `${authors.length} contributors` : `by ${authors[0] || owner}`}. ${meta.stargazers_count}★ · ${meta.forks_count} forks. ${langList.slice(0, 3).join(", ") || "Unknown"}.`,
    origins: meta.fork ? `Forked from ${meta.parent?.full_name || "upstream"}.` : "No direct fork. Code appears original.",
    threats,
    commitDNA: {
      pattern: commits.length > 20 ? "Regular cadence" : commits.length > 5 ? "Clustered burst" : "Sparse",
      anomalyScore: anom,
      authorEntropy: authors.length === 1 ? `Single — ${authors[0] || "unknown"}` : `${authors.length} contributors`,
      lastActivity: commits[0] ? new Date(commits[0].commit?.author?.date).toLocaleDateString() : "Unknown",
      commitTimes: hours.length ? `${Math.min(...hours)}:00 – ${Math.max(...hours)}:00 UTC` : "N/A",
    },
    author: { username: owner, accountAge: ageStr, consistency: authors.length === 1 ? "Single author" : "Multi-contributor", avgScore: score, languages: langList.slice(0, 4) },
    graphNodes, graphLinks, mindNodes, flowNodes, flowLinks,
    depNodes: depNodes.map(d => ({ name: d.label, trust: d.trust, size: parseFloat((langs[d.label] / 100000 || 0.5).toFixed(1)), direct: d.direct })),
  };
}

const SCAN_LOGS = [
  "Initializing Eliza Security Agent…", "Connecting to GitHub API v3…",
  "Fetching repository metadata…", "Reading file tree structure…",
  "Parsing dependency graph…", "Building force simulation nodes…",
  "Detecting commit DNA patterns…", "Running security pattern scan…",
  "Profiling author identity signals…", "Calculating sub-scores…",
  "Rendering interactive visualizations…", "Finalizing Eliza Trust Score…",
];

/* ─── SCORE CIRCLE ──────────────────────────────────────────── */
function ScoreCircle({ score, size = 52 }) {
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(score), 300); return () => clearTimeout(t); }, [score]);
  const r = size / 2 - 6, circ = 2 * Math.PI * r, fill = (anim / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.black} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ - fill} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)" }} />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={T.ink}
        style={{ fontSize: size * .22, fontFamily: FONT.mono, fontWeight: 600 }}>{anim}</text>
    </svg>
  );
}

function CrossCheckBadge({ status }) {
  const normalized = String(status || "").toUpperCase();
  const badgeStyles = normalized === "VERIFIED"
    ? "bg-green-900 text-green-400"
    : normalized === "LIE DETECTED"
      ? "bg-red-900 text-red-400"
      : "bg-yellow-900 text-yellow-300";

  return (
    <span className={`${badgeStyles} inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.18em]`}>
      {normalized || "INCONCLUSIVE"}
    </span>
  );
}

/* ─── COLLAPSIBLE SECTION ───────────────────────────────────── */
function Sec({ title, children, open: init = true }) {
  const [o, setO] = useState(init);
  return (
    <div style={{ marginBottom: 0, borderBottom: `1px solid ${T.border}` }}>
      <button onClick={() => setO(p => !p)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "none", border: "none", color: T.ink, cursor: "pointer",
        padding: "10px 0", width: "100%", fontFamily: FONT.mono,
        fontSize: 10, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase",
      }}>
        <span>{title}</span>
        <span style={{ color: T.inkLt, fontSize: 11 }}>{o ? "−" : "+"}</span>
      </button>
      {o && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </div>
  );
}

/* ─── D3 FORCE GRAPH ────────────────────────────────────────── */
function ForceGraph({ nodes: rawNodes, links: rawLinks }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const simRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });

  useEffect(() => {
    if (!ref.current || !stageRef.current || !rawNodes?.length) return;
    const el = ref.current;
    const stage = stageRef.current;
    const W = el.clientWidth || 680, H = el.clientHeight || 480;
    const nodes = rawNodes.map(d => ({ ...d }));
    const links = rawLinks.map(d => ({ ...d }));
    d3.select(stage).selectAll("*").remove();
    const svg = d3.select(stage).append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([.25, 4]).on("zoom", e => g.attr("transform", e.transform)));
    // arrow marker
    svg.append("defs").append("marker").attr("id", "eza-arr").attr("viewBox", "0 -4 8 8").attr("refX", 16).attr("refY", 0)
      .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
      .append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", "#D4D4D4");
    if (simRef.current) simRef.current.stop();
    simRef.current = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => {
        const t = nodes.find(n => n.id === (d.target.id || d.target));
        return t?.type === "dep" ? 95 : 58;
      }).strength(.55))
      .force("charge", d3.forceManyBody().strength(d => d.type === "root" ? -350 : d.type === "dep" ? -60 : -120))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(d => (d.r || 8) + 8));
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", T.border).attr("stroke-width", 1).attr("marker-end", "url(#eza-arr)");
    const node = g.append("g").selectAll("g").data(nodes).join("g")
      .attr("cursor", "grab")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simRef.current.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; e.sourceEvent.currentTarget.style.cursor = "grabbing"; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simRef.current.alphaTarget(0); d.fx = null; d.fy = null; e.sourceEvent.currentTarget.style.cursor = "grab"; }));
    node.each(function (d) {
      const el2 = d3.select(this);
      const r = d.r || 8;
      const col = nodeColor(d.type, d.flag);
      if (d.type === "root") {
        el2.append("circle").attr("r", r).attr("fill", col);
      } else if (d.type === "comp") {
        el2.append("rect").attr("x", -r).attr("y", -r).attr("width", r * 2).attr("height", r * 2).attr("rx", 2).attr("fill", col);
      } else if (d.type === "util") {
        el2.append("polygon").attr("points", `0,${-r} ${r},${r} ${-r},${r}`).attr("fill", col);
      } else if (d.type === "dep") {
        el2.append("circle").attr("r", r).attr("fill", T.white).attr("stroke", "#A3A3A3").attr("stroke-width", 1.5);
      } else {
        el2.append("circle").attr("r", r).attr("fill", col);
      }
      if (d.flag) el2.append("text").attr("y", -r - 4).attr("text-anchor", "middle").attr("font-size", 9).attr("fill", "#EF4444").text("⚠");
      el2.append("text").attr("dy", (r || 8) + 12).attr("text-anchor", "middle")
        .attr("font-size", 8.5).attr("font-family", FONT.mono).attr("fill", T.inkMd)
        .text(d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label);
    });
    node.on("mouseover", (evt, d) => {
      d3.select(evt.currentTarget).select("circle,rect,polygon").attr("opacity", .7);
      const rect = el.getBoundingClientRect();
      setTooltip({ visible: true, x: evt.clientX - rect.left + 12, y: evt.clientY - rect.top - 10, content: `${d.label} · ${d.type}${d.flag ? " · ⚠ flagged" : ""}` });
    }).on("mouseout", (evt) => {
      d3.select(evt.currentTarget).select("circle,rect,polygon").attr("opacity", 1);
      setTooltip(t => ({ ...t, visible: false }));
    });
    simRef.current.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });
    return () => { if (simRef.current) simRef.current.stop(); };
  }, [rawNodes, rawLinks]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={stageRef} style={{ position: "absolute", inset: 0 }} />
      {tooltip.visible && (
        <div style={{ position: "absolute", left: tooltip.x, top: tooltip.y, background: T.black, color: T.white, fontFamily: FONT.mono, fontSize: 10, padding: "5px 10px", borderRadius: 4, pointerEvents: "none", zIndex: 10 }}>
          {tooltip.content}
        </div>
      )}
      {/* Legend */}
      <div style={{ position: "absolute", bottom: 12, left: 12, background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 10, fontFamily: FONT.mono }}>
        {[["root/config", "●", "#0A0A0A"], ["component", "■", "#737373"], ["utility", "▲", "#A3A3A3"], ["dep", "○", "#A3A3A3"]].map(([l, s, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ color: c, fontSize: 11 }}>{s}</span>
            <span style={{ color: T.inkMd }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontFamily: FONT.mono, color: T.inkLt }}>
        Drag · Scroll zoom · Hover
      </div>
    </div>
  );
}

/* ─── D3 MIND MAP ───────────────────────────────────────────── */
function MindMap({ nodes: rawNodes }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });

  useEffect(() => {
    if (!ref.current || !stageRef.current || !rawNodes?.length) return;
    const el = ref.current;
    const stage = stageRef.current;
    const W = el.clientWidth || 680, H = el.clientHeight || 480;
    d3.select(stage).selectAll("*").remove();
    const svg = d3.select(stage).append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g").attr("transform", `translate(${W / 2},${H / 2})`);
    svg.call(d3.zoom().scaleExtent([.3, 3]).on("zoom", e => g.attr("transform", e.transform)));
    const byId = {}; rawNodes.forEach(n => { byId[n.id] = n; });
    const root = rawNodes.find(n => n.depth === 0);
    function buildTree(n) { return { ...n, children: rawNodes.filter(c => c.parent === n.id).map(buildTree) }; }
    const hier = d3.hierarchy(buildTree(root));
    const R = Math.min(W, H) * .38;
    d3.cluster().size([2 * Math.PI, R])(hier);
    g.selectAll("path").data(hier.links()).join("path")
      .attr("fill", "none").attr("stroke", T.border).attr("stroke-width", 1.5)
      .attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y));
    const nodeG = g.selectAll("g").data(hier.descendants()).join("g")
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
      .attr("cursor", "pointer");
    nodeG.append("circle")
      .attr("r", d => d.depth === 0 ? 10 : d.depth === 1 ? 6 : 4)
      .attr("fill", d => d.data.flag ? "#EF4444" : d.depth === 0 ? T.black : d.depth === 1 ? "#404040" : "#A3A3A3")
      .on("mouseover", (evt, d) => {
        d3.select(evt.currentTarget).transition().duration(150).attr("r", d.depth === 0 ? 14 : d.depth === 1 ? 9 : 7);
        const rect = el.getBoundingClientRect();
        setTooltip({ visible: true, x: evt.clientX - rect.left + 10, y: evt.clientY - rect.top - 10, content: `${d.data.label}${d.data.flag ? " · ⚠" : ""}` });
      })
      .on("mouseout", (evt, d) => {
        d3.select(evt.currentTarget).transition().duration(150).attr("r", d.depth === 0 ? 10 : d.depth === 1 ? 6 : 4);
        setTooltip(t => ({ ...t, visible: false }));
      });
    nodeG.append("text")
      .attr("dy", "0.31em")
      .attr("x", d => d.x < Math.PI === !d.children ? 8 : -8)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .attr("font-size", d => d.depth === 0 ? 11 : 9)
      .attr("font-family", FONT.mono)
      .attr("fill", d => d.data.flag ? "#EF4444" : d.depth === 0 ? T.black : T.inkMd)
      .attr("font-weight", d => d.depth === 0 ? 600 : 400)
      .text(d => d.data.label);
  }, [rawNodes]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={stageRef} style={{ position: "absolute", inset: 0 }} />
      {tooltip.visible && (
        <div style={{ position: "absolute", left: tooltip.x, top: tooltip.y, background: T.black, color: T.white, fontFamily: FONT.mono, fontSize: 10, padding: "5px 10px", borderRadius: 4, pointerEvents: "none", zIndex: 10 }}>
          {tooltip.content}
        </div>
      )}
      <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontFamily: FONT.mono, color: T.inkLt }}>Radial tree · Scroll zoom</div>
    </div>
  );
}

/* ─── D3 CODE FLOW ──────────────────────────────────────────── */
function CodeFlow({ flowNodes, flowLinks }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const particleTimers = useRef([]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });

  useEffect(() => {
    if (!ref.current || !stageRef.current || !flowNodes?.length) return;
    const el = ref.current;
    const stage = stageRef.current;
    const W = el.clientWidth || 680, H = el.clientHeight || 480;
    particleTimers.current.forEach(t => clearTimeout(t));
    particleTimers.current = [];
    d3.select(stage).selectAll("*").remove();
    const svg = d3.select(stage).append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([.4, 2.5]).on("zoom", e => g.attr("transform", e.transform)));
    const NW = 108, NH = 38;
    const pos = {};
    flowNodes.forEach(n => { pos[n.id] = { x: n.x * W, y: n.y * H }; });
    const typeStyle = { io: { fill: T.black, text: T.white }, proc: { fill: "#404040", text: T.white }, data: { fill: T.white, text: T.ink, stroke: "#A3A3A3" } };
    // links
    g.selectAll("line.fl").data(flowLinks).join("line")
      .attr("class", "fl").attr("x1", d => pos[d.s].x).attr("y1", d => pos[d.s].y)
      .attr("x2", d => pos[d.t].x).attr("y2", d => pos[d.t].y)
      .attr("stroke", T.border).attr("stroke-width", 1.5).attr("stroke-dasharray", "4,3");
    // animated particles
    const pg = g.append("g");
    flowLinks.forEach((l, i) => {
      function spawnParticle() {
        const p = pg.append("circle").attr("r", 3).attr("fill", T.black).attr("opacity", .8)
          .attr("cx", pos[l.s].x).attr("cy", pos[l.s].y);
        p.transition().duration(800 + Math.random() * 300)
          .attr("cx", pos[l.t].x).attr("cy", pos[l.t].y)
          .attr("opacity", 0)
          .on("end", () => { p.remove(); const t = setTimeout(spawnParticle, Math.random() * 1800 + 400); particleTimers.current.push(t); });
      }
      const t = setTimeout(spawnParticle, i * 200);
      particleTimers.current.push(t);
    });
    // nodes
    const nodeG = g.selectAll("g.fn").data(flowNodes).join("g").attr("class", "fn")
      .attr("transform", d => `translate(${pos[d.id].x - NW / 2},${pos[d.id].y - NH / 2})`)
      .attr("cursor", "pointer");
    nodeG.each(function (d) {
      const el2 = d3.select(this);
      const st = typeStyle[d.type];
      el2.append("rect").attr("width", NW).attr("height", NH).attr("rx", 5)
        .attr("fill", st.fill).attr("stroke", st.stroke || "none").attr("stroke-width", 1.5);
      el2.append("text").attr("x", NW / 2).attr("y", NH / 2 + 4)
        .attr("text-anchor", "middle").attr("font-size", 10).attr("font-family", FONT.mono)
        .attr("fill", st.text).attr("font-weight", 600).text(d.label);
    });
    nodeG.on("mouseover", (evt, d) => {
      d3.select(evt.currentTarget).select("rect").transition().duration(100).attr("opacity", .75);
      const rect = el.getBoundingClientRect();
      setTooltip({ visible: true, x: evt.clientX - rect.left + 10, y: evt.clientY - rect.top - 10, content: `${d.label} · ${d.type}` });
    }).on("mouseout", (evt) => {
      d3.select(evt.currentTarget).select("rect").transition().duration(100).attr("opacity", 1);
      setTooltip(t => ({ ...t, visible: false }));
    });
    return () => { particleTimers.current.forEach(t => clearTimeout(t)); };
  }, [flowNodes, flowLinks]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={stageRef} style={{ position: "absolute", inset: 0 }} />
      {tooltip.visible && (
        <div style={{ position: "absolute", left: tooltip.x, top: tooltip.y, background: T.black, color: T.white, fontFamily: FONT.mono, fontSize: 10, padding: "5px 10px", borderRadius: 4, pointerEvents: "none", zIndex: 10 }}>
          {tooltip.content}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 12, left: 12, fontFamily: FONT.mono, fontSize: 10, color: T.inkLt }}>
        ● = data packet flow · Scroll zoom
      </div>
    </div>
  );
}

/* ─── D3 DEP NODES ──────────────────────────────────────────── */
function DepNodes({ deps }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const simRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });

  useEffect(() => {
    if (!ref.current || !stageRef.current || !deps?.length) return;
    const el = ref.current;
    const stage = stageRef.current;
    const W = el.clientWidth || 680, H = el.clientHeight || 480;
    d3.select(stage).selectAll("*").remove();
    const center = { id: "__root", name: "package.json", trust: null, size: 2, direct: true };
    const allNodes = [center, ...deps].map(d => ({ ...d, id: d.id || d.name }));
    const allLinks = deps.map(d => ({ source: "__root", target: d.name }));
    const svg = d3.select(stage).append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${W} ${H}`);
    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([.3, 3]).on("zoom", e => g.attr("transform", e.transform)));
    if (simRef.current) simRef.current.stop();
    simRef.current = d3.forceSimulation(allNodes)
      .force("link", d3.forceLink(allLinks).id(d => d.id).distance(100).strength(.5))
      .force("charge", d3.forceManyBody().strength(d => d.id === "__root" ? -400 : -80))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(d => d.id === "__root" ? 30 : Math.max(14, (d.size || .5) * 9) + 8));
    const link = g.append("g").selectAll("line").data(allLinks).join("line")
      .attr("stroke", T.border).attr("stroke-width", 1);
    const nodeG = g.append("g").selectAll("g").data(allNodes).join("g")
      .attr("cursor", "grab")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) simRef.current.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simRef.current.alphaTarget(0); d.fx = null; d.fy = null; }));
    nodeG.each(function (d) {
      const el2 = d3.select(this);
      const r = d.id === "__root" ? 22 : Math.max(12, (d.size || .5) * 9);
      const col = d.id === "__root" ? T.black : d.trust >= 80 ? T.black : d.trust >= 60 ? "#737373" : "#A3A3A3";
      el2.append("circle").attr("r", r).attr("fill", col);
      if (d.direct === false) el2.append("circle").attr("r", r + 4).attr("fill", "none").attr("stroke", T.border).attr("stroke-width", 1).attr("stroke-dasharray", "3,2");
      el2.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
        .attr("font-size", d.id === "__root" ? 9 : 8).attr("font-family", FONT.mono).attr("fill", T.white).attr("font-weight", 600)
        .text(d.id === "__root" ? "pkg.json" : (d.name || d.id).length > 10 ? (d.name || d.id).slice(0, 9) + "…" : (d.name || d.id));
      if (d.trust != null) el2.append("text").attr("text-anchor", "middle").attr("dy", r + 13)
        .attr("font-size", 8).attr("font-family", FONT.mono).attr("fill", T.inkLt).text(d.trust + "/100");
    });
    nodeG.on("mouseover", (evt, d) => {
      d3.select(evt.currentTarget).select("circle").transition().duration(100).attr("opacity", .7);
      const rect = el.getBoundingClientRect();
      setTooltip({ visible: true, x: evt.clientX - rect.left + 12, y: evt.clientY - rect.top - 10, content: d.id === "__root" ? "package.json · Root" : `${d.name} · trust ${d.trust}/100 · ${d.direct ? "direct" : "transitive"}` });
    }).on("mouseout", (evt) => {
      d3.select(evt.currentTarget).select("circle").transition().duration(100).attr("opacity", 1);
      setTooltip(t => ({ ...t, visible: false }));
    });
    simRef.current.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      nodeG.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });
    return () => { if (simRef.current) simRef.current.stop(); };
  }, [deps]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={stageRef} style={{ position: "absolute", inset: 0 }} />
      {tooltip.visible && (
        <div style={{ position: "absolute", left: tooltip.x, top: tooltip.y, background: T.black, color: T.white, fontFamily: FONT.mono, fontSize: 10, padding: "5px 10px", borderRadius: 4, pointerEvents: "none", zIndex: 10 }}>
          {tooltip.content}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 12, left: 12, fontFamily: FONT.mono, fontSize: 10, color: T.inkLt }}>
        Size = package size · Dashed ring = transitive
      </div>
    </div>
  );
}

/* ─── COMMIT HEATMAP ────────────────────────────────────────── */
function CommitHeatmap() {
  const weeks = 16;
  const data = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, () => w >= 14 ? (Math.random() > .4 ? Math.ceil(Math.random() * 4) : 0) : 0)
  );
  const shades = ["#F5F5F5", "#D4D4D4", "#A3A3A3", "#525252", "#0A0A0A"];
  return (
    <div>
      <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, marginBottom: 10, letterSpacing: .5 }}>COMMIT ACTIVITY — 16 WEEKS</div>
      <div style={{ display: "flex", gap: 3 }}>
        {data.map((wk, w) => (
          <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {wk.map((v, d) => <div key={d} style={{ width: 12, height: 12, borderRadius: 2, background: shades[Math.min(v, 4)], border: `1px solid ${T.border}` }} />)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center", fontSize: 10, color: T.inkLt, fontFamily: FONT.sans }}>
        <span>Less</span>{shades.map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 1, background: c, border: `1px solid ${T.border}` }} />)}<span>More</span>
      </div>
    </div>
  );
}

/* ─── SHARE MODAL ───────────────────────────────────────────── */
function ShareModal({ repo, onClose }) {
  const [tab, setTab] = useState("badge");
  const [copied, setCopied] = useState("");
  const scanId = `ESA-${repo.owner.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="32"><rect width="240" height="32" rx="4" fill="#ffffff" stroke="#000000" stroke-width="1"/><rect width="32" height="32" rx="4" fill="#000000"/><text x="16" y="20" font-family="monospace" font-size="9" font-weight="600" fill="#ffffff" text-anchor="middle">EZ</text><text x="138" y="12" font-family="monospace" font-size="8" fill="#737373" text-anchor="middle">ELIZA SECURITY AGENT</text><text x="138" y="24" font-family="monospace" font-size="9" font-weight="600" fill="#0a0a0a" text-anchor="middle">${repo.fullName} · ${repo.score}/100 · ${repo.tier}</text></svg>`;
  const thread = `🔍 Scanned ${repo.fullName} with @ElizaSecAgent\n\nTrust Score: ${repo.score}/100 — ${repo.tier}\n\nOrigin ${repo.subScores.origin} · Build ${repo.subScores.build} · Security ${repo.subScores.security}\nAuthor ${repo.subScores.author} · Activity ${repo.subScores.activity} · Community ${repo.subScores.community}\n\n${repo.threats.filter(t => t.sev !== "INFO").length > 0 ? `⚠ ${repo.threats.filter(t => t.sev !== "INFO").length} issue(s) flagged` : "✅ No critical issues"}\n\nScan ID: ${scanId}`;
  function copy(t, k) { navigator.clipboard.writeText(t).then(() => { setCopied(k); setTimeout(() => setCopied(""), 2000); }); }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, width: 460, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.12)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13 }}>Share — {repo.fullName}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: T.inkLt }}>×</button>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {["badge", "ct thread", "embed"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: "none", border: "none", color: tab === t ? T.ink : T.inkLt, borderBottom: tab === t ? `2px solid ${T.black}` : "2px solid transparent", padding: "11px 8px", cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          {tab === "badge" && <>
            <div style={{ fontSize: 10, fontFamily: FONT.mono, color: T.inkLt, marginBottom: 10, letterSpacing: .5 }}>PREVIEW</div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, display: "flex", justifyContent: "center", marginBottom: 14 }} dangerouslySetInnerHTML={{ __html: svg }} />
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkMd, marginBottom: 14 }}>Scan ID: <strong>{scanId}</strong></div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["Copy SVG", svg, "svg"], ["Markdown", `![Eliza](data:image/svg+xml;base64,${btoa(svg)})`, "md"], ["Scan ID", scanId, "id"]].map(([l, v, k]) => (
                <button key={k} onClick={() => copy(v, k)} style={{ background: copied === k ? T.black : T.white, color: copied === k ? T.white : T.ink, border: `1px solid ${T.black}`, borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, fontWeight: 600, transition: "all .15s" }}>{copied === k ? "✓ Copied" : l}</button>
              ))}
            </div>
          </>}
          {tab === "ct thread" && <>
            <pre style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, fontFamily: FONT.mono, fontSize: 11, color: T.inkMd, whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 14, lineHeight: 1.7 }}>{thread}</pre>
            <button onClick={() => copy(thread, "ct")} style={{ background: copied === "ct" ? T.black : T.white, color: copied === "ct" ? T.white : T.ink, border: `1px solid ${T.black}`, borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, fontWeight: 600 }}>{copied === "ct" ? "✓ Copied" : "Copy thread"}</button>
          </>}
          {tab === "embed" && <>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontFamily: FONT.mono, fontSize: 11, color: T.inkMd, marginBottom: 14, wordBreak: "break-all" }}>https://eliza-security.io/scan/{repo.fullName}?id={scanId}</div>
            <button onClick={() => copy(`https://eliza-security.io/scan/${repo.fullName}?id=${scanId}`, "link")} style={{ background: copied === "link" ? T.black : T.white, color: copied === "link" ? T.white : T.ink, border: `1px solid ${T.black}`, borderRadius: 5, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, fontWeight: 600 }}>{copied === "link" ? "✓ Copied" : "Copy link"}</button>
          </>}
        </div>
      </div>
    </div>
  );
}

const TOKEN_CA = "8FvGDQ9x6cZ1xgd4FfT8tLHjDPX8pErxPCwwkk6gpump";

/* ─── LANDING PAGE ──────────────────────────────────────────── */
function Landing({ onEnter, onNavigate }) {
  const { publicKey, connected, connecting, select, connect, wallets } = useWallet();
  const [tick, setTick] = useState(0);
  const [caCopied, setCaCopied] = useState(false);
  const [walletError, setWalletError] = useState("");
  useEffect(() => { const i = setInterval(() => setTick(p => p + 1), 100); return () => clearInterval(i); }, []);
  const cur = tick % 8 < 4 ? "|" : " ";
  const phantomWallet = wallets.find(wallet => wallet.adapter.name === "Phantom");
  const shortAddress = publicKey ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}` : "";
  const primaryLabel = connected ? "Launch App →" : connecting ? "Connecting Phantom..." : "Connect Phantom to Launch";
  const walletStatus = connected ? `Phantom connected · ${shortAddress}` : "Phantom wallet required before launch";

  const copyCA = () => {
    navigator.clipboard.writeText(TOKEN_CA).then(() => {
      setCaCopied(true);
      setTimeout(() => setCaCopied(false), 2000);
    });
  };

  const connectPhantom = useCallback(async () => {
    setWalletError("");

    if (!phantomWallet) {
      setWalletError("Phantom wallet is not available in this browser.");
      return false;
    }

    try {
      select(phantomWallet.adapter.name);
      await connect();
      return true;
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Unable to connect Phantom wallet.");
      return false;
    }
  }, [connect, phantomWallet, select]);

  const handleLaunch = useCallback(async () => {
    if (connecting) return;

    if (!connected) {
      const didConnect = await connectPhantom();
      if (!didConnect) return;
    }

    onEnter();
  }, [connected, connecting, connectPhantom, onEnter]);

  const features = [
    { n: "01", t: "Eliza Trust Score", d: "Composite 0–100 score across six dimensions: Origin, Build, Security, Author, Activity, Community." },
    { n: "02", t: "Force Graph", d: "Interactive D3.js force-directed node graph of your entire repository. Drag, zoom, inspect." },
    { n: "03", t: "Mind Map", d: "Radial tree visualization of repo structure. Every folder, file, and config at a glance." },
    { n: "04", t: "Code Flow", d: "Animated particle flow showing data paths through your application architecture." },
    { n: "05", t: "Dep Nodes", d: "Dependency bubble chart. Size = package size. Color = trust score. Direct vs transitive." },
    { n: "06", t: "Ask Eliza", d: "AI-powered chat. Ask anything about the scan result, risks, or how to improve the score." },
  ];
  return (
    <div style={{ minHeight: "100vh", background: T.white, fontFamily: FONT.sans, color: T.ink, overflowX: "hidden" }}>
      <nav style={{ display: "flex", alignItems: "center", padding: "18px 48px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.white, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={BRAND_IMAGE}
            alt="WZ"
            style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", border: `1px solid ${T.border}` }}
          />
          <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 15, letterSpacing: -.2 }}>Eliza Security Agent</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 8 }}>
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" style={{ color: T.inkMd, display: "flex", transition: "color .2s" }} onMouseEnter={e => e.currentTarget.style.color = T.ink} onMouseLeave={e => e.currentTarget.style.color = T.inkMd}>
            <GitHubIcon size={18} />
          </a>
          <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" style={{ color: T.inkMd, display: "flex", transition: "color .2s" }} onMouseEnter={e => e.currentTarget.style.color = T.ink} onMouseLeave={e => e.currentTarget.style.color = T.inkMd}>
            <XIcon size={18} />
          </a>
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{ background: "none", border: "none", color: T.inkMd, cursor: "pointer", fontSize: 13, fontFamily: FONT.sans, marginLeft: 28, fontWeight: 500 }}
            onMouseEnter={e => e.target.style.color = T.ink}
            onMouseLeave={e => e.target.style.color = T.inkMd}
          >
            {item.label}
          </button>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 999, padding: "6px 12px", background: connected ? "#F5F5F5" : "transparent" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? T.black : T.inkLt, display: "inline-block" }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkMd, letterSpacing: .6 }}>
              {connected ? `PHANTOM ${shortAddress}` : "PHANTOM REQUIRED"}
            </span>
          </div>
          <button onClick={handleLaunch} style={{ background: T.black, color: T.white, border: "none", borderRadius: 6, padding: "9px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT.sans }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{primaryLabel}</button>
        </div>
      </nav>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "88px 48px 72px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 14px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.black, display: "inline-block" }} />
            <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.inkMd, letterSpacing: .5 }}>REPOSITORY INTELLIGENCE PLATFORM · v4.0</span>
          </div>

          <div
            onClick={copyCA}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: T.black,
              borderRadius: 20,
              padding: "4px 14px",
              cursor: "pointer",
              transition: "transform .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <span style={{ color: "rgba(255,255,255,.55)", fontFamily: FONT.mono, fontSize: 11, fontWeight: 600 }}>CA</span>
            <span style={{ color: T.white, fontFamily: FONT.mono, fontSize: 11, letterSpacing: .5 }}>
              {caCopied ? "COPIED TO CLIPBOARD" : TOKEN_CA}
            </span>
          </div>
        </div>

        <h1 style={{ fontFamily: FONT.display, fontSize: "clamp(40px,5.5vw,72px)", lineHeight: 1.07, fontWeight: 400, margin: "0 0 22px", maxWidth: 780 }}>
          Repository intelligence.<br /><em>Trust verified{cur}</em>
        </h1>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${T.border}`, borderRadius: 999, padding: "6px 14px", marginBottom: 20, background: connected ? "#F5F5F5" : "transparent" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? T.black : T.inkLt, display: "inline-block" }} />
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.inkMd, letterSpacing: .5 }}>{walletStatus}</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handleLaunch} style={{ background: T.black, color: T.white, border: "none", borderRadius: 7, padding: "13px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT.sans }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{primaryLabel}</button>
          <button onClick={() => onNavigate("docs")} style={{ background: T.white, color: T.ink, border: `1px solid ${T.borderMd}`, borderRadius: 7, padding: "13px 22px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: FONT.sans }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.black} onMouseLeave={e => e.currentTarget.style.borderColor = T.borderMd}>View docs</button>
        </div>
        {walletError && <div style={{ marginTop: 14, color: "#b91c1c", fontSize: 12, fontFamily: FONT.mono }}>{walletError}</div>}
        <div style={{ display: "flex", gap: 0, marginTop: 64, borderTop: `1px solid ${T.border}`, paddingTop: 44, flexWrap: "wrap" }}>
          {[["4", "D3.js visualizations"], ["6", "Trust dimensions"], ["Real-time", "GitHub API"], ["AI", "Ask Eliza"]].map(([v, l], i) => (
            <div key={l} style={{ flex: "1 1 140px", paddingRight: 36, paddingLeft: i > 0 ? 36 : 0, borderLeft: i > 0 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 26, fontWeight: 600, letterSpacing: -1 }}>{v}</div>
              <div style={{ fontSize: 13, color: T.inkMd, marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: "32px 28px", borderRight: i % 3 < 2 ? `1px solid ${T.border}` : "none", borderBottom: i < 3 ? `1px solid ${T.border}` : "none", transition: "background .15s", cursor: "default" }}
                onMouseEnter={e => e.currentTarget.style.background = "#F0F0F0"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, marginBottom: 12 }}>{f.n}</div>
                <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.t}</div>
                <div style={{ fontSize: 12, color: T.inkMd, lineHeight: 1.7 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "64px 48px", textAlign: "center" }}>
        <h2 style={{ fontFamily: FONT.display, fontSize: 36, fontWeight: 400, margin: "0 0 14px" }}>Ready to interrogate your repos?</h2>
        <p style={{ color: T.inkMd, marginBottom: 28, fontSize: 13 }}>Free · No signup · Real GitHub API · D3.js visualizations</p>

        <div
          onClick={copyCA}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: T.black,
            borderRadius: 8,
            padding: "10px 16px",
            cursor: "pointer",
            marginBottom: 24,
            transition: "all .2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ color: "rgba(255,255,255,.55)", fontFamily: FONT.mono, fontSize: 12, fontWeight: 600 }}>CA</span>
          <span style={{ color: T.white, fontFamily: FONT.mono, fontSize: 12, letterSpacing: .5 }}>{caCopied ? "COPIED!" : TOKEN_CA}</span>
        </div>

        <br />
        <button onClick={handleLaunch} style={{ background: T.black, color: T.white, border: "none", borderRadius: 7, padding: "13px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT.sans }}>Launch Eliza →</button>
        <div style={{ marginTop: 52, fontFamily: FONT.mono, fontSize: 10, color: T.inkMd, letterSpacing: 1 }}>ELIZA SECURITY AGENT v4.0</div>
      </div>
    </div>
  );
}

function AppTopbar({ view, onNavigate }) {
  const isAppView = view === "app";

  return (
    <div style={{ height: 54, background: T.white, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 16, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onNavigate("landing")}>
        <img
          src={BRAND_IMAGE}
          alt="WZ"
          style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", border: `1px solid ${T.border}` }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 14 }}>Eliza Security Agent</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt, letterSpacing: .8 }}>docs suite v4.3</span>
        </div>
      </div>
      <div style={{ width: 1, height: 18, background: T.border }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {NAV_ITEMS.map(item => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                background: active ? T.surface : "transparent",
                color: active ? T.ink : T.inkMd,
                border: "none",
                borderBottom: active ? `2px solid ${T.black}` : "2px solid transparent",
                cursor: "pointer",
                padding: "15px 12px 13px",
                fontSize: 12,
                fontFamily: FONT.sans,
                fontWeight: active ? 700 : 500,
                transition: "all .15s",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 16 }}>
        <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" style={{ color: T.inkMd, display: "flex", transition: "color .2s" }} onMouseEnter={e => e.currentTarget.style.color = T.ink} onMouseLeave={e => e.currentTarget.style.color = T.inkMd}>
          <GitHubIcon size={18} />
        </a>
        <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" style={{ color: T.inkMd, display: "flex", transition: "color .2s" }} onMouseEnter={e => e.currentTarget.style.color = T.ink} onMouseLeave={e => e.currentTarget.style.color = T.inkMd}>
          <XIcon size={18} />
        </a>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.border}`, borderRadius: 999, padding: "6px 10px", fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.black, display: "inline-block" }} />
          <span style={{ fontFamily: FONT.mono, color: T.inkMd, fontSize: 10 }}>3/5 <span style={{ color: T.inkLt }}>free scans/hr</span></span>
        </div>
        {!isAppView && (
          <button
            onClick={() => onNavigate("app")}
            style={{ background: T.black, color: T.white, border: "none", borderRadius: 999, padding: "9px 16px", cursor: "pointer", fontFamily: FONT.sans, fontSize: 12, fontWeight: 700 }}
          >
            Launch App →
          </button>
        )}
      </div>
    </div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? T.black : T.white,
        color: copied ? T.white : T.ink,
        border: `1px solid ${T.borderMd}`,
        borderRadius: 999,
        padding: "7px 12px",
        cursor: "pointer",
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

function DocsPage() {
  const sections = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.35fr .9fr", gap: 24 }}>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: 24, background: "linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, marginBottom: 10 }}>OVERVIEW</div>
              <h2 style={{ fontFamily: FONT.display, fontWeight: 400, fontSize: 36, lineHeight: 1.05, margin: "0 0 14px" }}>Repository intelligence for teams that need evidence, not vibes.</h2>
              <p style={{ margin: 0, maxWidth: 560, color: T.inkMd, fontSize: 14, lineHeight: 1.8 }}>
                Eliza Security Agent scans a public repository, builds a live trust score, highlights suspicious patterns,
                and turns raw GitHub metadata into something an investor, auditor, or maintainer can act on.
              </p>
            </div>
            <div style={{ background: "#0b0b0d", color: T.white, borderRadius: 18, padding: 24, boxShadow: "0 24px 64px rgba(10,10,10,.14)" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.5)", letterSpacing: 1, marginBottom: 10 }}>QUICK START</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: FONT.mono, fontSize: 12, lineHeight: 1.8 }}>{`pnpm install\npnpm dev\n# open /docs for platform guide\n# open /api for endpoint reference`}</pre>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 18 }}>
            {[
              ["Trust score", "Six weighted dimensions compressed into a single read for triage."],
              ["Threat cards", "Severity-coded findings with file and line context."],
              ["Interactive views", "Force graph, mind map, code flow, dependency map, and explorer."],
            ].map(([title, desc]) => (
              <div key={title} style={{ border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, background: T.white }}>
                <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{title}</div>
                <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.75 }}>{desc}</div>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "elizaox",
      label: "$ELIZAOX Token",
      content: (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 22 }}>
            <div style={{ background: "#0b0b0d", color: T.white, borderRadius: 18, padding: 24, position: "relative" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: 1, marginBottom: 12 }}>TOKEN OVERVIEW</div>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 10, columnGap: 10, fontFamily: FONT.mono, fontSize: 12 }}>
                <span style={{ color: "rgba(255,255,255,.55)" }}>Ticker</span><span>$ELIZAOX</span>
                <span style={{ color: "rgba(255,255,255,.55)" }}>CA</span>
                <span style={{ wordBreak: "break-all", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }} onClick={() => navigator.clipboard.writeText(TOKEN_CA)}>
                  {TOKEN_CA}
                  <span style={{ fontSize: 9, opacity: .4 }}>(CLICK TO COPY)</span>
                </span>
                <span style={{ color: "rgba(255,255,255,.55)" }}>Standard</span><span>SPL Token</span>
                <span style={{ color: "rgba(255,255,255,.55)" }}>Type</span><span>Utility / Community</span>
                <span style={{ color: "rgba(255,255,255,.55)" }}>Launch</span><span>pump.fun</span>
                <span style={{ color: "rgba(255,255,255,.55)" }}>Supply</span><span>1,000,000,000</span>
              </div>
            </div>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: 24, background: "linear-gradient(160deg, #f8f8f8 0%, #fff 60%)" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, marginBottom: 12 }}>HOW TO GET $ELIZAOX</div>
              <ol style={{ margin: 0, paddingLeft: 18, color: T.inkMd, fontSize: 13, lineHeight: 1.9 }}>
                <li>Get a Solana wallet such as Phantom, Solflare, or Backpack.</li>
                <li>Visit pump.fun or Bags.fm and search for $ELIZAOX.</li>
                <li>Swap SOL for $ELIZAOX. Hold at least 10,000 for the API access tier.</li>
                <li>Connect your wallet in Eliza when wallet support lands.</li>
              </ol>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 18 }}>
            {[
              ["Unlimited scans", "Beyond the public 5/hr limit. Stake to unlock continuous scans."],
              ["VERIFIED badge priority", "Higher priority queue when your team requests a verified badge review."],
              ["API access", "Hold at least 10,000 $ELIZAOX to unlock API access tiers and scan quotas."],
              ["Governance", "Vote on scoring weights, threat libraries, and roadmap priorities on-chain."],
              ["Leaderboard boost", "Top holders can qualify for Verified Builder status and richer profile placement."],
              ["Advanced insights", "Deep commit DNA review, duplicate detection, and AI-assisted code intelligence."],
            ].map(([title, desc], index) => (
              <div key={title} style={{ border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, background: index % 2 === 0 ? T.white : T.surface }}>
                <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{title}</div>
                <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.8 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ background: "#0b0b0d", color: T.white, borderRadius: 18, padding: 22 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: 1, marginBottom: 12 }}>DISCLAIMER</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: FONT.mono, fontSize: 12, lineHeight: 1.8 }}>{`$ELIZAOX is a community utility token. Not an investment product,\nsecurity, or financial instrument. Token value is not guaranteed.\nPurchase only what you can afford to lose. DYOR. NFA.`}</pre>
            </div>
          </div>
        </>
      ),
    },
    {
      id: "scoring",
      label: "Trust Scoring",
      content: (
        <>
          <p style={{ margin: "0 0 16px", color: T.inkMd, fontSize: 13, lineHeight: 1.8 }}>The Eliza Trust Score compresses repository evidence into a 0–100 signal. It is designed for quick triage, not blind faith.</p>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden" }}>
            {[
              ["Origin", "25%", "Fork history, code provenance, README consistency"],
              ["Build", "20%", "Dependencies, config hygiene, repository shape"],
              ["Security", "20%", "Threat matches, suspicious files, exposed patterns"],
              ["Author", "15%", "Contributor trust, account age, delivery consistency"],
              ["Activity", "10%", "Commit cadence and recency"],
              ["Community", "10%", "Stars, forks, discussion, ecosystem signals"],
            ].map(([label, weight, desc], index) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "180px 90px 1fr", gap: 12, padding: "14px 18px", borderTop: index === 0 ? "none" : `1px solid ${T.border}`, background: index % 2 ? T.surface : T.white }}>
                <div style={{ fontWeight: 700 }}>{label}</div>
                <div style={{ fontFamily: FONT.mono, color: T.inkMd }}>{weight}</div>
                <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 18 }}>
            {[
              ["VERIFIED", "85–100"],
              ["TRUSTED", "70–84"],
              ["CAUTION", "55–69"],
              ["SUSPICIOUS", "40–54"],
              ["HIGH RISK", "0–39"],
            ].map(([tier, range]) => (
              <div key={tier} style={{ border: `1px solid ${T.border}`, borderRadius: 16, padding: 16, textAlign: "center" }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, marginBottom: 6 }}>{range}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{tier}</div>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      id: "threats",
      label: "Threat Detection",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            ["CRITICAL", "Hardcoded keys, remote loaders, destructive scripts", "#7f1d1d", "#fef2f2"],
            ["HIGH", "Brand-new repos, suspicious fork trees, binary payloads", "#9a3412", "#fff7ed"],
            ["MEDIUM", "Wildcard dependencies, sparse history, rename clones", "#92400e", "#fffbeb"],
            ["LOW / INFO", "Missing docs, no license, metadata gaps", "#374151", "#f9fafb"],
          ].map(([sev, desc, ink, bg]) => (
            <div key={sev} style={{ borderRadius: 18, padding: 18, background: bg, border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1, color: ink, marginBottom: 10 }}>{sev}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Severity card</div>
              <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.75 }}>{desc}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "graphs",
      label: "Visualizations",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[
            ["Force Graph", "Maps the repository root, top-level nodes, dependencies, and threat flags into a draggable cluster."],
            ["Mind Map", "Radial repository tree for quick structural orientation across folders, configs, and entrypoints."],
            ["Code Flow", "Narrative-style architecture view showing how user input, API routes, and scoring move through the system."],
            ["Dep Nodes", "Bubble field of dependency trust and size for spotting unusual packages at a glance."],
          ].map(([title, desc]) => (
            <div key={title} style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: 18, background: T.white }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
              <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.8 }}>{desc}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "explorer",
      label: "Code Explorer",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>What the explorer handles</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.inkMd, fontSize: 12, lineHeight: 1.85 }}>
              <li>Lazy folder loading against the live GitHub contents API</li>
              <li>Search within active files</li>
              <li>Threat-linked line highlights</li>
              <li>Language-aware inline code rendering</li>
            </ul>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Annotations</div>
            <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.8 }}>
              Explorer rows can surface folder state, file type icons, active selection, and threat badges without leaving the scan view.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "compare",
      label: "Compare Mode",
      content: (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>How to compare two repositories</div>
          <ol style={{ margin: 0, paddingLeft: 18, color: T.inkMd, fontSize: 12, lineHeight: 1.9 }}>
            <li>Run the first scan and review the graph, threats, and score card.</li>
            <li>Open compare mode from the primary analysis workspace.</li>
            <li>Load a second repository and inspect tier, language mix, and score deltas side by side.</li>
            <li>Use the comparison as a quick shortlist filter before deeper manual review.</li>
          </ol>
        </div>
      ),
    },
    {
      id: "badge",
      label: "Proof of Scan",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 18, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Badge types</div>
            <div style={{ color: T.inkMd, fontSize: 12, lineHeight: 1.8 }}>SVG badges, public scan IDs, CT-ready threads, and embed links let teams prove that a repository was scanned at a specific point in time.</div>
          </div>
          <div style={{ background: "#0b0b0d", color: T.white, borderRadius: 18, padding: 20 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: 1, marginBottom: 8 }}>EMBED EXAMPLE</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: FONT.mono, fontSize: 11, lineHeight: 1.8 }}>{`![Eliza Scan](https://eliza-security-agent.vercel.app/api/badge/ESA-HAN-01A2B3C)`}</pre>
          </div>
        </div>
      ),
    },
  ];

  function jumpToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden", background: "linear-gradient(180deg, #fafafa 0%, #ffffff 26%)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "250px minmax(0, 1fr)", height: "100%" }}>
        <aside style={{ borderRight: `1px solid ${T.border}`, padding: 22, overflowY: "auto", background: "rgba(250,250,250,.92)" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, marginBottom: 14 }}>DOCS INDEX</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => jumpToSection(section.id)}
                style={{ textAlign: "left", background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: "10px 12px", cursor: "pointer", fontFamily: FONT.sans, fontSize: 12, fontWeight: 600, color: T.ink }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>
        <main style={{ overflowY: "auto", padding: "24px 28px 72px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            {sections.map(section => (
              <section key={section.id} id={section.id} style={{ scrollMarginTop: 24, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, background: T.white, boxShadow: "0 16px 40px rgba(15,15,15,.04)" }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, marginBottom: 10 }}>{section.label.toUpperCase()}</div>
                {section.content}
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function ApiPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/scan",
      status: "live",
      description: "Full trust scan response with score, threats, file count, commit DNA, and insights.",
      params: [["repo", "string", "GitHub owner/repo or full GitHub URL"]],
      example: "curl \"https://eliza-security-agent.vercel.app/api/scan?repo=vercel/next.js\"",
      response: `{
  "fullName": "vercel/next.js",
  "score": { "total": 91, "tier": "VERIFIED" },
  "fileCount": 484,
  "threats": []
}`,
    },
    {
      method: "GET",
      path: "/api/score",
      status: "reference",
      description: "Lightweight score-only contract for badges, embeds, and automation.",
      params: [["repo", "string", "GitHub owner/repo identifier"]],
      example: "curl \"https://eliza-security-agent.vercel.app/api/score?repo=torvalds/linux\"",
      response: `{
  "scanId": "ESA-TOR-9X2Q8",
  "repository": "torvalds/linux",
  "score": 96,
  "tier": "VERIFIED"
}`,
    },
    {
      method: "GET",
      path: "/api/badge/:scanId",
      status: "reference",
      description: "Returns an embeddable SVG badge for a public scan result.",
      params: [["scanId", "path", "Public scan identifier"]],
      example: "curl \"https://eliza-security-agent.vercel.app/api/badge/ESA-TOR-9X2Q8\"",
      response: `<svg width=\"240\" height=\"32\">...</svg>`,
    },
    {
      method: "GET",
      path: "/api/verify/:scanId",
      status: "reference",
      description: "Public verification record for third-party proof-of-scan checks.",
      params: [["scanId", "path", "Public scan identifier"]],
      example: "curl \"https://eliza-security-agent.vercel.app/api/verify/ESA-TOR-9X2Q8\"",
      response: `{
  "valid": true,
  "repository": "torvalds/linux",
  "tier": "VERIFIED",
  "issuedAt": "2026-04-27T10:14:00Z"
}`,
    },
  ];

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "linear-gradient(180deg, #fcfcfc 0%, #ffffff 26%)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 20, marginBottom: 20 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 22, padding: 24, background: T.white }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, marginBottom: 10 }}>REST API</div>
            <h2 style={{ fontFamily: FONT.display, fontWeight: 400, fontSize: 38, lineHeight: 1.05, margin: "0 0 14px" }}>API reference for scans, scores, badges, and public verification.</h2>
            <p style={{ margin: 0, maxWidth: 560, color: T.inkMd, fontSize: 14, lineHeight: 1.8 }}>
              The live app ships a full scan endpoint today and documents the public score, badge, and verify contracts used in the broader Eliza ecosystem.
            </p>
          </div>
          <div style={{ background: "#0b0b0d", color: T.white, borderRadius: 22, padding: 24 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: 1, marginBottom: 12 }}>RATE LIMITS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12, lineHeight: 1.8 }}>
              <div><strong>Free</strong> — 5 scans/hr, no key</div>
              <div><strong>Holder</strong> — unlimited scans, hold at least 10,000 $ELIZAOX</div>
              <div><strong>Developer</strong> — 10,000 scans/month, contact team</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {endpoints.map(endpoint => (
            <section key={endpoint.path} style={{ border: `1px solid ${T.border}`, borderRadius: 22, background: T.white, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 700, border: `1px solid ${T.border}`, borderRadius: 999, padding: "5px 9px" }}>{endpoint.method}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 13 }}>{endpoint.path}</span>
                <span style={{ marginLeft: "auto", fontFamily: FONT.mono, fontSize: 10, color: endpoint.status === "live" ? "#14532d" : T.inkLt }}>{endpoint.status}</span>
              </div>
              <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 18 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{endpoint.description}</div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginTop: 14 }}>
                    {endpoint.params.map(([name, type, desc], index) => (
                      <div key={name} style={{ display: "grid", gridTemplateColumns: "120px 120px 1fr", gap: 10, padding: "12px 14px", borderTop: index === 0 ? "none" : `1px solid ${T.border}`, background: index % 2 ? T.surface : T.white, fontSize: 12 }}>
                        <div style={{ fontFamily: FONT.mono }}>{name}</div>
                        <div style={{ fontFamily: FONT.mono, color: T.inkMd }}>{type}</div>
                        <div style={{ color: T.inkMd }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, background: T.surface, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1 }}>EXAMPLE REQUEST</span>
                      <CopyButton value={endpoint.example} />
                    </div>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: FONT.mono, fontSize: 11, lineHeight: 1.8 }}>{endpoint.example}</pre>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 16, background: "#0b0b0d", padding: 14, color: T.white }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: 1 }}>EXAMPLE RESPONSE</span>
                      <CopyButton value={endpoint.response} />
                    </div>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: FONT.mono, fontSize: 11, lineHeight: 1.8 }}>{endpoint.response}</pre>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const [tab, setTab] = useState("trusted");
  const trustedRows = [
    [1, "torvalds/linux", 96, "VERIFIED", "C", "180k", "—"],
    [2, "nodejs/node", 94, "VERIFIED", "JavaScript", "107k", "—"],
    [3, "vercel/next.js", 91, "VERIFIED", "TypeScript", "128k", "+2"],
    [4, "denoland/deno", 90, "VERIFIED", "Rust", "95k", "—"],
    [5, "rust-lang/rust", 89, "VERIFIED", "Rust", "99k", "-1"],
    [6, "shadcn/ui", 88, "TRUSTED", "TypeScript", "88k", "+3"],
    [7, "vitejs/vite", 87, "TRUSTED", "TypeScript", "69k", "—"],
    [8, "tailwindlabs/tailwindcss", 86, "TRUSTED", "CSS", "84k", "+1"],
    [9, "supabase/supabase", 85, "VERIFIED", "TypeScript", "75k", "+2"],
    [10, "prisma/prisma", 84, "TRUSTED", "TypeScript", "40k", "—"],
  ];
  const riskRows = [
    [1, "rug-xyz/moon100x", 12, "HIGH RISK", "JavaScript", "2", "Fake history"],
    [2, "anon/totallylegit-defi", 18, "HIGH RISK", "Solidity", "5", "4-day-old repo"],
    [3, "pump-dev/clone-uniswap", 21, "HIGH RISK", "Solidity", "1", "Fork + rename"],
    [4, "fastmoney/yield-farm", 24, "HIGH RISK", "TypeScript", "8", "Wildcard deps"],
    [5, "anon2/nft-minter-v2", 28, "SUSPICIOUS", "JavaScript", "3", "Single commit"],
  ];
  const rows = tab === "trusted" ? trustedRows : riskRows;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "linear-gradient(180deg, #f9f9f9 0%, #ffffff 24%)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 18, marginBottom: 18 }}>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 22, padding: 24, background: T.white }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, marginBottom: 10 }}>COMMUNITY LEADERBOARD</div>
            <h2 style={{ fontFamily: FONT.display, fontWeight: 400, fontSize: 38, lineHeight: 1.05, margin: "0 0 12px" }}>Ranked repository signals for teams watching trust and risk in public.</h2>
            <p style={{ margin: 0, color: T.inkMd, fontSize: 14, lineHeight: 1.8 }}>Trusted repos surface consistency and community proof. High-risk repos show the patterns most likely to deserve a second look.</p>
          </div>
          <div style={{ background: "#0b0b0d", color: T.white, borderRadius: 22, padding: 24 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,.55)", letterSpacing: 1, marginBottom: 10 }}>HOLDER CTA</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>Hold at least 10,000 $ELIZAOX to unlock higher scan throughput, API access tiers, and priority review routing.</div>
            <button style={{ background: T.white, color: T.ink, border: "none", borderRadius: 999, padding: "9px 14px", cursor: "pointer", fontFamily: FONT.sans, fontSize: 12, fontWeight: 700 }}>Join holder tier</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            ["trusted", "Top trusted repos"],
            ["risk", "High risk repos"],
          ].map(([key, label]) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{ background: active ? T.black : T.white, color: active ? T.white : T.ink, border: `1px solid ${active ? T.black : T.border}`, borderRadius: 999, padding: "9px 14px", cursor: "pointer", fontFamily: FONT.sans, fontSize: 12, fontWeight: 700 }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 22, overflow: "hidden", background: T.white }}>
          <div style={{ display: "grid", gridTemplateColumns: tab === "trusted" ? "70px 1.8fr 90px 140px 140px 90px 90px" : "70px 1.8fr 90px 140px 140px 80px 1.1fr", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${T.border}`, fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: 1, textTransform: "uppercase" }}>
            <span>Rank</span><span>Repository</span><span>Score</span><span>Tier</span><span>Language</span><span>Stars</span><span>{tab === "trusted" ? "Change" : "Flag"}</span>
          </div>
          {rows.map((row, index) => (
            <div key={row[1]} style={{ display: "grid", gridTemplateColumns: tab === "trusted" ? "70px 1.8fr 90px 140px 140px 90px 90px" : "70px 1.8fr 90px 140px 140px 80px 1.1fr", gap: 12, padding: "14px 18px", borderTop: index === 0 ? "none" : `1px solid ${T.border}`, alignItems: "center", background: index % 2 ? T.surface : T.white }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 12 }}>{row[0]}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{row[1]}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12 }}>{row[2]}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 11 }}>{row[3]}</span>
              <span style={{ color: T.inkMd, fontSize: 12 }}>{row[4]}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 12 }}>{row[5]}</span>
              <span style={{ fontSize: 12, color: T.inkMd }}>{row[6]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SYNTAX HIGHLIGHT ──────────────────────────────────────── */
function highlight(code, lang) {
  if (!code) return "";
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const isJS = ["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(lang);
  const isCSS = ["css", "scss", "sass"].includes(lang);
  const isPY = lang === "py";
  const isJSON = lang === "json";
  const isMD = lang === "md";
  const isYAML = ["yml", "yaml"].includes(lang);
  const isSH = ["sh", "bash"].includes(lang);

  if (isJSON) {
    return esc
      .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span style="color:#0550AE">$1</span>:')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span style="color:#0A3069">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span style="color:#CF222E">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span style="color:#0550AE">$1</span>');
  }
  if (isMD) {
    return esc
      .replace(/^(#{1,3} .+)$/gm, '<span style="color:#0A0A0A;font-weight:600">$1</span>')
      .replace(/`([^`]+)`/g, '<span style="color:#CF222E;background:#FFF5F5;padding:1px 3px;border-radius:2px">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^(- .+)$/gm, '<span style="color:#525252">$1</span>')
      .replace(/^(>.+)$/gm, '<span style="color:#737373;font-style:italic">$1</span>');
  }
  if (isYAML || isSH) {
    return esc
      .replace(/^(#.+)$/gm, '<span style="color:#6A9955">$1</span>')
      .replace(/^(\s*[\w-]+):/gm, '<span style="color:#0550AE">$1</span>:')
      .replace(/\$\{?[\w]+\}?/g, '<span style="color:#CF222E">$&</span>');
  }
  if (isCSS) {
    return esc
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6A9955">$1</span>')
      .replace(/([.#]?[\w-]+)\s*\{/g, '<span style="color:#0550AE">$1</span> {')
      .replace(/([\w-]+)\s*:/g, '<span style="color:#CF222E">$1</span>:')
      .replace(/:\s*([^;{}\n]+)/g, ': <span style="color:#0A3069">$1</span>');
  }
  if (isPY) {
    return esc
      .replace(/(#.+)$/gm, '<span style="color:#6A9955">$1</span>')
      .replace(/\b(def|class|import|from|return|if|elif|else|for|while|in|not|and|or|True|False|None|async|await|with|as|try|except|finally|raise|pass|break|continue)\b/g, '<span style="color:#CF222E">$1</span>')
      .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g, '<span style="color:#0A3069">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#0550AE">$1</span>');
  }
  if (isJS) {
    return esc
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#6A9955">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6A9955">$1</span>')
      .replace(/\b(import|export|from|default|const|let|var|function|return|if|else|for|while|class|extends|new|this|typeof|async|await|try|catch|finally|throw|null|undefined|true|false|void|type|interface|enum|implements)\b/g, '<span style="color:#CF222E">$1</span>')
      .replace(/(`[^`]*`)/g, '<span style="color:#0A3069">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span style="color:#0A3069">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#0550AE">$1</span>')
      .replace(/\b([A-Z][a-zA-Z]*)\b/g, '<span style="color:#6639BA">$1</span>');
  }
  return esc;
}

function fileIcon(name, type) {
  if (type === "dir") return "📁";
  const ext = name.split(".").pop()?.toLowerCase();
  const map = {
    tsx: "⚛", jsx: "⚛", ts: "🔷", js: "🟨", json: "📋", md: "📝",
    css: "🎨", scss: "🎨", html: "🌐", yml: "⚙", yaml: "⚙", sh: "💻",
    py: "🐍", rs: "🦀", go: "🐹", sql: "🗄", env: "🔑", gitignore: "🙈",
    lock: "🔒", png: "🖼", jpg: "🖼", svg: "🎭", ico: "🖼", woff: "🔤",
  };
  return map[ext] || "📄";
}

function langFromExt(name) {
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  const map = { tsx: "tsx", jsx: "jsx", ts: "ts", js: "js", mjs: "js", cjs: "js", json: "json", md: "md", css: "css", scss: "css", html: "html", yml: "yaml", yaml: "yaml", sh: "sh", bash: "sh", py: "py", rs: "rs", go: "go" };
  return map[ext] || "txt";
}

/* ─── CODE EXPLORER ─────────────────────────────────────────── */
function CodeExplorer({ repo }) {
  const [tree, setTree] = useState({}); // path → [{name,type,path,sha}]
  const [expanded, setExpanded] = useState({ "": true });
  const [activeFile, setActiveFile] = useState(null); // {path, name}
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [search, setSearch] = useState("");
  const [searchMatches, setSearchMatches] = useState([]);
  const [curMatch, setCurMatch] = useState(0);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [treeLoading, setTreeLoading] = useState({});
  const codeRef = useRef(null);

  // load root on mount
  useEffect(() => {
    if (!repo?.owner || !repo?.name) return;
    loadDir("");
  }, [repo?.fullName]);

  async function loadDir(path) {
    if (tree[path]) return;
    setTreeLoading(p => ({ ...p, [path]: true }));
    try {
      const data = await fetchRepoTree(repo.fullName, path);
      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => {
          if (a.type === "dir" && b.type !== "dir") return -1;
          if (b.type === "dir" && a.type !== "dir") return 1;
          return a.name.localeCompare(b.name);
        });
        setTree(p => ({ ...p, [path]: sorted }));
      }
    } catch (e) { /* silent */ }
    setTreeLoading(p => ({ ...p, [path]: false }));
  }

  async function openFile(item) {
    setActiveFile(item);
    setFileContent("");
    setFileError("");
    setFileLoading(true);
    setSearch("");
    setSearchMatches([]);
    // build breadcrumb
    const parts = item.path.split("/");
    setBreadcrumb(parts.map((p, i) => ({ name: p, path: parts.slice(0, i + 1).join("/") })));
    try {
      const data = await fetchRepoFile(repo.fullName, item.path);
      setFileContent(data.content || "");
    } catch (e) { setFileError("Network error loading file."); }
    setFileLoading(false);
  }

  async function toggleFolder(item) {
    const path = item.path;
    if (expanded[path]) {
      setExpanded(p => ({ ...p, [path]: false }));
    } else {
      await loadDir(path);
      setExpanded(p => ({ ...p, [path]: true }));
    }
  }

  // search in file
  useEffect(() => {
    if (!search.trim() || !fileContent) { setSearchMatches([]); return; }
    const lines = fileContent.split("\n");
    const matches = [];
    lines.forEach((l, i) => {
      if (l.toLowerCase().includes(search.toLowerCase())) matches.push(i);
    });
    setSearchMatches(matches);
    setCurMatch(0);
  }, [search, fileContent]);

  useEffect(() => {
    if (searchMatches.length && codeRef.current) {
      const el = codeRef.current.querySelector(`[data-line="${searchMatches[curMatch]}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [curMatch, searchMatches]);

  const isFlagged = (name) => {
    if (!repo?.threats) return false;
    return repo.threats.some(t => t.file && name && t.file.toLowerCase().includes(name.toLowerCase()));
  };

  function renderTree(path, depth = 0) {
    const items = tree[path];
    if (!items) return null;
    return items.map(item => {
      const isDir = item.type === "dir";
      const isOpen = expanded[item.path];
      const isActive = activeFile?.path === item.path;
      const flagged = isFlagged(item.name);
      return (
        <div key={item.path}>
          <div
            onClick={() => isDir ? toggleFolder(item) : openFile(item)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: `4px 12px 4px ${14 + depth * 14}px`,
              cursor: "pointer", fontSize: 11, fontFamily: FONT.sans,
              background: isActive ? T.surface : "transparent",
              borderLeft: isActive ? `2px solid ${T.black}` : "2px solid transparent",
              color: flagged ? "#EF4444" : isActive ? T.ink : T.inkMd,
              transition: "background .1s",
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F5F5F5"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            {isDir && (
              <span style={{ fontSize: 8, color: T.inkLt, width: 10, flexShrink: 0 }}>{isOpen ? "▾" : "›"}</span>
            )}
            {!isDir && <span style={{ width: 10, flexShrink: 0 }} />}
            <span style={{ fontSize: 12, flexShrink: 0 }}>{fileIcon(item.name, item.type)}</span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
            {flagged && <span style={{ fontSize: 8, color: "#EF4444", flexShrink: 0 }}>⚠</span>}
            {treeLoading[item.path] && <span style={{ fontSize: 8, color: T.inkLt, flexShrink: 0 }}>…</span>}
          </div>
          {isDir && isOpen && renderTree(item.path, depth + 1)}
        </div>
      );
    });
  }

  const lines = fileContent.split("\n");
  const lang = langFromExt(activeFile?.name);
  const threatLines = new Set();
  if (repo?.threats) {
    repo.threats.forEach(t => {
      if (t.file && activeFile?.name && t.file.includes(activeFile.name) && t.line) {
        threatLines.add(t.line - 1);
      }
    });
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}>
      {/* File tree panel */}
      <div style={{ width: 220, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.surface, flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5 }}>FILES</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkMd }}>{repo.fileCount} total</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
          {treeLoading[""] && !tree[""] && (
            <div style={{ padding: "20px 16px", fontFamily: FONT.mono, fontSize: 10, color: T.inkLt }}>Loading…</div>
          )}
          {renderTree("")}
        </div>
      </div>

      {/* Code viewer */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: T.white }}>
        {!activeFile ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.inkLt }}>
            <span style={{ fontSize: 28, opacity: .4 }}>📄</span>
            <span style={{ fontFamily: FONT.sans, fontSize: 13 }}>Select a file to view its contents</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 10 }}>Click any file in the tree →</span>
          </div>
        ) : (
          <>
            {/* File header */}
            <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
              {/* Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, cursor: "pointer" }}
                  onClick={() => { setActiveFile(null); setFileContent(""); }}>
                  {repo.name}
                </span>
                {breadcrumb.map((b, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: T.border, fontSize: 10 }}>/</span>
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: i === breadcrumb.length - 1 ? T.ink : T.inkMd, fontWeight: i === breadcrumb.length - 1 ? 600 : 400, cursor: i < breadcrumb.length - 1 ? "pointer" : "default" }}>
                      {b.name}
                    </span>
                  </span>
                ))}
              </div>
              {/* Meta row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 600 }}>{fileIcon(activeFile.name, "file")} {activeFile.name}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 9, border: `1px solid ${T.border}`, borderRadius: 3, padding: "1px 6px", color: T.inkMd }}>{lang}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkMd }}>{lines.length} lines</span>
                {isFlagged(activeFile.name) && (
                  <span style={{ fontFamily: FONT.mono, fontSize: 9, background: "#FFF5F5", border: "1px solid #FCA5A5", borderRadius: 3, padding: "1px 6px", color: "#EF4444" }}>⚠ flagged</span>
                )}
                <div style={{ flex: 1 }} />
                {/* Search */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid ${T.border}`, borderRadius: 5, padding: "3px 8px", background: T.white }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = T.black}
                  onBlurCapture={e => e.currentTarget.style.borderColor = T.border}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt }}>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search in file…"
                    style={{ background: "none", border: "none", outline: "none", fontFamily: FONT.mono, fontSize: 10, width: 140, color: T.ink }} />
                  {searchMatches.length > 0 && (
                    <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkMd, whiteSpace: "nowrap" }}>
                      {curMatch + 1}/{searchMatches.length}
                    </span>
                  )}
                </div>
                {searchMatches.length > 0 && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => setCurMatch(p => (p - 1 + searchMatches.length) % searchMatches.length)}
                      style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 3, cursor: "pointer", padding: "2px 6px", fontSize: 10 }}>↑</button>
                    <button onClick={() => setCurMatch(p => (p + 1) % searchMatches.length)}
                      style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 3, cursor: "pointer", padding: "2px 6px", fontSize: 10 }}>↓</button>
                  </div>
                )}
              </div>
            </div>

            {/* Threat annotations */}
            {repo.threats.filter(t => t.file && activeFile.name && t.file.includes(activeFile.name)).length > 0 && (
              <div style={{ padding: "8px 14px", background: "#FFFBEB", borderBottom: `1px solid #FDE68A`, flexShrink: 0 }}>
                {repo.threats.filter(t => t.file && activeFile.name && t.file.includes(activeFile.name)).map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: FONT.sans }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 9, fontWeight: 600, background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 3, padding: "1px 5px", color: "#92400E" }}>{t.sev}</span>
                    <span style={{ color: "#92400E" }}>{t.desc}</span>
                    {t.line && <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "#B45309" }}>line {t.line}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Code body */}
            <div ref={codeRef} style={{ flex: 1, overflowY: "auto", background: T.white }}>
              {fileLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, gap: 10 }}>
                  <div style={{ width: 16, height: 16, border: `2px solid ${T.border}`, borderTop: `2px solid ${T.black}`, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.inkMd }}>Loading file…</span>
                </div>
              )}
              {fileError && !fileLoading && (
                <div style={{ padding: 24, fontFamily: FONT.mono, fontSize: 11, color: "#EF4444" }}>⚠ {fileError}</div>
              )}
              {!fileLoading && !fileError && fileContent && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT.mono, fontSize: 12 }}>
                  <tbody>
                    {lines.map((line, i) => {
                      const isMatch = search && line.toLowerCase().includes(search.toLowerCase());
                      const isCurMatch = isMatch && searchMatches[curMatch] === i;
                      const isThreat = threatLines.has(i);
                      return (
                        <tr key={i} data-line={i} style={{ background: isCurMatch ? "#FFF3CD" : isThreat ? "#FFF5F5" : isMatch ? "#FFFBEB" : "transparent" }}>
                          <td style={{ width: 52, textAlign: "right", paddingRight: 16, paddingLeft: 8, color: isThreat ? "#EF4444" : T.border, userSelect: "none", lineHeight: "1.8", verticalAlign: "top", fontSize: 11 }}>{i + 1}</td>
                          <td style={{ paddingRight: 14, paddingTop: 0, paddingBottom: 0, lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-all", verticalAlign: "top" }}>
                            {isThreat && <span style={{ fontSize: 9, color: "#EF4444", marginRight: 6 }}>⚠</span>}
                            <span dangerouslySetInnerHTML={{ __html: highlight(line, lang) }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function priorityColor(p) {
  return { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#6366F1", INFO: "#A3A3A3" }[p] || "#A3A3A3";
}
function priorityBg(p) {
  return { HIGH: "#FEF2F2", MEDIUM: "#FFFBEB", LOW: "#EEF2FF", INFO: "#F9FAFB" }[p] || "#F9FAFB";
}

function InsightsPanel({ repo }) {
  const [activeSection, setActiveSection] = useState("suggestions"); // suggestions|duplicates
  const [expandedSugg, setExpandedSugg] = useState(null);
  const [activeDup, setActiveDup] = useState(null);    // which duplicate group
  const [activeLoc, setActiveLoc] = useState(0);        // which location in the group
  const [viewingCode, setViewingCode] = useState(false);

  const suggestions = repo?.insights?.suggestions || [];
  const duplicates = repo?.insights?.duplicates || [];

  const selectedDup = duplicates.find(d => d.id === activeDup);
  const selectedLoc = selectedDup?.locations?.[activeLoc];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}>

      {/* ── LEFT: Suggestions + Duplicate list ── */}
      <div style={{ width: 300, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.white, flexShrink: 0, overflow: "hidden" }}>

        {/* Section toggle */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {[{ id: "suggestions", l: "Suggestions" }, { id: "duplicates", l: `Duplicates (${duplicates.length})` }].map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setActiveDup(null); setViewingCode(false); }}
              style={{
                flex: 1, background: "none", border: "none", padding: "10px 8px", cursor: "pointer",
                fontFamily: FONT.sans, fontSize: 11, fontWeight: activeSection === s.id ? 600 : 400,
                color: activeSection === s.id ? T.ink : T.inkLt,
                borderBottom: `2px solid ${activeSection === s.id ? T.black : "transparent"}`, marginBottom: -1
              }}>
              {s.l}
            </button>
          ))}
        </div>

        {/* Actionable Suggestions */}
        {activeSection === "suggestions" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px 6px", fontFamily: FONT.sans, fontSize: 10, color: T.inkLt, letterSpacing: .5, borderBottom: `1px solid ${T.border}` }}>
              PRIORITIZED RECOMMENDATIONS
            </div>
            {suggestions.length === 0 && (
              <div style={{ padding: "24px 14px", color: T.inkLt }}>
                <div style={{ fontFamily: FONT.sans, fontSize: 12, marginBottom: 6 }}>No insights yet.</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 10 }}>Run a scan to generate LLM-backed recommendations.</div>
              </div>
            )}
            {suggestions.map(s => (
              <div key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                {/* Header row */}
                <div onClick={() => setExpandedSugg(expandedSugg === s.id ? null : s.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", cursor: "pointer",
                    background: expandedSugg === s.id ? T.surface : T.white, transition: "background .1s"
                  }}
                  onMouseEnter={e => { if (expandedSugg !== s.id) e.currentTarget.style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { if (expandedSugg !== s.id) e.currentTarget.style.background = T.white; }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 6, background: priorityBg(s.priority),
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 12 }}>{s.title}</span>
                      <span style={{
                        fontFamily: FONT.mono, fontSize: 8, fontWeight: 700,
                        color: priorityColor(s.priority), background: priorityBg(s.priority),
                        border: `1px solid ${priorityColor(s.priority)}33`,
                        borderRadius: 3, padding: "1px 5px", letterSpacing: .5
                      }}>{s.priority}</span>
                    </div>
                    <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                  <span style={{ color: T.inkLt, fontSize: 12, flexShrink: 0 }}>{expandedSugg === s.id ? "−" : "+"}</span>
                </div>
                {/* Expanded detail */}
                {expandedSugg === s.id && (
                  <div style={{ background: T.surface, padding: "10px 14px 14px", borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt, letterSpacing: .5, marginBottom: 6 }}>ACTION</div>
                    <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.ink, marginBottom: 10, lineHeight: 1.6 }}>
                      {s.action}
                    </div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt, letterSpacing: .5, marginBottom: 6 }}>IMPACT</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 9 }}>→</span>
                      <span style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd }}>{s.impact}</span>
                    </div>
                    <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt, letterSpacing: .5, marginBottom: 6 }}>AFFECTED FILES</div>
                    {s.files.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                        <span style={{ fontSize: 10 }}>📄</span>
                        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkMd }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Duplicate Functions list */}
        {activeSection === "duplicates" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px 6px", fontFamily: FONT.sans, fontSize: 10, color: T.inkLt, letterSpacing: .5, borderBottom: `1px solid ${T.border}` }}>
              {duplicates.reduce((a, d) => a + d.count, 0)} DUPLICATE INSTANCES ACROSS {duplicates.length} FUNCTIONS
            </div>
            {duplicates.length === 0 && (
              <div style={{ padding: "24px 14px", color: T.inkLt }}>
                <div style={{ fontFamily: FONT.sans, fontSize: 12, marginBottom: 6 }}>No duplicate groups detected.</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 10 }}>Duplicate analysis appears here after scan data is available.</div>
              </div>
            )}
            {duplicates.map(d => (
              <div key={d.id}
                onClick={() => { setActiveDup(activeDup === d.id ? null : d.id); setActiveLoc(0); setViewingCode(true); }}
                style={{
                  padding: "11px 14px", borderBottom: `1px solid ${T.border}`, cursor: "pointer",
                  background: activeDup === d.id ? T.surface : T.white, transition: "background .1s",
                  borderLeft: `2px solid ${activeDup === d.id ? T.black : "transparent"}`
                }}
                onMouseEnter={e => { if (activeDup !== d.id) { e.currentTarget.style.background = "#F9FAFB"; } }}
                onMouseLeave={e => { if (activeDup !== d.id) { e.currentTarget.style.background = T.white; } }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 600, color: T.ink }}>{d.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontFamily: FONT.mono, fontSize: 9, background: "#FEF2F2", color: "#EF4444",
                    border: "1px solid #FCA5A5", borderRadius: 3, padding: "1px 6px"
                  }}>
                    {d.count} locations
                  </span>
                  <span style={{ fontFamily: FONT.sans, fontSize: 10, color: T.inkLt }}>
                    {d.locations.length} files matched
                  </span>
                </div>
                {/* Location chips */}
                {activeDup === d.id && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                    {d.locations.map((loc, i) => (
                      <button key={i}
                        onClick={e => { e.stopPropagation(); setActiveLoc(i); }}
                        style={{
                          background: activeLoc === i ? T.black : T.white,
                          color: activeLoc === i ? T.white : T.inkMd,
                          border: `1px solid ${activeLoc === i ? T.black : T.border}`,
                          borderRadius: 4, padding: "3px 8px", cursor: "pointer",
                          fontFamily: FONT.mono, fontSize: 9, transition: "all .1s"
                        }}>
                        {loc.file.split("/").pop()}:{loc.line}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Code viewer for selected duplicate ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!viewingCode || !selectedDup ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: T.inkLt, padding: 32 }}>
            <span style={{ fontSize: 32, opacity: .3 }}>⎘</span>
            <div style={{ fontFamily: FONT.sans, fontSize: 13, textAlign: "center" }}>
              {activeSection === "duplicates"
                ? "Click a duplicate function to view and compare its code"
                : "Expand a suggestion to see affected files"}
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt }}>
              {activeSection === "duplicates"
                ? `${duplicates.length} duplicate groups · ${duplicates.reduce((a, d) => a + d.count, 0)} total instances`
                : `${suggestions.length} actionable suggestions`}
            </div>
          </div>
        ) : (
          <>
            {/* Code viewer header */}
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 600 }}>⎘ {selectedDup.name}</span>
                <span style={{
                  fontFamily: FONT.mono, fontSize: 9, background: "#FEF2F2", color: "#EF4444",
                  border: "1px solid #FCA5A5", borderRadius: 3, padding: "1px 6px"
                }}>
                  {selectedDup.count} duplicates
                </span>
              </div>
              {/* Location tabs */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {selectedDup.locations.map((loc, i) => (
                  <button key={i} onClick={() => setActiveLoc(i)}
                    style={{
                      background: activeLoc === i ? T.black : T.white,
                      color: activeLoc === i ? T.white : T.inkMd,
                      border: `1px solid ${activeLoc === i ? T.black : T.border}`,
                      borderRadius: 4, padding: "4px 10px", cursor: "pointer",
                      fontFamily: FONT.mono, fontSize: 9, fontWeight: activeLoc === i ? 600 : 400,
                      transition: "all .12s"
                    }}>
                    {loc.file.split("/").pop()}<span style={{ opacity: .6 }}>:{loc.line}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Two-pane diff: show selected + prev for comparison */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Active location */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${T.border}` }}>
                <div style={{ padding: "6px 14px", background: "#F0FFF4", borderBottom: "1px solid #BBF7D0", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "#166534" }}>{selectedLoc?.file}</span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "#16A34A", marginLeft: "auto" }}>line {selectedLoc?.line}</span>
                </div>
                <div style={{ flex: 1, overflowY: "auto", background: T.white }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT.mono, fontSize: 12 }}>
                    <tbody>
                      {(selectedLoc?.snippet || "").split("\n").map((line, i) => (
                        <tr key={i}>
                          <td style={{ width: 40, textAlign: "right", paddingRight: 14, paddingLeft: 8, color: T.border, userSelect: "none", lineHeight: 1.8, fontSize: 11 }}>{(selectedLoc?.line || 0) + i}</td>
                          <td style={{ paddingRight: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            <span dangerouslySetInnerHTML={{ __html: highlight(line, langFromExt(selectedLoc?.file || "ts")) }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comparison location (next one, or prev) */}
              {selectedDup.locations.length > 1 && (() => {
                const compIdx = activeLoc === selectedDup.locations.length - 1 ? 0 : activeLoc + 1;
                const compLoc = selectedDup.locations[compIdx];
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "6px 14px", background: "#FEF2F2", borderBottom: "1px solid #FCA5A5", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "#991B1B" }}>{compLoc?.file}</span>
                      <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "#DC2626", marginLeft: "auto" }}>line {compLoc?.line}</span>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", background: "#FFFAFA" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT.mono, fontSize: 12 }}>
                        <tbody>
                          {(compLoc?.snippet || "").split("\n").map((line, i) => (
                            <tr key={i}>
                              <td style={{ width: 40, textAlign: "right", paddingRight: 14, paddingLeft: 8, color: T.border, userSelect: "none", lineHeight: 1.8, fontSize: 11 }}>{(compLoc?.line || 0) + i}</td>
                              <td style={{ paddingRight: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                <span dangerouslySetInnerHTML={{ __html: highlight(line, langFromExt(compLoc?.file || "ts")) }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Bottom action bar */}
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, flex: 1 }}>
                Extract to shared utility to eliminate {selectedDup.count - 1} duplicates
              </span>
              <button style={{ background: T.black, color: T.white, border: "none", borderRadius: 5, padding: "5px 14px", cursor: "pointer", fontFamily: FONT.sans, fontSize: 11, fontWeight: 600 }}
                onClick={() => navigator.clipboard?.writeText(`Refactor ${selectedDup.name} into a shared helper and replace ${selectedDup.count - 1} duplicate call sites.`)}>Copy fix suggestion →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN SCAN VIEW ────────────────────────────────────────── */
function ScanView() {
  const [view, setView] = useState("force"); // force|mindmap|codeflow|deps
  const [tab, setTab] = useState("graph");   // graph|threats|history|diff
  const [lOpen, setLOpen] = useState(true);
  const [rOpen, setROpen] = useState(true);
  const [repo, setRepo] = useState(EMPTY_REPO);
  const [rawRepo, setRawRepo] = useState(null);
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [prog, setProg] = useState({ a: 100, b: 100, c: 100, d: 100 });
  const [err, setErr] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [subVis, setSubVis] = useState(false);
  const [osintOpen, setOsintOpen] = useState(false);
  const [projectStartClaim, setProjectStartClaim] = useState("");
  const [socialProofUrl, setSocialProofUrl] = useState("");
  const [evidenceTranscript, setEvidenceTranscript] = useState("");
  const [interrogation, setInterrogation] = useState(null);
  const [interrogationLoad, setInterrogationLoad] = useState(false);
  const [chat, setChat] = useState([{ r: "eliza", t: "Run a scan to start repository analysis." }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoad, setChatLoad] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const chatEnd = useRef(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  async function doScan(u) {
    const target = u || url;
    setScanning(true); setErr(""); setSubVis(false); setLogs([]); setInterrogation(null);
    setProg({ a: 0, b: 0, c: 0, d: 0 });
    let li = 0;
    const logInt = setInterval(() => { if (li < SCAN_LOGS.length) setLogs(p => [...p, SCAN_LOGS[li++]]); else clearInterval(logInt); }, 260);
    [{ k: "a", d: 500 }, { k: "b", d: 1700 }, { k: "c", d: 2800 }, { k: "d", d: 3500 }]
      .forEach(({ k, d }) => setTimeout(() => setProg(p => ({ ...p, [k]: 100 })), d));
    try {
      const result = await fetchGitHubRepo(target);
      setTimeout(() => {
        setRawRepo(result.raw); setRepo(result.ui); setSubVis(true); setScanning(false);
        setRecentScans(prev => [result.ui.fullName, ...prev.filter(item => item !== result.ui.fullName)].slice(0, 3));
        setChat([{ r: "eliza", t: `Scan complete. ${result.ui.fullName} scored ${result.ui.score}/100 — ${result.ui.tier}.` }]);
        clearInterval(logInt);

        const hasSocialEvidence = Boolean(projectStartClaim.trim() || socialProofUrl.trim() || evidenceTranscript.trim());
        if (!hasSocialEvidence) {
          return;
        }

        setInterrogationLoad(true);
        void (async () => {
          try {
            const data = await askEliza(
              "Perform the Social Sentiment Cross-check and return a compact interrogation report.",
              result.raw,
              null,
              {
                analysisType: "social-sentiment-cross-check",
                enrichment: {
                  claims: {
                    projectStartClaim: projectStartClaim.trim(),
                    socialProofUrl: socialProofUrl.trim(),
                    evidenceTranscript: evidenceTranscript.trim(),
                  },
                },
              }
            );
            setInterrogation(data?.crossCheck || null);
          } catch (crossCheckError) {
            setInterrogation({
              status: "INCONCLUSIVE",
              headline: "Cross-check unavailable",
              summary: crossCheckError instanceof Error ? crossCheckError.message : "The interrogation report could not be generated.",
              facts: buildCrossCheckFacts(result.raw),
              claims: {
                projectStartClaim: projectStartClaim.trim(),
                socialProofUrl: socialProofUrl.trim(),
                evidenceTranscript: evidenceTranscript.trim(),
              },
            });
          } finally {
            setInterrogationLoad(false);
          }
        })();
      }, 3800);
    } catch (e) {
      setErr(e.message); setScanning(false);
      setProg({ a: 100, b: 100, c: 100, d: 100 }); clearInterval(logInt);
    }
  }

  async function sendChat(msg) {
    if (!msg.trim()) return;
    if (!rawRepo?.fullName) {
      setChat(p => [...p, { r: "eliza", t: "Scan a repository first so I have live context to analyze." }]);
      return;
    }
    setChat(p => [...p, { r: "user", t: msg }]); setChatInput(""); setChatLoad(true);
    try {
      const data = await askEliza(msg, rawRepo, null);
      setChat(p => [...p, { r: "eliza", t: data.content || "Analysis unavailable." }]);
    } catch { setChat(p => [...p, { r: "eliza", t: "Connection error." }]); }
    setChatLoad(false);
  }

  const isSt = { fontFamily: FONT.mono, fontSize: 11 };
  const panelBtnSt = (active) => ({
    background: "none", border: "none", color: active ? T.ink : T.inkLt,
    borderBottom: `2px solid ${active ? T.black : "transparent"}`,
    padding: "10px 14px", cursor: "pointer", fontSize: 11, fontFamily: FONT.mono,
    fontWeight: active ? 600 : 400, marginBottom: -1, transition: "color .15s",
  });
  const viewBtnSt = (active) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
    cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, color: active ? T.ink : T.inkMd,
    fontWeight: active ? 600 : 400, borderLeft: `2px solid ${active ? T.black : "transparent"}`,
    background: active ? T.surface : "transparent", transition: "all .1s",
  });

  function renderCenterContent() {
    if (tab === "files") return <CodeExplorer repo={repo} />;
    if (tab === "insights") return <InsightsPanel repo={repo} />;
    if (tab === "graph") {
      if (view === "force") return <ForceGraph nodes={repo.graphNodes} links={repo.graphLinks} />;
      if (view === "mindmap") return <MindMap nodes={repo.mindNodes} />;
      if (view === "codeflow") return <CodeFlow flowNodes={repo.flowNodes} flowLinks={repo.flowLinks} />;
      if (view === "deps") return <DepNodes deps={repo.depNodes} />;
    }
    if (tab === "threats") return (
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ fontFamily: FONT.sans, fontSize: 13, color: T.inkMd, marginBottom: 18 }}>
          <strong style={{ color: T.ink }}>{repo.threats.length}</strong> findings · <strong style={{ color: T.ink }}>{repo.threats.filter(t => t.sev !== "INFO").length}</strong> actionable
        </div>
        {repo.threats.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${T.border}`, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: ["CRITICAL", "HIGH"].includes(t.sev) ? T.black : T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 9, fontWeight: 600, color: ["CRITICAL", "HIGH"].includes(t.sev) ? T.white : T.inkMd }}>{t.sev}</span>
            </div>
            <div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.pattern}</div>
              <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.6 }}>{t.desc}</div>
              {t.file && <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, marginTop: 5 }}>{t.file}</div>}
            </div>
          </div>
        ))}
      </div>
    );
    if (tab === "history") return (
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <CommitHeatmap />
        <div style={{ marginTop: 24, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: T.surface, padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5 }}>COMMIT DNA</div>
          {Object.entries(repo.commitDNA).map(([k, v], i, arr) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", fontSize: 12 }}>
              <span style={{ fontFamily: FONT.sans, color: T.inkMd }}>{k}</span>
              <span style={{ fontFamily: FONT.mono, color: T.ink }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
    if (tab === "diff") return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 12 }}>{repo.preview.file || "No preview"}</span>
          <span style={{ fontFamily: FONT.mono, fontSize: 10, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 8px", color: T.inkMd }}>{repo.preview.status}</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {String(repo.preview.content || "No preview available.").split("\n").map((line, i) => {
            const absoluteLine = (repo.preview.startLine || 1) + i;
            const isHighlight = absoluteLine === repo.preview.highlightLine;
            return (
              <div key={i} style={{ display: "flex", background: isHighlight ? "#FFFBEB" : "transparent" }}>
                <span style={{ width: 44, textAlign: "right", paddingRight: 16, fontFamily: FONT.mono, fontSize: 11, color: isHighlight ? "#B45309" : T.border, flexShrink: 0, lineHeight: 1.8 }}>{absoluteLine}</span>
                <pre style={{ margin: 0, fontFamily: FONT.mono, fontSize: 11, color: line.startsWith("//") ? T.inkLt : T.ink, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{line}</pre>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {showShare && <ShareModal repo={repo} onClose={() => setShowShare(false)} />}

      {/* LEFT */}
      {lOpen && (
        <div style={{ width: 210, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5 }}>VIEWS</span>
            <button onClick={() => setLOpen(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.inkLt, borderRadius: 3, cursor: "pointer", padding: "1px 6px", fontSize: 11 }}>‹</button>
          </div>
          {[
            { id: "force", l: "Force Graph", d: "Node network" },
            { id: "mindmap", l: "Mind Map", d: "Radial tree" },
            { id: "codeflow", l: "Code Flow", d: "Data paths" },
            { id: "deps", l: "Dep Nodes", d: "Dependencies" },
          ].map(v => (
            <div key={v.id} onClick={() => { setView(v.id); setTab("graph"); }}
              style={viewBtnSt(view === v.id)}
              onMouseEnter={e => { if (view !== v.id) e.currentTarget.style.background = "#F0F0F0"; }}
              onMouseLeave={e => { if (view !== v.id) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: view === v.id ? T.black : T.inkLt, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11 }}>{v.l}</div>
                <div style={{ fontSize: 9, color: T.inkLt, marginTop: 1 }}>{v.d}</div>
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 14px", marginTop: 8 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5, marginBottom: 8 }}>REPO</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{repo.fullName}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkMd }}>{repo.fileCount} files · {repo.stars}★</div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 14px", marginTop: "auto" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5, marginBottom: 6 }}>RECENT</div>
            {(recentScans.length ? recentScans : ["No recent scans yet"]).map((s, i, arr) => (
              <div key={i} style={{ fontFamily: FONT.sans, fontSize: 10, color: T.inkMd, padding: "4px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>{s}</div>
            ))}
          </div>
        </div>
      )}
      {!lOpen && <button onClick={() => setLOpen(true)} style={{ width: 22, background: T.surface, border: "none", borderRight: `1px solid ${T.border}`, color: T.inkLt, cursor: "pointer", fontSize: 12, flexShrink: 0 }}>›</button>}

      {/* CENTER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: T.white, position: "relative" }}>
        {/* Topbar */}
        <div style={{ borderBottom: `1px solid ${T.border}`, padding: "10px 14px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", flex: 1, maxWidth: 440, border: `1px solid ${T.border}`, borderRadius: 6, padding: "0 10px", gap: 8, background: T.surface, height: 32 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.black} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt }}>◎</span>
              <input value={url} onChange={e => { setUrl(e.target.value); if (e.target.value.trim()) setOsintOpen(true); }} onKeyDown={e => e.key === "Enter" && doScan(url)} placeholder="github.com/owner/repo"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.ink, fontSize: 11, fontFamily: FONT.mono }} />
            </div>
            <button onClick={() => doScan(url)} style={{ background: T.black, color: T.white, border: "none", borderRadius: 5, padding: "6px 16px", cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".8"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>Scan →</button>
            {err && <span style={{ color: "#EF4444", fontSize: 10, fontFamily: FONT.mono }}>⚠ {err}</span>}
            <div style={{ flex: 1 }} />
            {[{ i: "⚠", c: repo.threats.filter(t => t.sev !== "INFO").length }, { i: "★", c: repo.stars ?? 0 }, { i: "⑂", c: repo.forks ?? 0 }].map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, fontFamily: FONT.mono, color: T.inkMd }}>
                <span>{x.i}</span><span style={{ fontWeight: 600, color: T.ink }}>{x.c}</span>
              </div>
            ))}
            <button onClick={() => setShowShare(true)} style={{ background: T.black, color: T.white, border: "none", borderRadius: 4, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: FONT.sans, fontWeight: 600 }}>↑ Share</button>
          </div>
          {url.trim() && (
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setOsintOpen(prev => !prev)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "#0b0b0d",
                  color: "#d1d5db",
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  fontFamily: FONT.mono,
                  fontSize: 11,
                  letterSpacing: .7,
                }}
              >
                <span style={{ color: "#86efac", marginRight: 8 }}>{osintOpen ? "[-]" : "[+]"}</span>
                ENHANCE SCAN: INJECT SOCIAL EVIDENCE (OPTIONAL)
              </button>
              <div style={{ maxHeight: osintOpen ? 260 : 0, opacity: osintOpen ? 1 : 0, transform: osintOpen ? "translateY(0)" : "translateY(-4px)", overflow: "hidden", transition: "all .28s cubic-bezier(.16,1,.3,1)" }}>
                <div style={{ marginTop: 10, border: `1px solid ${T.border}`, borderRadius: 12, background: T.white, padding: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .6 }}>Project Start Claim</span>
                      <input
                        type="date"
                        value={projectStartClaim}
                        onChange={e => setProjectStartClaim(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        style={{ width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: FONT.mono, fontSize: 11, color: T.ink, outline: "none", background: T.surface }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .6 }}>Social Proof URL</span>
                      <input
                        type="url"
                        value={socialProofUrl}
                        onChange={e => setSocialProofUrl(e.target.value)}
                        placeholder="https://x.com/... or discord message link"
                        style={{ width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: FONT.mono, fontSize: 11, color: T.ink, outline: "none", background: T.surface }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .6 }}>Evidence Transcript</span>
                      <textarea
                        value={evidenceTranscript}
                        onChange={e => setEvidenceTranscript(e.target.value)}
                        placeholder='Paste the developer statement here, for example: "We have been building this in stealth for 2 years."'
                        rows={3}
                        style={{ width: "100%", resize: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontFamily: FONT.mono, fontSize: 11, color: T.ink, outline: "none", background: T.surface, lineHeight: 1.5 }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 14px", gap: 0, flexShrink: 0 }}>
          {[
            { id: "graph", l: view === "force" ? "Force Graph" : view === "mindmap" ? "Mind Map" : view === "codeflow" ? "Code Flow" : "Dep Nodes" },
            { id: "files", l: `Files  ${repo.fileCount > 0 ? repo.fileCount : ""}` },
            { id: "insights", l: `Insights  ✦` },
            { id: "diff", l: "Diff Viewer" },
            { id: "threats", l: `Threats ${repo.threats?.filter(t => t.sev !== "INFO").length > 0 ? `(${repo.threats.filter(t => t.sev !== "INFO").length})` : ""}` },
            { id: "history", l: "Commit History" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={panelBtnSt(tab === t.id)}>{t.l}</button>
          ))}
        </div>

        {/* Scan overlay */}
        {scanning && (
          <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(255,255,255,.96)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: FONT.display, fontSize: 24, color: T.ink, marginBottom: 28, letterSpacing: -.5 }}>Scanning…</div>
            {[{ l: "Fetching repository", k: "a" }, { l: "Reading file tree", k: "b" }, { l: "Building graph nodes", k: "c" }, { l: "Finalizing trust profile", k: "d" }].map(row => (
              <div key={row.k} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, width: 380 }}>
                <div style={{ flex: 1, height: 2, background: T.border, borderRadius: 1, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: T.black, borderRadius: 1, width: `${prog[row.k]}%`, transition: "width 1.4s ease" }} />
                </div>
                <span style={{ fontFamily: FONT.sans, fontSize: 11, color: prog[row.k] === 100 ? T.ink : T.inkLt, width: 180 }}>{row.l}</span>
                <span style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkMd, width: 32 }}>{prog[row.k]}%</span>
              </div>
            ))}
            <div style={{ width: 380, height: 100, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "10px 12px", overflow: "hidden", marginTop: 16 }}>
              {logs.slice(-5).map((l, i) => (
                <div key={i} style={{ fontFamily: FONT.mono, fontSize: 10, color: i === Math.min(logs.length - 1, 4) ? T.ink : T.inkLt, marginBottom: 4, lineHeight: 1.6 }}>▶ {l}</div>
              ))}
            </div>
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {renderCenterContent()}
        </div>
      </div>

      {/* RIGHT */}
      {rOpen && (
        <div style={{ width: 300, background: T.white, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13 }}>AI Analysis</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ScoreCircle score={repo.score} size={48} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 600, border: `1px solid ${T.black}`, borderRadius: 2, padding: "2px 7px", letterSpacing: .4, display: "inline-block" }}>{repo.tier}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt, marginTop: 3 }}>{repo.score} / 100</div>
              </div>
              <button onClick={() => setROpen(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.inkLt, borderRadius: 3, cursor: "pointer", padding: "2px 6px", fontSize: 11 }}>›</button>
            </div>
          </div>
          {/* Sub scores */}
          {subVis && (
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5, marginBottom: 10 }}>SUB-SCORES</div>
              {Object.entries(repo.subScores).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: FONT.sans, fontSize: 10, color: T.inkMd, textTransform: "capitalize" }}>{k}</span>
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 600, color: T.ink }}>{v}</span>
                  </div>
                  <div style={{ height: 2, background: T.border, borderRadius: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 1, background: v >= 70 ? T.black : v >= 50 ? "#525252" : "#A3A3A3", width: `${v}%`, transition: "width 1.3s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: "6px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt }}>SOURCE</span>
              <div style={{ width: 13, height: 11, background: T.black, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT.mono, fontSize: 7, fontWeight: 600, color: T.white }}>EZ</span>
              </div>
              <span style={{ fontFamily: FONT.sans, fontSize: 10, color: T.inkMd }}>Eliza Security</span>
            </div>
            <span style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt }}>1 token</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 12px" }}>
            <Sec title="Overview">
              <p style={{ margin: 0, fontFamily: FONT.sans, fontSize: 11, lineHeight: 1.7, color: T.inkMd }}>
                <strong style={{ color: T.ink }}>{repo.name}</strong> — {repo.overview}
              </p>
            </Sec>
            <Sec title="Risk Signals">
              {repo.threats.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: sevColor(t.sev), flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: 600, color: T.ink, marginBottom: 1 }}>{t.pattern}</div>
                    <div style={{ fontFamily: FONT.sans, fontSize: 10, color: T.inkMd, lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </Sec>
            <Sec title="Commit DNA" open={false}>
              {Object.entries(repo.commitDNA).map(([k, v], i, arr) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <span style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd }}>{k}</span>
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, color: T.ink }}>{v}</span>
                </div>
              ))}
            </Sec>
            <Sec title="Author Intel" open={false}>
              <div style={{ fontFamily: FONT.sans, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>@{repo.author.username}</div>
              {[["Age", repo.author.accountAge], ["Style", repo.author.consistency], ["Score", `${repo.author.avgScore}/100`]].map(([k, v], i) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 2 ? `1px solid ${T.border}` : "none", fontSize: 11 }}>
                  <span style={{ color: T.inkMd }}>{k}</span>
                  <span style={{ fontFamily: FONT.mono, color: T.ink }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                {repo.author.languages?.map(l => (
                  <span key={l} style={{ fontFamily: FONT.mono, fontSize: 9, border: `1px solid ${T.border}`, borderRadius: 3, padding: "1px 6px", color: T.inkMd }}>{l}</span>
                ))}
              </div>
            </Sec>
            <Sec title="Interrogation Report" open={Boolean(interrogation || interrogationLoad)}>
              {!projectStartClaim && !socialProofUrl && !evidenceTranscript.trim() && !interrogation && !interrogationLoad ? (
                <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.7 }}>
                  This module is optional. Open the terminal toggle above and add social evidence before the next scan.
                </div>
              ) : interrogationLoad ? (
                <div style={{ fontFamily: FONT.mono, fontSize: 11, color: T.inkMd }}>Running the cross-check against GitHub facts...</div>
              ) : interrogation ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <CrossCheckBadge status={interrogation.status} />
                    <div style={{ fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, textTransform: "uppercase", letterSpacing: .8 }}>Timeline Interrogation</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 4 }}>{interrogation.headline || "Cross-check complete"}</div>
                    <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.7 }}>{interrogation.summary || "No summary returned."}</div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ background: T.surface, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5 }}>GITHUB FACTS</div>
                    <div style={{ padding: "8px 12px", display: "grid", gap: 6, fontSize: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: T.inkMd }}>Repo created</span><span style={{ fontFamily: FONT.mono, color: T.ink }}>{interrogation.facts?.repoCreatedAt || "Unknown"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: T.inkMd }}>First commit</span><span style={{ fontFamily: FONT.mono, color: T.ink }}>{interrogation.facts?.firstCommitAt || "Unknown"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: T.inkMd }}>Contributors</span><span style={{ fontFamily: FONT.mono, color: T.ink }}>{interrogation.facts?.contributorCount ?? 0}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: T.inkMd }}>Commit cadence</span><span style={{ fontFamily: FONT.mono, color: T.ink, textAlign: "right" }}>{interrogation.facts?.commitFrequency || "Unknown"}</span></div>
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ background: T.surface, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontFamily: FONT.mono, fontSize: 10, color: T.inkLt, letterSpacing: .5 }}>MANUAL CLAIM</div>
                    <div style={{ padding: "8px 12px", fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.7 }}>
                      {interrogation.claims?.projectStartClaim || projectStartClaim || "No claimed project start date supplied."}
                      {interrogation.claims?.socialProofUrl || socialProofUrl ? <div style={{ marginTop: 6, fontFamily: FONT.mono, fontSize: 10, wordBreak: "break-all" }}>{interrogation.claims?.socialProofUrl || socialProofUrl}</div> : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.7 }}>
                  No cross-check report was generated. Add social evidence and rerun the scan to populate this section.
                </div>
              )}
            </Sec>
            {/* Chat */}
            <div style={{ marginTop: 6, paddingTop: 12 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, color: T.inkLt, letterSpacing: .8, marginBottom: 10 }}>ASK ELIZA</div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: 10, marginBottom: 8, maxHeight: 160, overflowY: "auto" }}>
                {chat.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: FONT.mono, fontSize: 9, fontWeight: 600, color: T.inkMd, marginBottom: 2, letterSpacing: .5 }}>{msg.r === "eliza" ? "ELIZA" : "YOU"}</div>
                    <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkMd, lineHeight: 1.65 }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p style={{ margin: "0 0 8px 0" }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ margin: "0 0 8px 16px", paddingLeft: 14 }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ margin: "0 0 8px 16px", paddingLeft: 14 }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                          table: ({ children }) => (
                            <div style={{ overflowX: "auto", margin: "6px 0 8px" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th style={{ border: `1px solid ${T.border}`, padding: "4px 6px", textAlign: "left", background: T.white, color: T.ink }}>
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td style={{ border: `1px solid ${T.border}`, padding: "4px 6px", verticalAlign: "top" }}>
                              {children}
                            </td>
                          ),
                          code: ({ children }) => (
                            <code style={{ fontFamily: FONT.mono, fontSize: 10, background: T.white, border: `1px solid ${T.border}`, borderRadius: 3, padding: "0 4px" }}>
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre style={{ margin: "6px 0 8px", padding: 8, overflowX: "auto", background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: FONT.mono, fontSize: 10, lineHeight: 1.5 }}>
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {msg.t}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {chatLoad && <div style={{ fontFamily: FONT.sans, fontSize: 11, color: T.inkLt }}>Analyzing…</div>}
                <div ref={chatEnd} />
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {["Why this score?", "Top 3 risks?", "CT caption"].map(s => (
                  <button key={s} onClick={() => sendChat(s)} style={{ background: T.white, border: `1px solid ${T.border}`, color: T.inkMd, borderRadius: 3, padding: "3px 8px", cursor: "pointer", fontSize: 9, fontFamily: FONT.sans }}
                    onMouseEnter={e => { e.target.style.borderColor = T.black; e.target.style.color = T.ink; }}
                    onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.inkMd; }}>{s}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 10px" }}
                onFocusCapture={e => e.currentTarget.style.borderColor = T.black}
                onBlurCapture={e => e.currentTarget.style.borderColor = T.border}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat(chatInput)}
                  placeholder="Ask Eliza anything…"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: FONT.sans, fontSize: 11, color: T.ink }} />
                <button onClick={() => sendChat(chatInput)} style={{ background: T.black, color: T.white, border: "none", borderRadius: 4, padding: "3px 10px", cursor: "pointer", fontSize: 10 }}>→</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!rOpen && <button onClick={() => setROpen(true)} style={{ width: 22, background: T.white, border: "none", borderLeft: `1px solid ${T.border}`, color: T.inkLt, cursor: "pointer", fontSize: 12, flexShrink: 0 }}>‹</button>}
    </div>
  );
}

const EMPTY_REPO = {
  owner: "",
  name: "",
  fullName: "No repository scanned",
  description: "Run a scan to populate live repository intelligence.",
  fileCount: 0,
  stars: 0,
  forks: 0,
  score: 0,
  tier: "UNSCANNED",
  subScores: { origin: 0, build: 0, security: 0, author: 0, activity: 0, community: 0 },
  overview: "Live overview appears after the first successful scan.",
  origins: "Origin analysis appears after the first successful scan.",
  threats: [],
  commitDNA: { pattern: "Unknown", anomalyScore: 0, authorEntropy: "Unknown", lastActivity: "Unknown", commitTimes: "N/A" },
  author: { username: "unknown", accountAge: "Unknown", consistency: "Unknown", avgScore: 0, languages: [] },
  graphNodes: [{ id: "root", label: "repository", type: "root", r: 18 }],
  graphLinks: [],
  mindNodes: [{ id: 0, label: "repository", depth: 0, parent: null }],
  flowNodes: [
    { id: "user", label: "User Input", x: .1, y: .5, type: "io" },
    { id: "api", label: "API Route", x: .32, y: .28, type: "proc" },
    { id: "score", label: "Trust Score", x: .76, y: .5, type: "io" },
  ],
  flowLinks: [{ s: "user", t: "api" }, { s: "api", t: "score" }],
  depNodes: [],
  insights: { suggestions: [], duplicates: [] },
  preview: { file: "No preview", fullPath: "", status: "scan required", content: "Run a scan to load a live preview.", highlightLine: 0, startLine: 1 },
};

/* ─── ROOT ──────────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState(() => viewFromPathname(window.location.pathname));
  const endpoint = useMemo(() => clusterApiUrl(WalletAdapterNetwork.Devnet), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const handleWalletError = useCallback((error) => {
    console.error("Wallet connection error:", error);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setView(viewFromPathname(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigateTo(nextView) {
    const nextPath = pathFromView(nextView);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setView(nextView);
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={handleWalletError}>
        <AppShell view={view} navigateTo={navigateTo} />
      </WalletProvider>
    </ConnectionProvider>
  );
}

function AppShell({ view, navigateTo }) {
  const { connected, connecting } = useWallet();
  const appLocked = view === "app" && !connected;

  useEffect(() => {
    if (view === "app" && !connected && !connecting) {
      navigateTo("landing");
    }
  }, [view, connected, connecting, navigateTo]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: T.white, color: T.ink, fontFamily: FONT.sans, overflow: "hidden", fontSize: 14 }}>
      {appLocked ? <Landing onEnter={() => navigateTo("app")} onNavigate={navigateTo} /> : view === "landing" ? <Landing onEnter={() => navigateTo("app")} onNavigate={navigateTo} /> : (
        <>
          <AppTopbar view={view} onNavigate={navigateTo} />
          {view === "app" && <ScanView />}
          {view === "docs" && <DocsPage />}
          {view === "api" && <ApiPage />}
          {view === "leaderboard" && <LeaderboardPage />}
        </>
      )}
    </div>
  );
}
