import React from 'react';

export default function FormField({ 
  label, 
  error, 
  required = false, 
  optionalText, 
  children,
  className = ''
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || optionalText) && (
        <label className="text-xs font-bold text-secondary uppercase tracking-wider block flex justify-between">
          <span>
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </span>
          {optionalText && <span className="text-[10px] text-muted normal-case font-normal">{optionalText}</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="text-xs text-danger flex items-center gap-1 mt-0.5">
          <span className="material-symbols-rounded text-xs" style={{ fontSize: '14px' }}>error</span>
          {error}
        </span>
      )}
    </div>
  );
}
