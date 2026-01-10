import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({
  error = false,
  className = '',
  ...props
}) => {
  return (
    <input
      className={`
        w-full px-4 py-3
        bg-[var(--bg-card)]
        border ${error ? 'border-[var(--color-danger)]' : 'border-[var(--border-card)]'}
        text-[var(--text-primary)]
        text-sm
        rounded
        transition-colors duration-150
        placeholder:text-[var(--text-muted)]
        focus:outline-none focus:border-[var(--accent-primary)]
        font-['Inter',sans-serif]
        ${className}
      `}
      {...props}
    />
  );
};
