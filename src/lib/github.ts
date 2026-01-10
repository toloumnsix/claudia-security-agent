import type { Repository } from '../data/mockRepoData';

export interface RepositoryFileContent {
  path: string;
  language: string;
  content: string;
  truncated: boolean;
}

interface ChatRequest {
  question: string;
  repository: Repository;
  activeFile?: {
    path: string;
    content?: string;
  } | null;
}

interface ChatResponse {
  content: string;
  model?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function fetchGitHubRepo(input: string): Promise<Repository> {
  const repo = sanitizeRepoInput(input);
  return apiRequest<Repository>(`/api/scan?repo=${encodeURIComponent(repo)}`);
}

export async function fetchGitHubFileContent(repo: string, filePath: string): Promise<RepositoryFileContent> {
  return apiRequest<RepositoryFileContent>(
    `/api/file?repo=${encodeURIComponent(sanitizeRepoInput(repo))}&path=${encodeURIComponent(filePath)}`
  );
}

export async function askRepositoryQuestion(payload: ChatRequest): Promise<ChatResponse> {
  const data = await apiRequest<unknown>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    content: extractChatContent(data),
    model: typeof data === 'object' && data !== null && 'model' in data ? String((data as { model?: unknown }).model || '') || undefined : undefined,
  };
}

function sanitizeRepoInput(input: string): string {
  return String(input || '')
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/\/$/, '');
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.');
  }

  return data as T;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractChatContent(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const record = data as Record<string, unknown>;
  const directContent = record.content;
  if (typeof directContent === 'string') {
    return directContent.trim();
  }

  const choices = record.choices;
  if (Array.isArray(choices)) {
    const firstChoice = choices[0] as Record<string, unknown> | undefined;
    const message = firstChoice?.message as Record<string, unknown> | undefined;
    const messageContent = message?.content;
    if (typeof messageContent === 'string') {
      return messageContent.trim();
    }
    if (Array.isArray(messageContent)) {
      return messageContent
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }
          if (part && typeof part === 'object' && 'text' in part && typeof (part as { text?: unknown }).text === 'string') {
            return String((part as { text?: unknown }).text);
          }
          return '';
        })
        .join('')
        .trim();
    }

    if (typeof firstChoice?.text === 'string') {
      return firstChoice.text.trim();
    }
  }

  if (typeof record.text === 'string') {
    return record.text.trim();
  }

  if (typeof record.answer === 'string') {
    return record.answer.trim();
  }

  return '';
}
