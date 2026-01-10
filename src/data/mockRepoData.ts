export interface Author {
    name: string;
    email: string;
    avatar?: string;
    joinedDate: string;
    totalRepos: number;
    avgScore: number;
    consistency: 'high' | 'medium' | 'low';
    socials?: {
        github?: string;
        twitter?: string;
        linkedin?: string;
    };
}

export interface Threat {
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    file: string;
    line: number | null;
    pattern: string;
    description: string;
    fix?: string;
}

export interface Commit {
    hash: string;
    message: string;
    author: string;
    date: string;
    additions?: number;
    deletions?: number;
}

export interface Dependency {
    name: string;
    version: string;
    type: 'prod' | 'dev';
    health: 'trusted' | 'neutral' | 'suspicious';
}

export interface FileNode {
    name: string;
    type: 'file' | 'folder';
    path: string;
    similarity: number;
    authorship: 'HUMAN' | 'AI-GEN' | 'COPIED' | 'MIXED';
    confidence?: number;
    children?: FileNode[];
    content?: string;
    language?: string;
}

export type FileTreeItemData = FileNode;

export interface ScoreBreakdown {
    total: number;
    origin: number;
    build: number;
    security: number;
    author: number;
    activity: number;
    community: number;
    tier: 'VERIFIED' | 'TRUSTED' | 'CAUTION' | 'SUSPICIOUS' | 'HIGH_RISK';
}

export interface CommitDNA {
    pattern: string;
    anomalyScore: number;
    authorEntropy: string;
    lastActivity: string;
    commitTimes?: string;
}

export interface Repository {
    id: string;
    owner: string;
    name: string;
    fullName: string;
    description: string;
    language: string;
    topics: string[];
    stars: number;
    forks: number;
    watchers: number;
    issues: number;
    license: string;
    createdAt: string;
    lastCommit: string;
    fileCount: number;
    overallSimilarity: number;
    score: ScoreBreakdown;
    files: FileNode[];
    commits: Commit[];
    dependencies: Dependency[];
    threats: Threat[];
    authors: Author[];
    readme?: string;
    overview?: string;
    origins?: string;
    commitDNA?: CommitDNA;
}

export interface RecentScan {
    id: string;
    fullName: string;
    score: number;
    tier: string;
    timestamp: string;
    trending?: 'up' | 'down' | 'stable';
}
