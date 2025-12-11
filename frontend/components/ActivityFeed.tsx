import React from 'react';
import { ActivityItem } from '../types';
import { GlassCard } from './GlassCard';
import { Activity, CheckCircle, Wifi } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <GlassCard className="h-full min-h-[300px] flex flex-col">
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-cyan" />
          Recent Activity
        </h3>
        <span className="text-xs text-slate-500 font-mono">LIVE FEED</span>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Activity className="w-6 h-6 opacity-30" />
            </div>
            <p className="text-sm">No recent activity found.</p>
          </div>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className={`
                mt-1 w-2 h-2 rounded-full shadow-[0_0_8px]
                ${item.type === 'check-in' ? 'bg-neon-cyan shadow-neon-cyan' : ''}
                ${item.type === 'connect' ? 'bg-neon-purple shadow-neon-purple' : ''}
                ${item.type === 'streak-bonus' ? 'bg-yellow-400 shadow-yellow-400' : ''}
              `} />
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-slate-200">
                    {item.type === 'check-in' && 'Daily Check-in Success'}
                    {item.type === 'connect' && 'Wallet Connected'}
                    {item.type === 'streak-bonus' && '7-Day Streak Bonus!'}
                  </p>
                  <span className="text-xs text-slate-500 font-mono">{item.timestamp}</span>
                </div>
                {item.txHash && (
                  <a href="#" className="text-xs text-neon-blue hover:text-neon-cyan transition-colors font-mono mt-1 inline-block truncate max-w-[200px]">
                    Tx: {item.txHash}
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};