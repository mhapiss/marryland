// src/components/common/FormField.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea';
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  error?: string;
  hint?: string;
  className?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  defaultValue,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  error,
  hint,
  className = '',
}: FormFieldProps) {
  const inputId = name || label.toLowerCase().replace(/\s+/g, '-');

  const baseInputClasses =
    `w-full px-4 py-3 rounded-sm border bg-kertas text-tinta text-base transition-colors duration-200 outline-none placeholder:text-tinta-lembut/40 disabled:opacity-60 disabled:cursor-not-allowed ${
      error
        ? 'border-merah ring-1 ring-merah focus:border-merah'
        : 'border-garis focus:border-merah focus:ring-1 focus:ring-merah'
    }`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="label-caps text-tinta-lembut">
          {label}
          {required && <span className="text-merah ml-1">*</span>}
        </label>
        {hint && <span className="text-xs text-tinta-lembut/70">{hint}</span>}
      </div>

      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} resize-y`}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        />
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-merah mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Gagal: {error}</span>
        </div>
      )}
    </div>
  );
}
