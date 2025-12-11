import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-bold transition-all duration-300 rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105 active:scale-95";
  
  const variants = {
    primary: "bg-blue-600/10 dark:bg-neon-blue/10 text-blue-600 dark:text-neon-cyan border border-blue-500/30 dark:border-neon-blue/50 hover:bg-blue-600/20 dark:hover:bg-neon-blue/20 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] dark:hover:shadow-[0_0_20px_rgba(0,102,255,0.5)] hover:border-blue-500 dark:hover:border-neon-cyan",
    secondary: "bg-slate-200/50 dark:bg-white/5 text-slate-700 dark:text-white border border-slate-300/50 dark:border-white/10 hover:bg-slate-300/50 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30",
    danger: "bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]",
    ghost: "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <>
          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
          <span className="relative flex items-center gap-2">{children}</span>
        </>
      )}
    </button>
  );
};