import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

loadEnvFiles([
    path.join(workspaceRoot, '.env'),
    path.join(workspaceRoot, '.env.local'),
]);

const PORT = Number(process.env.API_PORT || 8787);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const APP_NAME = process.env.APP_NAME || 'Eliza Security Agent';
const MEGALLM_BASE_URL = process.env.MEGALLM_BASE_URL || 'https://ai.megallm.io/v1';
const MEGALLM_CHAT_COMPLETIONS_URL = `${MEGALLM_BASE_URL.replace(/\/+$/, '')}/chat/completions`;
const MEGALLM_PRIMARY_MODEL = process.env.MEGALLM_MODEL || 'openai-gpt-oss-120b';
const MAX_TREE_FILES = 400;
const MAX_ANALYSIS_FILES = 18;
const MAX_FILE_BYTES = 180_000;

export function createElizaApiMiddleware() {
    return (request, response, next) => {
        const pathname = getRequestPathname(request);
        if (!pathname || !matchesElizaApiRoute(pathname)) {
            next();
            return;
        }

        void routeElizaApiRequest(request, response);
    };
}

export async function routeElizaApiRequest(request, response) {
    return handleElizaApiRequest(request, response);
}

export function createElizaApiPlugin() {
    return {
        name: 'eliza-api-routes',
        configureServer(server) {
            server.middlewares.use(createElizaApiMiddleware());
        },
        configurePreviewServer(server) {
            server.middlewares.use(createElizaApiMiddleware());
        },
    };
}

async function handleElizaApiRequest(request, response) {
    const origin = request.headers.origin || '*';
    addCorsHeaders(response, origin);

    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    const url = new URL(request.url || '/', `http://${request.headers.host || `localhost:${PORT}`}`);

    try {
        if (request.method === 'GET' && url.pathname === '/health') {
            sendJson(response, 200, {
                status: 'ok',
                megallmConfigured: Boolean(process.env.MEGALLM_API_KEY),
                githubTokenConfigured: Boolean(process.env.GITHUB_TOKEN),
            });
            return;
        }

        if (request.method === 'GET' && url.pathname === '/api/scan') {
            const repoInput = url.searchParams.get('repo');
            if (!repoInput) {
                throw createHttpError(400, 'Missing repo query parameter.');
            }

            const repository = await analyzeRepository(repoInput);
            sendJson(response, 200, repository);
            return;
        }

        if (request.method === 'GET' && url.pathname === '/api/tree') {
            const repoInput = url.searchParams.get('repo');
            const treePath = url.searchParams.get('path') || '';

            if (!repoInput) {
                throw createHttpError(400, 'Missing repo query parameter.');
            }

            const { owner, repo } = parseRepoInput(repoInput);
            const items = await fetchRepositoryTree(owner, repo, treePath);
            sendJson(response, 200, items);
            return;
        }

        if (request.method === 'GET' && url.pathname === '/api/file') {
            const repoInput = url.searchParams.get('repo');
            const filePath = url.searchParams.get('path');

            if (!repoInput || !filePath) {
                throw createHttpError(400, 'Missing repo or path query parameter.');
            }

            const { owner, repo } = parseRepoInput(repoInput);
            if (!isTextLikePath(filePath)) {
                throw createHttpError(415, 'This file type is not supported in the inline viewer.');
            }

            const content = await fetchRepositoryFile(owner, repo, filePath);
            sendJson(response, 200, {
                path: filePath,
                language: getLanguageFromPath(filePath),
                content,
                truncated: false,
            });
            return;
        }

        if (request.method === 'POST' && url.pathname === '/api/chat') {
            const body = await readJsonBody(request);
            const answer = await askMegaLlm(body, request);
            sendJson(response, 200, answer);
            return;
        }

        sendJson(response, 404, { message: 'Not found.' });
    } catch (error) {
        const status = Number(error?.status || 500);
        sendJson(response, status, {
            message: error?.message || 'Unexpected server error.',
            details: error?.details,
        });
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    createServer((request, response) => {
        void handleElizaApiRequest(request, response);
    }).listen(PORT, () => {
        console.log(`Eliza API server listening on http://localhost:${PORT}`);
    });
}

function getRequestPathname(request) {
    try {
        return new URL(request.url || '/', `http://${request.headers.host || `localhost:${PORT}`}`).pathname;
    } catch {
        return null;
    }
}

function matchesElizaApiRoute(pathname) {
    return pathname === '/health'
        || pathname === '/api/scan'
        || pathname === '/api/tree'
        || pathname === '/api/file'
        || pathname === '/api/chat';
}

function loadEnvFiles(filePaths) {
    for (const filePath of filePaths) {
        if (!existsSync(filePath)) {
            continue;
        }

        const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex === -1) {
                continue;
            }

            const key = trimmed.slice(0, separatorIndex).trim();
            let value = trimmed.slice(separatorIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    }
}

function addCorsHeaders(response, origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
}

function sendJson(response, status, payload) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
    const chunks = [];
    for await (const chunk of request) {
        chunks.push(chunk);
    }

    if (chunks.length === 0) {
        return {};
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        throw createHttpError(400, 'Invalid JSON body.');
    }
}

function createHttpError(status, message, details) {
    const error = new Error(message);
    error.status = status;
    if (details) {
        error.details = details;
    }
    return error;
}

function parseRepoInput(input) {
    const clean = String(input || '')
        .trim()
        .replace(/^https?:\/\/github\.com\//i, '')
        .replace(/^github\.com\//i, '')
        .replace(/\/+$|\.git$/g, '');

    const [owner, repo] = clean.split('/');
    if (!owner || !repo) {
        throw createHttpError(400, 'Invalid format. Use github.com/owner/repo');
    }

    return { owner, repo };
}

async function analyzeRepository(input) {
    const { owner, repo } = parseRepoInput(input);
    const meta = await githubJson(`/repos/${owner}/${repo}`);

    const [branch, commits, languages, contributors, readme] = await Promise.all([
        githubJson(`/repos/${owner}/${repo}/branches/${encodeURIComponent(meta.default_branch)}`),
        githubJson(`/repos/${owner}/${repo}/commits?per_page=30`),
        githubJson(`/repos/${owner}/${repo}/languages`),
        optionalGitHubJson(`/repos/${owner}/${repo}/contributors?per_page=10`),
        optionalGitHubText(`/repos/${owner}/${repo}/readme`, 'application/vnd.github.raw+json'),
    ]);

    const treeSha = branch?.commit?.commit?.tree?.sha;
    const treeResponse = treeSha
        ? await githubJson(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`)
        : { tree: [], truncated: false };

    const treeEntries = Array.isArray(treeResponse.tree) ? treeResponse.tree : [];
    const blobEntries = treeEntries.filter((entry) => entry.type === 'blob');
    const viewableEntries = buildTreeEntries(blobEntries);
    const filePathsToInspect = pickFilesForAnalysis(blobEntries);
    const sampledFiles = await fetchSampleFiles(owner, repo, filePathsToInspect);
    const dependencyList = extractDependencies(sampledFiles);
    const threatList = analyzeThreats({ meta, commits, contributors, treeEntries: blobEntries, sampledFiles, dependencyList });
    const similarityMap = buildSimilarityMap(viewableEntries, sampledFiles);
    const authors = await buildAuthors(contributors, commits, meta.created_at, owner);
    const score = buildScore({ meta, commits, languages, contributors, threats: threatList, dependencyList, similarityMap, sampledFiles, treeEntries: blobEntries });
    const insights = await buildInsights({ meta, threats: threatList, dependencies: dependencyList, sampledFiles, treeEntries: blobEntries, commits, contributors, languages, owner, repo });
    const preview = buildPreviewSample(sampledFiles, threatList);

    return {
        id: `${owner}-${repo}`,
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        description: meta.description || 'No description provided.',
        language: primaryLanguage(languages),
        topics: Array.isArray(meta.topics) ? meta.topics : [],
        stars: meta.stargazers_count || 0,
        forks: meta.forks_count || 0,
        watchers: meta.subscribers_count || meta.watchers_count || 0,
        issues: meta.open_issues_count || 0,
        license: meta.license?.spdx_id || 'None',
        createdAt: meta.created_at,
        lastCommit: commits?.[0]?.commit?.author?.date || null,
        fileCount: blobEntries.length,
        overallSimilarity: overallSimilarity(similarityMap),
        score,
        files: nestFileTree(viewableEntries, similarityMap),
        commits: buildCommitList(commits),
        dependencies: dependencyList,
        threats: threatList,
        authors,
        readme: truncateText(readme || '', 8000),
        overview: buildOverview(meta, commits, contributors, languages),
        origins: buildOrigins(meta, sampledFiles, similarityMap),
        commitDNA: buildCommitDNA(commits, contributors),
        insights,
        preview,
    };
}

async function askMegaLlm(body, request) {
    if (!process.env.MEGALLM_API_KEY) {
        throw createHttpError(500, 'MEGALLM_API_KEY is not configured.');
    }

    const analysisType = String(body?.analysisType || '').trim().toLowerCase();
    if (analysisType === 'social-sentiment-cross-check') {
        return askSocialSentimentCrossCheck(body);
    }

    const question = String(body?.question || '').trim();
    if (!question) {
        throw createHttpError(400, 'Question is required.');
    }

    const repository = body?.repository;
    if (!repository?.fullName) {
        throw createHttpError(400, 'Repository context is required.');
    }

    const activeFile = body?.activeFile && body.activeFile.path
        ? {
            path: String(body.activeFile.path),
            content: truncateText(String(body.activeFile.content || ''), 6000),
        }
        : null;

    const context = [
        `Repository: ${repository.fullName}`,
        `Description: ${repository.description || 'No description provided.'}`,
        `Language: ${repository.language || 'Unknown'}`,
        `Topics: ${(repository.topics || []).join(', ') || 'None'}`,
        `Trust score: ${repository.score?.total ?? 0}/100 (${repository.score?.tier || 'UNKNOWN'})`,
        `Subscores: origin ${repository.score?.origin ?? 0}, build ${repository.score?.build ?? 0}, security ${repository.score?.security ?? 0}, author ${repository.score?.author ?? 0}, activity ${repository.score?.activity ?? 0}, community ${repository.score?.community ?? 0}`,
        `Overview: ${repository.overview || ''}`,
        `Origins: ${repository.origins || ''}`,
        `Commit DNA: ${repository.commitDNA ? JSON.stringify(repository.commitDNA) : 'Unavailable'}`,
        `Top threats: ${formatThreats(repository.threats || [])}`,
        `Dependencies: ${formatDependencies(repository.dependencies || [])}`,
        repository.readme ? `README excerpt:\n${truncateText(repository.readme, 2500)}` : 'README excerpt: not available',
    ];

    if (activeFile) {
        context.push(`Active file: ${activeFile.path}\n${activeFile.content || 'No file content loaded.'}`);
    }

    const data = await callMegaLlmChatCompletions({
        temperature: 0.25,
        maxTokens: 1600,
        messages: [
            {
                role: 'system',
                content: [
                    'You are Eliza, the repository analyst inside Eliza Security Agent.',
                    'Answer using only the provided repository context.',
                    'If the data is insufficient, say exactly what is missing.',
                    'Prefer the same language the user used.',
                    'Be direct, concrete, and cite file paths or findings when possible.',
                    'When asked for CT caption or thread, return concise social-ready copy.',
                    'Write in clean markdown with short sections and blank lines between them.',
                    'Start each section on its own line with a bold heading, then use bullets underneath.',
                    'Do not place headings, bullets, or tables on the same line as prose.',
                    'Do not use markdown tables unless the user explicitly asks for one.',
                    'Prefer 3 to 5 bullets over long paragraphs.',
                    'Never stack multiple markdown constructs in one sentence.',
                    '',
                    'FORMAT YOUR RESPONSES WITH CLARITY:',
                    '- Use clear section headers with bold markdown (**Header**).',
                    '- Keep each bullet short and focused on one idea.',
                    '- Use bold (**text**) only for labels or key findings.',
                    '- Add a blank line between sections.',
                    '- End with a brief bottom-line summary.',
                ].join('\n'),
            },
            {
                role: 'user',
                content: `Repository context:\n${context.join('\n\n')}\n\nUser question: ${question}`,
            },
        ],
    });

    console.log('MegaLLM Response Data:', JSON.stringify(data, null, 2));

    return {
        content: normalizeChatCompletionContent(data?.choices?.[0]?.message?.content),
        model: data?.model || MEGALLM_PRIMARY_MODEL,
    };
}

async function askSocialSentimentCrossCheck(body) {
    const repository = body?.repository;
    if (!repository?.fullName) {
        throw createHttpError(400, 'Repository context is required.');
    }

    const claims = body?.enrichment?.claims || {};
    const facts = buildSocialSentimentFacts(repository);
    const data = await callMegaLlmChatCompletions({
        temperature: 0.15,
        maxTokens: 1000,
        responseFormat: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: [
                    'You are Eliza, an intelligence-grade code security agent.',
                    'Compare GitHub facts against user-supplied social claims.',
                    'Return valid JSON only with the shape {"status":"VERIFIED|LIE DETECTED|INCONCLUSIVE","headline":string,"summary":string,"facts":object,"claims":object,"anomalies":array}.',
                    'Use a cold, precise, authoritative tone.',
                    'If the claim says the project has been in development for months but the repository is only days old and shows a single burst of activity, mark status as LIE DETECTED.',
                    'If the claims are consistent with the GitHub timeline, mark status as VERIFIED.',
                    'If the evidence is incomplete or ambiguous, mark status as INCONCLUSIVE.',
                ].join(' '),
            },
            {
                role: 'user',
                content: `GitHub facts:\n${JSON.stringify(facts, null, 2)}\n\nSocial claims:\n${JSON.stringify(claims, null, 2)}`,
            },
        ],
    });

    const content = normalizeChatCompletionContent(data?.choices?.[0]?.message?.content);
    const parsed = safeParseJson(content) || {};
    const status = normalizeCrossCheckStatus(parsed.status);

    return {
        content: parsed.summary || content,
        model: data?.model || MEGALLM_PRIMARY_MODEL,
        crossCheck: {
            status,
            headline: String(parsed.headline || defaultCrossCheckHeadline(status)).trim(),
            summary: String(parsed.summary || content).trim(),
            facts: parsed.facts && typeof parsed.facts === 'object' ? parsed.facts : facts,
            claims: parsed.claims && typeof parsed.claims === 'object' ? parsed.claims : claims,
            anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
        },
    };
}

async function callMegaLlmChatCompletions({ messages, temperature, maxTokens, responseFormat, model = MEGALLM_PRIMARY_MODEL }) {
    if (!process.env.MEGALLM_API_KEY) {
        throw createHttpError(500, 'MEGALLM_API_KEY is not configured.');
    }

    const payload = {
        model,
        messages,
    };

    if (typeof temperature === 'number') {
        payload.temperature = temperature;
    }

    if (typeof maxTokens === 'number') {
        payload.max_tokens = maxTokens;
    }

    if (responseFormat) {
        payload.response_format = responseFormat;
    }

    const response = await fetch(MEGALLM_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.MEGALLM_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await safeJson(response);
    if (!response.ok) {
        throw createHttpError(response.status, data?.error?.message || data?.message || 'MegaLLM request failed.');
    }

    return data;
}

function resolveAppUrl(request) {
    const forwardedProto = request?.headers?.['x-forwarded-proto'];
    const host = request?.headers?.['x-forwarded-host'] || request?.headers?.host;
    const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;

    if (host) {
        return `${protocol || 'https'}://${host}`;
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return APP_URL;
}

async function fetchRepositoryFile(owner, repo, filePath) {
    const encodedPath = encodeGitHubPath(filePath);
    const content = await githubText(`/repos/${owner}/${repo}/contents/${encodedPath}`, 'application/vnd.github.raw+json');
    if (!looksLikeText(content)) {
        throw createHttpError(415, 'GitHub returned a binary file that cannot be shown inline.');
    }
    return truncateText(content, 120_000);
}

async function fetchRepositoryTree(owner, repo, filePath = '') {
    const encodedPath = filePath ? `/${encodeGitHubPath(filePath)}` : '';
    const data = await githubJson(`/repos/${owner}/${repo}/contents${encodedPath}`);

    if (!Array.isArray(data)) {
        throw createHttpError(404, 'The requested tree path is not a directory.');
    }

    return data
        .map((item) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size || 0,
            sha: item.sha || '',
        }))
        .sort((left, right) => {
            if (left.type === 'dir' && right.type !== 'dir') return -1;
            if (right.type === 'dir' && left.type !== 'dir') return 1;
            return left.name.localeCompare(right.name);
        });
}

async function fetchSampleFiles(owner, repo, filePaths) {
    const results = await Promise.allSettled(
        filePaths.map(async (filePath) => ({
            path: filePath,
            content: truncateText(await fetchRepositoryFile(owner, repo, filePath), 24_000),
        }))
    );

    return results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
}

async function buildAuthors(contributors, commits, fallbackDate, owner) {
    const contributorList = Array.isArray(contributors) ? contributors.slice(0, 4) : [];
    const commitCounts = new Map();
    for (const commit of Array.isArray(commits) ? commits : []) {
        const authorName = commit?.commit?.author?.name;
        if (!authorName) {
            continue;
        }
        commitCounts.set(authorName, (commitCounts.get(authorName) || 0) + 1);
    }

    if (contributorList.length === 0 && owner) {
        return [
            {
                name: owner,
                email: 'GitHub profile',
                joinedDate: fallbackDate,
                totalRepos: 0,
                avgScore: 0,
                consistency: 'medium',
            },
        ];
    }

    const results = await Promise.allSettled(
        contributorList.map(async (contributor) => {
            const details = contributor?.login ? await optionalGitHubJson(`/users/${contributor.login}`) : null;
            const commitCount = commitCounts.get(contributor?.login) || commitCounts.get(details?.name) || contributor?.contributions || 0;
            const accountAgeYears = details?.created_at ? yearsSince(details.created_at) : 0;

            return {
                name: details?.name || contributor?.login || 'Unknown contributor',
                email: details?.email || (contributor?.login ? `https://github.com/${contributor.login}` : 'GitHub user'),
                avatar: contributor?.avatar_url,
                joinedDate: details?.created_at || fallbackDate,
                totalRepos: details?.public_repos || 0,
                avgScore: Math.max(40, Math.min(95, 45 + commitCount * 4 + accountAgeYears * 6)),
                consistency: commitCount >= 8 ? 'high' : commitCount >= 3 ? 'medium' : 'low',
                socials: contributor?.html_url ? { github: contributor.html_url } : undefined,
            };
        })
    );

    return results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
}

function buildCommitList(commits) {
    return (Array.isArray(commits) ? commits : []).slice(0, 20).map((commit) => ({
        hash: commit?.sha?.slice(0, 7) || '',
        message: commit?.commit?.message?.split('\n')[0] || 'No message',
        author: commit?.commit?.author?.name || 'Unknown',
        date: commit?.commit?.author?.date || '',
    }));
}

function buildOverview(meta, commits, contributors, languages) {
    const lastCommit = commits?.[0]?.commit?.author?.date;
    const contributorCount = Array.isArray(contributors) ? contributors.length : 0;
    const langList = Object.keys(languages || {}).slice(0, 4);
    return [
        meta.description || 'No description provided.',
        `${meta.stargazers_count || 0} stars, ${meta.forks_count || 0} forks, ${meta.open_issues_count || 0} open issues.`,
        `${commits?.length || 0} recent commits from ${contributorCount || 1} contributor${contributorCount === 1 ? '' : 's'}.`,
        lastCommit ? `Last activity ${relativeDate(lastCommit)}.` : 'No recent commit data.',
        langList.length ? `Main stack: ${langList.join(', ')}.` : 'Language breakdown unavailable.',
    ].join(' ');
}

function buildOrigins(meta, sampledFiles, similarityMap) {
    const averageSimilarity = overallSimilarity(similarityMap);
    const generatedMarkers = sampledFiles.filter((file) => /generated|do not edit|auto-generated/i.test(file.content)).length;

    if (meta.fork) {
        return `This repository is a fork of ${meta.parent?.full_name || 'an upstream repository'}. Average boilerplate similarity is ${averageSimilarity}% across inspected files.`;
    }

    if (generatedMarkers > 0) {
        return `No direct fork detected, but ${generatedMarkers} inspected file(s) contain generated markers. Average boilerplate similarity is ${averageSimilarity}%.`;
    }

    return `No direct fork detected. Average boilerplate similarity across inspected files is ${averageSimilarity}%, which suggests mostly custom implementation with some framework/config scaffolding.`;
}

function buildCommitDNA(commits, contributors) {
    const commitList = Array.isArray(commits) ? commits : [];
    const contributorCount = Array.isArray(contributors) ? contributors.length : 0;
    const hours = commitList
        .map((commit) => Number.parseInt(String(new Date(commit?.commit?.author?.date || '').getUTCHours()), 10))
        .filter((hour) => Number.isFinite(hour));

    return {
        pattern: commitList.length > 20 ? 'Regular cadence' : commitList.length > 8 ? 'Clustered burst' : 'Sparse history',
        anomalyScore: calculateAnomalyScore(commitList.length, contributorCount),
        authorEntropy: contributorCount <= 1 ? 'Low - single core contributor' : `${contributorCount} active contributors`,
        lastActivity: commitList[0]?.commit?.author?.date || '',
        commitTimes: hours.length ? `${Math.min(...hours)}:00-${Math.max(...hours)}:00 UTC` : 'N/A',
    };
}

function buildScore({ meta, commits, languages, contributors, threats, dependencyList, similarityMap, sampledFiles, treeEntries }) {
    const dependencyCount = dependencyList.length;
    const contributorCount = Array.isArray(contributors) ? contributors.length : 0;
    const threatPenalty = threats.reduce((total, threat) => total + ({ CRITICAL: 22, HIGH: 14, MEDIUM: 8, LOW: 3, INFO: 0 }[threat.severity] || 0), 0);
    const similarity = overallSimilarity(similarityMap);
    const testFiles = treeEntries.filter((entry) => /(test|spec)\./i.test(entry.path)).length;
    const hasCi = treeEntries.some((entry) => entry.path.startsWith('.github/workflows/'));
    const manifestCount = sampledFiles.filter((file) => /package\.json|requirements\.txt|pyproject\.toml|Cargo\.toml|go\.mod|pom\.xml|build\.gradle/i.test(file.path)).length;
    const ageDays = daysSince(meta.created_at);
    const lastCommitAt = commits?.[0]?.commit?.author?.date;
    const lastCommitDays = lastCommitAt ? daysSince(lastCommitAt) : 999;

    const origin = clamp(Math.round(92 - similarity * 0.9 - (meta.fork ? 18 : 0)), 20, 96);
    const build = clamp(Math.round(35 + manifestCount * 12 + Math.min(18, dependencyCount) + Math.min(18, testFiles * 2) + (hasCi ? 10 : 0) + (meta.homepage ? 4 : 0)), 20, 96);
    const security = clamp(Math.round(92 - threatPenalty - (sampledFiles.length === 0 ? 12 : 0) - (dependencyList.some((dependency) => dependency.health === 'suspicious') ? 8 : 0)), 8, 96);
    const author = clamp(Math.round(38 + contributorCount * 10 + Math.min(20, commits.length * 1.4) + (yearsSince(meta.created_at) > 1 ? 6 : 0)), 20, 95);
    const activity = clamp(Math.round(90 - Math.min(60, lastCommitDays / 4) + Math.min(16, commits.length / 2) - (ageDays < 14 ? 6 : 0)), 12, 95);
    const community = clamp(Math.round(18 + Math.min(32, Math.log10((meta.stargazers_count || 0) + 1) * 18) + Math.min(16, Math.log10((meta.forks_count || 0) + 1) * 10) + (meta.license ? 8 : 0) + (meta.description ? 8 : 0) + Math.min(10, Object.keys(languages || {}).length * 2)), 8, 95);

    const total = clamp(Math.round(origin * 0.25 + build * 0.20 + security * 0.20 + author * 0.15 + activity * 0.10 + community * 0.10), 0, 100);

    return {
        total,
        origin,
        build,
        security,
        author,
        activity,
        community,
        tier: scoreToTier(total),
    };
}

function extractDependencies(sampledFiles) {
    const dependencies = new Map();

    for (const file of sampledFiles) {
        if (/package\.json$/i.test(file.path)) {
            try {
                const parsed = JSON.parse(file.content);
                addPackageBlock(dependencies, parsed.dependencies, 'prod');
                addPackageBlock(dependencies, parsed.devDependencies, 'dev');
            } catch {
                continue;
            }
        }

        if (/requirements\.txt$/i.test(file.path)) {
            for (const line of file.content.split(/\r?\n/)) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {
                    continue;
                }

                const [name, version] = trimmed.split(/==|>=|<=|~=|!=/);
                dependencies.set(name, {
                    name,
                    version: version ? trimmed.slice(name.length) : 'unspecified',
                    type: 'prod',
                    health: classifyDependencyHealth(name, trimmed),
                });
            }
        }

        if (/go\.mod$/i.test(file.path)) {
            for (const match of file.content.matchAll(/^\s*([^\s]+)\s+v([^\s]+)$/gm)) {
                const name = match[1];
                dependencies.set(name, {
                    name,
                    version: match[2],
                    type: 'prod',
                    health: classifyDependencyHealth(name, match[2]),
                });
            }
        }

        if (/Cargo\.toml$/i.test(file.path)) {
            for (const match of file.content.matchAll(/^([A-Za-z0-9_\-]+)\s*=\s*['"]([^'"]+)['"]/gm)) {
                const name = match[1];
                dependencies.set(name, {
                    name,
                    version: match[2],
                    type: 'prod',
                    health: classifyDependencyHealth(name, match[2]),
                });
            }
        }

        if (/pom\.xml$/i.test(file.path)) {
            for (const match of file.content.matchAll(/<dependency>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>[\s\S]*?<\/dependency>/g)) {
                const name = match[1];
                dependencies.set(name, {
                    name,
                    version: match[2],
                    type: 'prod',
                    health: classifyDependencyHealth(name, match[2]),
                });
            }
        }

        if (/build\.gradle/i.test(file.path)) {
            for (const match of file.content.matchAll(/(?:implementation|api|testImplementation)\s+['"]([^:'"]+:[^:'"]+:[^'"]+)['"]/g)) {
                const [group, artifact, version] = match[1].split(':');
                const name = `${group}:${artifact}`;
                dependencies.set(name, {
                    name,
                    version,
                    type: /testImplementation/.test(match[0]) ? 'dev' : 'prod',
                    health: classifyDependencyHealth(name, version),
                });
            }
        }
    }

    return Array.from(dependencies.values()).slice(0, 60);
}

function addPackageBlock(target, packages, type) {
    if (!packages || typeof packages !== 'object') {
        return;
    }

    for (const [name, version] of Object.entries(packages)) {
        target.set(name, {
            name,
            version: String(version),
            type,
            health: classifyDependencyHealth(name, String(version)),
        });
    }
}

function classifyDependencyHealth(name, version) {
    const text = `${name} ${version}`.toLowerCase();
    if (/latest|\*|git\+|github:|file:|link:|workspace:/.test(text) || /tmp|unknown|test-only|snapshot/.test(text)) {
        return 'suspicious';
    }
    if (/alpha|beta|rc|canary|preview/.test(text)) {
        return 'neutral';
    }
    return 'trusted';
}

function analyzeThreats({ meta, commits, contributors, treeEntries, sampledFiles, dependencyList }) {
    const threats = [];
    const seen = new Set();

    const pushThreat = (threat) => {
        const key = `${threat.file}:${threat.line || 0}:${threat.pattern}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        threats.push({ id: `threat-${seen.size}`, ...threat });
    };

    if (!meta.license) {
        pushThreat({
            severity: 'LOW',
            file: 'root',
            line: null,
            pattern: 'missing_license',
            description: 'Repository does not declare an open-source license.',
            fix: 'Add a LICENSE file so reuse and compliance are clear.',
        });
    }

    if (meta.archived) {
        pushThreat({
            severity: 'HIGH',
            file: 'root',
            line: null,
            pattern: 'archived_repository',
            description: 'Repository is archived, so fixes and maintenance may have stopped.',
            fix: 'Verify whether there is an actively maintained successor before trusting the project.',
        });
    }

    if (daysSince(meta.created_at) <= 14) {
        pushThreat({
            severity: 'HIGH',
            file: 'root',
            line: null,
            pattern: 'brand_new_repository',
            description: `Repository was created only ${daysSince(meta.created_at)} day(s) ago.`,
            fix: 'Treat young repositories as higher risk until there is more history and review surface.',
        });
    }

    if ((Array.isArray(contributors) ? contributors.length : 0) <= 1 && commits.length <= 10) {
        pushThreat({
            severity: 'MEDIUM',
            file: 'commits',
            line: null,
            pattern: 'single_author_sparse_history',
            description: 'The inspected history is sparse and concentrated in one contributor.',
            fix: 'Look for longer commit history, outside audits, or more reviewer participation.',
        });
    }

    if (treeEntries.some((entry) => /(^|\/)(\.env|id_rsa|id_dsa|\.pem|secrets?\.ya?ml)$/i.test(entry.path))) {
        const match = treeEntries.find((entry) => /(^|\/)(\.env|id_rsa|id_dsa|\.pem|secrets?\.ya?ml)$/i.test(entry.path));
        pushThreat({
            severity: 'CRITICAL',
            file: match?.path || 'root',
            line: null,
            pattern: 'sensitive_file_in_repository',
            description: 'A likely secret-bearing file exists in the repository tree.',
            fix: 'Remove secret files from Git history and rotate affected credentials immediately.',
        });
    }

    for (const file of sampledFiles) {
        scanTextThreats(file, pushThreat);
    }

    const suspiciousDependencies = dependencyList.filter((dependency) => dependency.health === 'suspicious').slice(0, 4);
    for (const dependency of suspiciousDependencies) {
        pushThreat({
            severity: 'MEDIUM',
            file: 'dependencies',
            line: null,
            pattern: 'unstable_dependency_source',
            description: `Dependency ${dependency.name} uses a risky source or version declaration (${dependency.version}).`,
            fix: 'Pin this dependency to a reviewed release version from a trusted registry.',
        });
    }

    if (threats.length === 0) {
        pushThreat({
            severity: 'INFO',
            file: 'root',
            line: null,
            pattern: 'no_high_signal_issues',
            description: 'No high-signal threat patterns were detected in the inspected sample.',
            fix: 'Broaden inspection to all source files or run static analysis for deeper coverage.',
        });
    }

    return threats.sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity));
}

async function buildInsights({ meta, threats, dependencies, sampledFiles, treeEntries, commits, contributors, languages, owner, repo }) {
    const duplicates = findDuplicateFunctions(sampledFiles);
    const suggestions = await generateInsightSuggestionsWithMegaLlm({
        meta,
        threats,
        dependencies,
        treeEntries,
        commits,
        contributors,
        languages,
        sampledFiles,
        duplicates,
        owner,
        repo,
    });

    return {
        suggestions,
        duplicates,
    };
}

async function generateInsightSuggestionsWithMegaLlm({ meta, threats, dependencies, treeEntries, commits, contributors, languages, sampledFiles, duplicates, owner, repo }) {
    if (!process.env.MEGALLM_API_KEY) {
        return [];
    }

    const context = {
        repository: `${owner}/${repo}`,
        description: meta?.description || 'No description provided.',
        stars: meta?.stargazers_count || 0,
        forks: meta?.forks_count || 0,
        openIssues: meta?.open_issues_count || 0,
        defaultBranch: meta?.default_branch || 'unknown',
        languages: Object.keys(languages || {}).slice(0, 6),
        contributorCount: Array.isArray(contributors) ? contributors.length : 0,
        recentCommitCount: Array.isArray(commits) ? commits.length : 0,
        testFileCount: (Array.isArray(treeEntries) ? treeEntries : []).filter((entry) => /(test|spec)\./i.test(entry.path)).length,
        threats: (Array.isArray(threats) ? threats : []).slice(0, 8).map((threat) => ({
            severity: threat.severity,
            file: threat.file,
            line: threat.line,
            pattern: threat.pattern,
            description: threat.description,
            fix: threat.fix,
        })),
        dependencies: (Array.isArray(dependencies) ? dependencies : []).slice(0, 12).map((dependency) => ({
            name: dependency.name,
            version: dependency.version,
            type: dependency.type,
            health: dependency.health,
        })),
        duplicateGroups: (Array.isArray(duplicates) ? duplicates : []).slice(0, 6).map((duplicate) => ({
            name: duplicate.name,
            count: duplicate.count,
            files: duplicate.locations.map((location) => location.file),
        })),
        sampledFiles: (Array.isArray(sampledFiles) ? sampledFiles : []).slice(0, 8).map((file) => ({
            path: file.path,
            excerpt: truncateText(file.content, 500),
        })),
    };

    try {
        const data = await callMegaLlmChatCompletions({
            temperature: 0.2,
            maxTokens: 2000,
            responseFormat: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: [
                        'You are Eliza, the repository analyst inside Eliza Security Agent.',
                        'Return only valid JSON with shape {"suggestions": Suggestion[]}.',
                        'Each suggestion must contain id, priority, icon, title, desc, action, impact, files.',
                        'priority must be one of HIGH, MEDIUM, LOW.',
                        'files must be an array of real file paths from the provided context, or an empty array.',
                        'Do not invent files, counts, or issues not supported by the repository context.',
                        'If there are no strong recommendations, return {"suggestions":[]}.',
                    ].join(' '),
                },
                {
                    role: 'user',
                    content: `Analyze this repository context and produce up to 4 concrete insights as JSON only:\n${JSON.stringify(context)}`,
                },
            ],
        });

        const content = normalizeChatCompletionContent(data?.choices?.[0]?.message?.content);
        const parsed = JSON.parse(content || '{}');
        return normalizeInsightSuggestions(parsed?.suggestions).slice(0, 4);
    } catch {
        return [];
    }
}

function normalizeInsightSuggestions(suggestions) {
    if (!Array.isArray(suggestions)) {
        return [];
    }

    return suggestions
        .map((suggestion, index) => ({
            id: String(suggestion?.id || `llm-${index + 1}`),
            priority: ['HIGH', 'MEDIUM', 'LOW'].includes(String(suggestion?.priority || '').toUpperCase())
                ? String(suggestion.priority).toUpperCase()
                : 'LOW',
            icon: String(suggestion?.icon || '✦').slice(0, 2),
            title: String(suggestion?.title || '').trim(),
            desc: String(suggestion?.desc || '').trim(),
            action: String(suggestion?.action || '').trim(),
            impact: String(suggestion?.impact || '').trim(),
            files: Array.isArray(suggestion?.files)
                ? suggestion.files.map((file) => String(file).trim()).filter(Boolean).slice(0, 6)
                : [],
        }))
        .filter((suggestion) => suggestion.title && suggestion.desc && suggestion.action && suggestion.impact);
}

function findDuplicateFunctions(sampledFiles) {
    const groups = new Map();

    for (const file of Array.isArray(sampledFiles) ? sampledFiles : []) {
        if (!/\.(ts|tsx|js|jsx|mjs|cjs|py|rb|php|go|java|kt|cs)$/i.test(file.path)) {
            continue;
        }

        const lines = String(file.content || '').split(/\r?\n/);
        const matches = collectFunctionDefinitions(String(file.content || ''));

        for (const match of matches) {
            if (!match.name || match.name.length < 3) {
                continue;
            }

            const key = match.name.toLowerCase();
            const entry = groups.get(key) || { id: `dup-${key}`, name: match.name, locations: [] };
            entry.locations.push({
                file: file.path,
                line: match.line,
                snippet: extractSnippet(lines, match.line, 5),
            });
            groups.set(key, entry);
        }
    }

    return Array.from(groups.values())
        .filter((group) => group.locations.length >= 2)
        .sort((left, right) => right.locations.length - left.locations.length || left.name.localeCompare(right.name))
        .slice(0, 6)
        .map((group) => ({
            id: group.id,
            name: group.name,
            count: group.locations.length,
            locations: group.locations.slice(0, 4),
        }));
}

function collectFunctionDefinitions(content) {
    const definitions = [];
    const patterns = [
        /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
        /(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^\n]*?\)\s*=>/g,
        /^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm,
        /(?:public|private|protected)?\s*(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\([^\n]*?\)\s*\{/g,
    ];

    for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
            const index = match.index || 0;
            definitions.push({
                name: match[1],
                line: findLineNumber(content, index),
            });
        }
    }

    return definitions;
}

function extractSnippet(lines, startLine, lineCount) {
    const start = Math.max(0, startLine - 1);
    return lines.slice(start, start + lineCount).join('\n').trim();
}

function buildPreviewSample(sampledFiles, threats) {
    if (!Array.isArray(sampledFiles) || sampledFiles.length === 0) {
        return null;
    }

    const prioritizedThreat = Array.isArray(threats) ? threats.find((threat) => threat.file && threat.line) : null;
    const selectedFile = prioritizedThreat
        ? sampledFiles.find((file) => file.path === prioritizedThreat.file)
        : sampledFiles[0];

    if (!selectedFile) {
        return null;
    }

    const lines = String(selectedFile.content || '').split(/\r?\n/);
    const highlightLine = prioritizedThreat?.line || 1;
    const startLine = Math.max(1, highlightLine - 4);

    return {
        file: selectedFile.path,
        line: highlightLine,
        startLine,
        content: lines.slice(startLine - 1, startLine - 1 + 14).join('\n'),
    };
}

function humanizeThreatPattern(pattern) {
    return String(pattern || 'Repository issue')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scanTextThreats(file, pushThreat) {
    const checks = [
        {
            severity: 'CRITICAL',
            pattern: 'hardcoded_secret',
            regex: /(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*['"][A-Za-z0-9_\-/+=]{16,}['"]/i,
            description: 'Possible hardcoded credential detected in source.',
            fix: 'Move secrets to environment variables or a managed secret store.',
        },
        {
            severity: 'CRITICAL',
            pattern: 'api_key_secret',
            regex: /sk-or-v1-[A-Za-z0-9]{20,}/,
            description: 'An API key pattern appears in the repository.',
            fix: 'Remove the key from source control and rotate it immediately.',
        },
        {
            severity: 'HIGH',
            pattern: 'tls_verification_disabled',
            regex: /(rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False)/,
            description: 'TLS or certificate verification appears to be disabled.',
            fix: 'Restore certificate validation and trust the correct CA chain instead.',
        },
        {
            severity: 'HIGH',
            pattern: 'dangerous_shell_execution',
            regex: /(child_process\.(exec|spawn)\s*\(|subprocess\.(Popen|run)\([^\n]*shell\s*=\s*True)/,
            description: 'Shell execution detected in code. This often needs input hardening.',
            fix: 'Use argument arrays and strict allow-lists for executable inputs.',
        },
        {
            severity: 'MEDIUM',
            pattern: 'eval_usage',
            regex: /\beval\s*\(/,
            description: 'eval() usage detected.',
            fix: 'Replace eval with explicit parsing or a safer interpreter.',
        },
        {
            severity: 'MEDIUM',
            pattern: 'dangerous_inner_html',
            regex: /(dangerouslySetInnerHTML|innerHTML\s*=)/,
            description: 'Raw HTML rendering detected and may need sanitization.',
            fix: 'Sanitize untrusted HTML before rendering it into the DOM.',
        },
        {
            severity: 'LOW',
            pattern: 'tx_origin_usage',
            regex: /\btx\.origin\b/,
            description: 'tx.origin usage can be unsafe for authorization checks.',
            fix: 'Prefer msg.sender-based authorization in Solidity contracts.',
        },
    ];

    for (const check of checks) {
        const match = file.content.match(check.regex);
        if (!match) {
            continue;
        }

        pushThreat({
            severity: check.severity,
            file: file.path,
            line: findLineNumber(file.content, match.index || 0),
            pattern: check.pattern,
            description: check.description,
            fix: check.fix,
        });
    }
}

function buildTreeEntries(blobEntries) {
    return blobEntries
        .filter((entry) => isTreeRelevant(entry.path))
        .sort((left, right) => left.path.localeCompare(right.path))
        .slice(0, MAX_TREE_FILES)
        .map((entry) => ({
            path: entry.path,
            name: entry.path.split('/').pop() || entry.path,
            type: 'file',
            size: entry.size || 0,
        }));
}

function pickFilesForAnalysis(blobEntries) {
    return blobEntries
        .filter((entry) => isTreeRelevant(entry.path) && isTextLikePath(entry.path) && (entry.size || 0) <= MAX_FILE_BYTES)
        .map((entry) => ({ path: entry.path, score: filePriority(entry.path) }))
        .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
        .slice(0, MAX_ANALYSIS_FILES)
        .map((entry) => entry.path);
}

function isTreeRelevant(filePath) {
    return !/(^|\/)(node_modules|dist|build|coverage|vendor|\.next|\.turbo|\.git)\//i.test(filePath);
}

function isTextLikePath(filePath) {
    return /(^|\/)(Dockerfile|\.env(\.[^/]+)?|README|LICENSE|CHANGELOG|Makefile)$|\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|scss|html|yml|yaml|sh|py|rs|go|java|kt|cs|php|rb|sol|sql|toml|xml|gradle|txt)$/i.test(filePath);
}

function filePriority(filePath) {
    let score = 0;
    if (/(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|requirements\.txt|pyproject\.toml|Cargo\.toml|go\.mod|pom\.xml|build\.gradle|README\.md|Dockerfile)$/i.test(filePath)) {
        score += 120;
    }
    if (/src\/|app\/|lib\/|server\//i.test(filePath)) {
        score += 60;
    }
    if (/(auth|api|config|route|controller|service|client|security|secret|token|env|contract)/i.test(filePath)) {
        score += 40;
    }
    if (/\.(ts|tsx|js|jsx|py|go|rs|java|kt|cs|php|rb|sol)$/i.test(filePath)) {
        score += 30;
    }
    score -= filePath.split('/').length * 2;
    return score;
}

function buildSimilarityMap(viewableEntries, sampledFiles) {
    const sampledByPath = new Map(sampledFiles.map((file) => [file.path, file.content]));
    const similarityMap = new Map();

    for (const entry of viewableEntries) {
        const content = sampledByPath.get(entry.path) || '';
        similarityMap.set(entry.path, estimateSimilarity(entry.path, content));
    }

    return similarityMap;
}

function estimateSimilarity(filePath, content) {
    let score = 0;

    if (/lock|package-lock\.json|pnpm-lock\.yaml|yarn\.lock/i.test(filePath)) {
        score += 72;
    }
    if (/(vite|tailwind|eslint|prettier|tsconfig|package\.json|components\.json|composer\.json|Cargo\.toml|go\.mod|pom\.xml|build\.gradle)/i.test(filePath)) {
        score += 32;
    }
    if (/README|LICENSE|CHANGELOG/i.test(filePath)) {
        score += 18;
    }
    if (/generated|auto-generated|do not edit/i.test(content) || /@generated/i.test(content)) {
        score += 30;
    }
    if (content && content.split(/\r?\n/).length < 14) {
        score += 10;
    }
    if (/src\/.*\.(ts|tsx|js|jsx|py|go|rs|java|kt|cs|php|rb|sol)$/i.test(filePath)) {
        score = Math.max(4, score - 14);
    }

    return clamp(Math.round(score), 0, 95);
}

function nestFileTree(entries, similarityMap) {
    const root = [];

    for (const entry of entries) {
        const parts = entry.path.split('/');
        let cursor = root;
        let partialPath = '';

        for (let index = 0; index < parts.length; index += 1) {
            const segment = parts[index];
            partialPath = partialPath ? `${partialPath}/${segment}` : segment;
            const isLeaf = index === parts.length - 1;

            if (isLeaf) {
                cursor.push({
                    name: segment,
                    type: 'file',
                    path: entry.path,
                    similarity: similarityMap.get(entry.path) || 0,
                    authorship: authorshipFromSimilarity(entry.path, similarityMap.get(entry.path) || 0),
                    confidence: 0.62,
                    language: getLanguageFromPath(entry.path),
                });
                continue;
            }

            let folder = cursor.find((node) => node.type === 'folder' && node.name === segment);
            if (!folder) {
                folder = {
                    name: segment,
                    type: 'folder',
                    path: partialPath,
                    similarity: 0,
                    authorship: 'HUMAN',
                    confidence: 0.5,
                    children: [],
                };
                cursor.push(folder);
            }

            cursor = folder.children;
        }
    }

    sortNodes(root);
    return root;
}

function sortNodes(nodes) {
    nodes.sort((left, right) => {
        if (left.type !== right.type) {
            return left.type === 'folder' ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
    });

    for (const node of nodes) {
        if (node.type === 'folder' && Array.isArray(node.children)) {
            sortNodes(node.children);
        }
    }
}

function authorshipFromSimilarity(filePath, similarity) {
    if (/generated|\.snap$/i.test(filePath) || similarity >= 70) {
        return 'COPIED';
    }
    if (similarity >= 35) {
        return 'MIXED';
    }
    return 'HUMAN';
}

function overallSimilarity(similarityMap) {
    const values = Array.from(similarityMap.values());
    if (!values.length) {
        return 0;
    }
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function primaryLanguage(languages) {
    return Object.entries(languages || {}).sort((left, right) => right[1] - left[1])[0]?.[0] || 'Unknown';
}

function severityWeight(severity) {
    return { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 }[severity] || 0;
}

function scoreToTier(score) {
    if (score >= 85) return 'VERIFIED';
    if (score >= 70) return 'TRUSTED';
    if (score >= 55) return 'CAUTION';
    if (score >= 40) return 'SUSPICIOUS';
    return 'HIGH_RISK';
}

function calculateAnomalyScore(commitCount, contributorCount) {
    if (commitCount < 5) return 68;
    if (contributorCount <= 1 && commitCount < 12) return 32;
    if (commitCount > 24 && contributorCount >= 3) return 9;
    return 18;
}

function relativeDate(dateValue) {
    const days = daysSince(dateValue);
    if (days <= 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

function daysSince(dateValue) {
    return Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 86_400_000));
}

function yearsSince(dateValue) {
    return Math.max(0, Math.floor(daysSince(dateValue) / 365));
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength)}\n\n...truncated`;
}

function formatThreats(threats) {
    if (!Array.isArray(threats) || threats.length === 0) {
        return 'None';
    }
    return threats
        .slice(0, 8)
        .map((threat) => `${threat.severity} ${threat.file}${threat.line ? `:${threat.line}` : ''} - ${threat.description}`)
        .join('; ');
}

function formatDependencies(dependencies) {
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
        return 'None';
    }
    return dependencies
        .slice(0, 12)
        .map((dependency) => `${dependency.name}@${dependency.version} (${dependency.type}, ${dependency.health})`)
        .join(', ');
}

function getLanguageFromPath(filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const map = {
        ts: 'typescript',
        tsx: 'tsx',
        js: 'javascript',
        jsx: 'jsx',
        mjs: 'javascript',
        cjs: 'javascript',
        json: 'json',
        md: 'markdown',
        css: 'css',
        scss: 'scss',
        html: 'html',
        yml: 'yaml',
        yaml: 'yaml',
        sh: 'bash',
        py: 'python',
        rs: 'rust',
        go: 'go',
        java: 'java',
        kt: 'kotlin',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        sol: 'solidity',
        sql: 'sql',
        xml: 'xml',
        toml: 'toml',
        txt: 'text',
    };
    return map[extension] || 'text';
}

function encodeGitHubPath(filePath) {
    return filePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

function findLineNumber(content, index) {
    return content.slice(0, index).split(/\r?\n/).length;
}

function looksLikeText(content) {
    return !/\u0000/.test(content);
}

function normalizeChatCompletionContent(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === 'string') {
                    return item;
                }
                if (item?.text) {
                    return item.text;
                }
                return '';
            })
            .join('')
            .trim();
    }
    return 'No response generated.';
}

function safeParseJson(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function normalizeCrossCheckStatus(status) {
    const normalized = String(status || '').trim().toUpperCase();
    if (normalized === 'VERIFIED' || normalized === 'LIE DETECTED' || normalized === 'INCONCLUSIVE') {
        return normalized;
    }
    return 'INCONCLUSIVE';
}

function defaultCrossCheckHeadline(status) {
    if (status === 'VERIFIED') {
        return 'Evidence aligns with the GitHub record.';
    }

    if (status === 'LIE DETECTED') {
        return 'Manual claim conflicts with repository timing.';
    }

    return 'The evidence set is incomplete or ambiguous.';
}

function buildSocialSentimentFacts(repository) {
    const commitDates = Array.isArray(repository?.commits)
        ? repository.commits
            .map((commit) => commit?.date || '')
            .filter(Boolean)
            .sort()
        : [];

    return {
        repoCreatedAt: repository?.createdAt || null,
        firstCommitAt: commitDates[0] || null,
        contributorCount: Array.isArray(repository?.authors) ? repository.authors.length : 0,
        commitFrequency: summarizeCommitFrequency(repository?.commits || [], repository?.createdAt),
    };
}

function summarizeCommitFrequency(commits, repoCreatedAt) {
    const dates = Array.isArray(commits)
        ? commits
            .map((commit) => new Date(commit?.date || ''))
            .filter((date) => !Number.isNaN(date.getTime()))
        : [];

    if (dates.length < 2) {
        return `${Array.isArray(commits) ? commits.length : 0} observed commit${commits.length === 1 ? '' : 's'} in the sampled window.`;
    }

    const oldest = dates[dates.length - 1];
    const newest = dates[0];
    const spanDays = Math.max(1, Math.ceil((newest.getTime() - oldest.getTime()) / 86400000));
    const cadence = ((commits.length / spanDays) * 7).toFixed(1);

    if (repoCreatedAt) {
        const ageDays = daysSince(repoCreatedAt);
        return `${cadence} commits/week across a ${spanDays}-day sample; repository age ${ageDays} day${ageDays === 1 ? '' : 's'}.`;
    }

    return `${cadence} commits/week across a ${spanDays}-day sample.`;
}

async function safeJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function optionalGitHubJson(endpoint) {
    try {
        return await githubJson(endpoint);
    } catch {
        return null;
    }
}

async function optionalGitHubText(endpoint, accept) {
    try {
        return await githubText(endpoint, accept);
    } catch {
        return null;
    }
}

async function githubJson(endpoint) {
    const response = await githubFetch(endpoint, 'application/vnd.github+json');
    return response.json();
}

async function githubText(endpoint, accept = 'application/vnd.github.raw+json') {
    const response = await githubFetch(endpoint, accept);
    return response.text();
}

async function githubFetch(endpoint, accept) {
    const headers = {
        Accept: accept,
        'User-Agent': 'Eliza-Security-Agent',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com${endpoint}`, { headers });

    if (response.ok) {
        return response;
    }

    const data = await safeJson(response);
    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
        throw createHttpError(429, 'GitHub API rate limit exceeded. Add GITHUB_TOKEN for higher limits.', {
            resetAt: response.headers.get('x-ratelimit-reset'),
        });
    }

    throw createHttpError(response.status, data?.message || `GitHub request failed for ${endpoint}`);
}
