import React, { useMemo } from 'react';
import { Threat } from '../../data/mockRepoData';

interface CodeViewerProps {
  code: string;
  language?: string;
  threats?: Threat[];
  filePath?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'typescript',
  threats = [],
  filePath = '',
}) => {
  const lines = code.split('\n');

  // Create a map of line numbers to threats
  const threatsByLine = useMemo(() => {
    const map = new Map<number, Threat>();
    threats.forEach((threat) => {
      map.set(threat.line, threat);
    });
    return map;
  }, [threats]);

  const highlightedLines = useMemo(() => {
    return lines.map((line, index) => {
      return highlightLine(line, language);
    });
  }, [lines, language]);

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ backgroundColor: '#080a0f', fontFamily: 'JetBrains Mono, monospace' }}
    >
      <pre className="p-0 m-0">
        {highlightedLines.map((tokens, lineIndex) => {
          const lineNumber = lineIndex + 1;
          const threat = threatsByLine.get(lineNumber);

          return (
            <div
              key={lineIndex}
              className={`code-line ${threat ? 'matched' : ''}`}
              style={{
                borderLeft: threat ? '3px solid var(--color-danger)' : '3px solid transparent',
                backgroundColor: threat ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
              }}
              title={threat ? `${threat.severity}: ${threat.description}` : undefined}
            >
              <span className="code-line-number">{lineNumber}</span>
              <span className="code-line-content">{tokens}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
};

// Simple syntax highlighting
function highlightLine(line: string, language: string): React.ReactNode {
  if (!line.trim()) {
    return <br />;
  }

  // TypeScript/JavaScript/Solidity patterns
  const patterns = [
    // Comments
    { regex: /^(\/\/.*|\/\*[\s\S]*?\*\/)/, className: 'syn-comment' },
    // Strings
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, className: 'syn-string' },
    // Numbers
    { regex: /\b(\d+\.?\d*)\b/g, className: 'syn-number' },
    // Keywords
    { regex: /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|new|this|public|private|protected|static|readonly|async|await|try|catch|throw|require|assert|revert|emit|constructor|override|view|pure|payable|mapping|address|bool|uint|int|string|bytes|memory|storage|calldata|contract|struct|enum|event|modifier|using|is|abstract|virtual|import|from|as|pragma|solidity)\b/g, className: 'syn-keyword' },
    // Types
    { regex: /\b([A-Z][a-zA-Z0-9]*)\b/g, className: 'syn-type' },
    // Functions
    { regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, className: 'syn-function' },
    // Operators
    { regex: /(=>|===|!==|&&|\|\||[+\-*/%=<>!&|^~?:])/g, className: 'syn-operator' },
  ];

  let result = line;
  const replacements: { start: number; end: number; text: string }[] = [];

  // Find all matches for each pattern
  patterns.forEach(({ regex, className }) => {
    const re = new RegExp(regex.source, 'g');
    let match;
    while ((match = re.exec(line)) !== null) {
      replacements.push({
        start: match.index,
        end: match.index + match[0].length,
        text: `<span class="${className}">${escapeHtml(match[0])}</span>`,
      });
    }
  });

  // Sort replacements by position (descending) to apply from end to start
  replacements.sort((a, b) => b.start - a.start);

  // Apply replacements
  let resultLine = line;
  replacements.forEach(({ start, end, text }) => {
    resultLine = resultLine.slice(0, start) + text + resultLine.slice(end);
  });

  // If no matches, just return the line
  if (replacements.length === 0) {
    return <span>{line || ' '}</span>;
  }

  return <span dangerouslySetInnerHTML={{ __html: resultLine }} />;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
