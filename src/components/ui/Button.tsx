import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-space font-medium rounded transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--accent-primary)] text-[var(--bg-base)] border border-[var(--accent-primary)] hover:bg-[#00b8d9] hover:border-[#00b8d9]',
    secondary: 'bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-primary)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] border-none p-2 hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]',
    danger: 'bg-[var(--color-danger)] text-white border border-[var(--color-danger)] hover:bg-[#dc2626]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
