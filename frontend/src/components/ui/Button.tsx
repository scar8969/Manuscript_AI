import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] rounded-sm focus-ring text-sm';

  const variants = {
    primary: 'btn-primary text-on-primary shadow-sm',
    secondary: 'btn-secondary text-on-surface',
    tertiary: 'text-on-surface-variant hover:text-on-surface hover:underline'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
