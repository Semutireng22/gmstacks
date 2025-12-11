import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = false 
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        bg-white/60 dark:bg-slate-900/40 
        backdrop-blur-xl 
        border border-slate-200/60 dark:border-white/10 
        rounded-2xl shadow-xl
        text-slate-800 dark:text-slate-100
        ${hoverEffect 
          ? 'transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl dark:hover:border-neon-cyan/30 dark:hover:shadow-[0_0_25px_rgba(0,243,255,0.15)] hover:border-blue-400/30' 
          : ''}
        ${className}
      `}
    >
      {/* Decorative gradient glow/noise */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};