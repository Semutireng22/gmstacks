import React from 'react';
import { ActivityItem } from '../types';
import { GlassCard } from './GlassCard';
import { Activity, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <GlassCard className="h-full min-h-[400px] flex flex-col">
      <div className="p-6 border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500 dark:text-neon-cyan" />
          Live Activity
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-slate-500 font-mono font-bold tracking-wider">LIVE</span>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false} mode='popLayout'>
          {activities.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-10"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <Activity className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">No recent activity found</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activities.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="group relative overflow-hidden"
                >
                  <div className={`
                    absolute left-0 top-0 bottom-0 w-1
                    ${item.type === 'check-in' ? 'bg-green-500 dark:bg-neon-cyan' : ''}
                    ${item.type === 'connect' ? 'bg-blue-500 dark:bg-neon-purple' : ''}
                    ${item.type === 'streak-bonus' ? 'bg-amber-500' : ''}
                  `} />
                  
                  <div className="ml-1 p-4 rounded-r-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-slate-200/50 dark:border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-bold
                        ${item.type === 'check-in' ? 'text-green-600 dark:text-neon-cyan' : ''}
                        ${item.type === 'connect' ? 'text-blue-600 dark:text-neon-purple' : ''}
                        ${item.type === 'streak-bonus' ? 'text-amber-600 dark:text-yellow-400' : ''}
                      `}>
                        {item.type === 'check-in' && 'Success Check-in'}
                        {item.type === 'connect' && 'Wallet Connected'}
                        {item.type === 'streak-bonus' && 'Streak Bonus Unlocked!'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{item.timestamp}</span>
                    </div>

                    {item.txHash && (
                      <a 
                        href={`https://explorer.hiro.so/txid/${item.txHash}?chain=mainnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-500 dark:hover:text-neon-blue transition-colors w-fit group/link"
                      >
                        <span className="font-mono opacity-70">View TX</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
};