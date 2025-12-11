import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-xl transition-all duration-300 overflow-hidden
        ${theme === 'dark' 
          ? 'bg-slate-800 text-neon-cyan hover:bg-slate-700 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
          : 'bg-white text-orange-500 hover:bg-slate-50 shadow-md border border-slate-200'}
      `}
      aria-label="Toggle Theme"
    >
      <div className="relative z-10">
        {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
      </div>
    </button>
  );
};