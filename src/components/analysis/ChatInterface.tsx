import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SendIcon, BotIcon } from '../ui/Icons';
import type { Repository } from '../../data/mockRepoData';
import { askRepositoryQuestion } from '../../lib/github';

interface ChatInterfaceProps {
  repoName: string;
  repository: Repository;
  activeFile?: {
    path: string;
    content?: string;
  } | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Why this score?',
  'Top risks?',
  'Safe to invest?',
  'CT caption',
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ repoName, repository, activeFile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedText]);

  const simulateTyping = (text: string) => {
    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: text,
            timestamp: new Date(),
          },
        ]);
        setDisplayedText('');
      }
    }, 20);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!repository.fullName) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      setIsLoading(true);
      const response = await askRepositoryQuestion({
        question: input,
        repository,
        activeFile: activeFile || null,
      });
      const content = response.content.trim();
      simulateTyping(content || 'No response generated.');
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Chat request failed.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BotIcon size={16} className="text-[var(--accent-primary)]" />
        <span className="font-space text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          Ask Eliza
        </span>
      </div>

      {/* Messages */}
      <div
        className="space-y-3 max-h-48 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg overflow-hidden ${msg.role === 'user' ? 'ml-4' : 'mr-1'}`}
          >
            {/* Header */}
            <div
              className="px-3 py-1.5 flex items-center gap-2"
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              }}
            >
              <span className="text-xs font-semibold" style={{ color: msg.role === 'user' ? 'var(--bg-base)' : 'var(--text-primary)' }}>
                {msg.role === 'user' ? 'You' : '🤖 Eliza'}
              </span>
            </div>
            
            {/* Content */}
            <div
              className="px-3 py-2 text-xs leading-relaxed"
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--accent-primary-dim)' : 'var(--bg-base)',
                color: 'var(--text-secondary)',
                border: `1px solid ${msg.role === 'user' ? 'var(--accent-primary)' : 'var(--border-card)'}`,
                borderTop: 'none',
              }}
            >
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && displayedText && (
          <div className="rounded-lg overflow-hidden mr-1">
            {/* Header */}
            <div
              className="px-3 py-1.5 flex items-center gap-2"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                🤖 Eliza
              </span>
            </div>
            
            {/* Content */}
            <div
              className="px-3 py-2 text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-card)',
                borderTop: 'none',
              }}
            >
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayedText}
                </ReactMarkdown>
              </div>
              <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => handleSuggestionClick(question)}
              className="px-2 py-1 text-[10px] rounded-full transition-colors"
              style={{
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-card)',
              }}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={repository.fullName ? 'Ask anything about this repo...' : 'Scan a repository to enable chat'}
          disabled={!repository.fullName || isLoading || isTyping}
          className="w-full px-3 py-2 pr-10 text-xs rounded"
          style={{
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border-card)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !repository.fullName || isLoading || isTyping}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--bg-base)' }}
        >
          <SendIcon size={14} />
        </button>
      </div>
    </div>
  );
};
