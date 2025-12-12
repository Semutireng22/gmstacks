import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AnimatedBackgroundProps {
  theme: 'dark' | 'light';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className={clsx(
      "fixed inset-0 -z-50 transition-colors duration-700 ease-in-out",
      isDark ? "bg-slate-950" : "bg-slate-50"
    )}>
      {/* Dynamic Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={clsx(
          "absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px]",
          isDark ? "bg-neon-purple/20" : "bg-blue-400/20"
        )}
      />

      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className={clsx(
          "absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px]",
          isDark ? "bg-neon-cyan/20" : "bg-purple-400/20"
        )}
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className={clsx(
          "absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full blur-[90px]",
          isDark ? "bg-neon-blue/20" : "bg-cyan-400/20"
        )}
      />

      {/* Noise Texture */}
      <div 
        className={clsx(
          "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]",
          "mix-blend-overlay transition-opacity duration-300",
          isDark ? "opacity-25 brightness-150 contrast-150" : "opacity-15"
        )}
      />

      {/* Grid Pattern */}
      <div 
        className={clsx(
          "absolute inset-0 transition-opacity duration-300",
          isDark ? "opacity-[0.03]" : "opacity-[0.02]"
        )}
        style={{
          backgroundImage: `linear-gradient(${isDark ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#fff' : '#000'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Radial fade for the grid */}
      <div className={clsx(
        "absolute inset-0 bg-gradient-to-t",
        isDark ? "from-slate-950 via-transparent to-transparent" : "from-slate-50 via-transparent to-transparent"
      )} />
    </div>
  );
};
