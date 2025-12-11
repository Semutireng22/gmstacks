import React from 'react';
import { GlassCard } from './GlassCard';
import { UserState } from '../types';
import { Skeleton } from './Skeleton';
import { Calendar, Flame, Trophy } from 'lucide-react';

interface StatsGridProps {
  user: UserState;
  isLoading?: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ user, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Check-ins */}
      <GlassCard hoverEffect className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-neon-blue/10 text-blue-600 dark:text-neon-blue shadow-lg dark:shadow-[0_0_15px_rgba(0,102,255,0.2)]">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Check-ins</p>
          <div className="mt-1">
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">
                {user.isConnected ? user.totalCheckins : '-'}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Current Streak */}
      <GlassCard hoverEffect className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-purple-100 dark:bg-neon-purple/10 text-purple-600 dark:text-neon-purple shadow-lg dark:shadow-[0_0_15px_rgba(176,38,255,0.2)]">
          <Flame className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Current Streak</p>
          <div className="mt-1">
             {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold font-mono">
                {user.isConnected ? (
                    <span className={user.streak > 0 ? 'text-purple-600 dark:text-neon-purple dark:drop-shadow-[0_0_5px_rgba(176,38,255,0.5)]' : ''}>
                        {user.streak} <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">days</span>
                    </span>
                ) : '-'}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Last Check-in */}
      <GlassCard hoverEffect className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-cyan-100 dark:bg-neon-cyan/10 text-cyan-600 dark:text-neon-cyan shadow-lg dark:shadow-[0_0_15px_rgba(0,243,255,0.2)]">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Last Check-in</p>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <div className="text-sm font-bold font-mono truncate">
                {user.isConnected ? (user.lastCheckin || 'Never') : 'Not Connected'}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};