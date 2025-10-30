import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme } from '@/lib/theme';

const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const onToggle = () => {
    toggleTheme();
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={onToggle}
      className={`inline-flex items-center justify-center rounded-md h-9 w-9 border border-border bg-background text-foreground hover:bg-muted transition-medical ${className}`}
    >
      {/* Use both icons; reveal with prefers-color-scheme via CSS class on root */}
      <Sun className="h-4 w-4 block dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </button>
  );
};

export default ThemeToggle;
