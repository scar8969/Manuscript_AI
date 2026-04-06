import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label">{label}</label>
      )}
      <input
        className={`input-field w-full text-sm px-3 py-2 outline-none ${error ? 'border-b-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-error mt-0.5">{error}</span>}
    </div>
  );
}
