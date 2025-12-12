import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  hoverEffect = false,
  ...props 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={twMerge(clsx(
        "relative overflow-hidden",
        "bg-white/70 dark:bg-slate-900/40",
        "backdrop-blur-xl saturate-150",
        "border border-slate-200/50 dark:border-white/10",
        "rounded-2xl shadow-xl",
        "text-slate-800 dark:text-slate-100",
        hoverEffect && "cursor-pointer",
        className
      ))}
      whileHover={hoverEffect ? { 
        y: -5,
        scale: 1.01,
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)",
        borderColor: "rgba(0, 243, 255, 0.3)" 
      } : undefined}
      {...props}
    >
      {/* Decorative gradient glow/noise */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
      
      {/* Inner sheen */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />

      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};