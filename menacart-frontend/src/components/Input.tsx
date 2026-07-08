import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, disabled, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <div className={`input-container ${disabled ? 'input-disabled' : ''} ${error ? 'input-has-error' : ''} ${className}`}>
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
        <div className="input-wrapper">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className="input-field"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>
        {error && (
          <span id={`${inputId}-error`} className="input-error" role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-helper`} className="input-helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
