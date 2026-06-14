import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex justify-center items-center animate-fade-in p-4" onClick={(e) => {
      if (e.target === e.currentTarget && onClose) onClose();
    }}>
      <div className={`w-full ${maxWidth} h-[85vh] bg-secondary border border-panel rounded-2xl shadow-2xl flex flex-col animate-scale-up overflow-hidden`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function ModalHeader({ title, icon, onClose }) {
  return (
    <header className="p-6 border-b border-panel flex items-center justify-between bg-surface shrink-0">
      <h2 className="text-xl font-bold flex items-center gap-2">
        {icon && <span className="material-symbols-rounded text-accent-primary">{icon}</span>}
        {title}
      </h2>
      {onClose && (
        <button type="button" className="btn btn-ghost p-2" onClick={onClose} aria-label="Close modal">
          <span className="material-symbols-rounded">close</span>
        </button>
      )}
    </header>
  );
}

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin ${className}`}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }) {
  return (
    <footer className={`p-6 border-t border-panel bg-secondary/90 flex gap-3 shrink-0 ${className}`}>
      {children}
    </footer>
  );
}
