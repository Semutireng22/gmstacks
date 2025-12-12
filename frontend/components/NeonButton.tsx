import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className,
  disabled,
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-bold transition-colors rounded-xl overflow-hidden backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: clsx(
      "bg-blue-500/10 dark:bg-neon-blue/10",
      "text-blue-600 dark:text-neon-cyan",
      "border border-blue-500/30 dark:border-neon-blue/50",
      "hover:bg-blue-500/20 dark:hover:bg-neon-blue/20",
      "hover:border-blue-500 dark:hover:border-neon-cyan",
      "shadow-[0_0_0_1px_rgba(59,130,246,0.1)] dark:shadow-[0_0_0_1px_rgba(0,102,255,0.1)]"
    ),
    secondary: clsx(
      "bg-slate-100/50 dark:bg-white/5",
      "text-slate-700 dark:text-white",
      "border border-slate-200/50 dark:border-white/10",
      "hover:bg-slate-200/50 dark:hover:bg-white/10",
      "hover:border-slate-300 dark:hover:border-white/30"
    ),
    danger: clsx(
      "bg-red-500/10",
      "text-red-600 dark:text-red-400",
      "border border-red-500/30",
      "hover:bg-red-500/20"
    ),
    ghost: clsx(
      "bg-transparent",
      "text-slate-500 dark:text-slate-400",
      "hover:text-slate-900 dark:hover:text-white"
    )
  };

  return (
    <motion.button 
      className={twMerge(baseStyles, variants[variant], className)}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin w-5 h-5" />
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {variant === 'primary' && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
          )}
          <span className="relative flex items-center gap-2">{children}</span>
        </>
      )}
    </motion.button>
  );
};