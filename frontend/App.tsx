import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './components/GlassCard';
import { NeonButton } from './components/NeonButton';
import { StatsGrid } from './components/StatsGrid';
import { ActivityFeed } from './components/ActivityFeed';
import { ThemeToggle } from './components/ThemeToggle';
import { AnimatedBackground } from './components/AnimatedBackground';
import { UserState, ActivityItem } from './types';
import { Hexagon, Wallet, LogOut, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import {
  connectWalletStacks,
  disconnectWalletStacks,
  fetchUserCheckin,
  callCheckin,
  getStoredStxAddress,
} from './stacksClient';
import { isConnected } from '@stacks/connect';
import confetti from 'canvas-confetti';

const INITIAL_STATE: UserState = {
  isConnected: false,
  address: null,
  lastCheckin: null,
  totalCheckins: 0,
  streak: 0,
};

type Theme = 'dark' | 'light';

function shortenAddress(addr: string, prefix = 6, suffix = 6): string {
  if (!addr) return '';
  if (addr.length <= prefix + suffix) return addr;
  return `${addr.slice(0, prefix)}...${addr.slice(-suffix)}`;
}

function formatCountdown(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(r)}`;
}

export default function App() {
  const [user, setUser] = useState<UserState>(INITIAL_STATE);
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [lastOnchainTime, setLastOnchainTime] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  // --- Theme Management ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(newTheme);
      return newTheme;
    });
  }, []);

  // --- Auto-connect on reload ---
  useEffect(() => {
    async function autoConnect() {
      try {
        if (!isConnected()) return;
        const stored = getStoredStxAddress();
        if (!stored) return;

        const onchain = await fetchUserCheckin(stored);

        let lastCheckinStr: string | null = null;
        if (onchain.lastTime !== null) {
          const d = new Date(onchain.lastTime * 1000);
          lastCheckinStr = `${d.toLocaleDateString()}, ${d.toLocaleTimeString()}`;
        }

        setLastOnchainTime(onchain.lastTime);

        setUser({
          isConnected: true,
          address: stored,
          lastCheckin: lastCheckinStr,
          totalCheckins: onchain.total,
          streak: onchain.streak,
        });

        addActivity('connect');
      } catch (e) {
        console.error('autoConnect failed', e);
      }
    }

    autoConnect();
  }, []);

  // --- Weekly goal derived from streak ---
  const weeklyGoal = 7;
  const weeklyProgress = user.isConnected ? Math.min(user.streak, weeklyGoal) : 0;
  const weeklyPercent = (weeklyProgress / weeklyGoal) * 100;

  // --- Can user check-in now? ---
  const canCheckin = (() => {
    if (!user.isConnected) return false;
    if (lastOnchainTime === null) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    const diff = nowSec - lastOnchainTime;
    return diff >= 86400;
  })();

  // --- Countdown updater ---
  useEffect(() => {
    if (lastOnchainTime === null) {
      setRemainingSec(null);
      return;
    }

    const update = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const diff = lastOnchainTime + 86400 - nowSec;
      setRemainingSec(diff > 0 ? diff : 0);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastOnchainTime]);

  // --- Activity helper ---
  const addActivity = (type: ActivityItem['type'], txHash?: string) => {
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      timestamp: new Date().toLocaleTimeString(),
      txHash: txHash && type === 'check-in' ? txHash : undefined,
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // --- Handlers: Web3 logic ---
  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setErrorMsg(null);
      const stxAddress = await connectWalletStacks();
      const onchain = await fetchUserCheckin(stxAddress);

      let lastCheckinStr: string | null = null;
      if (onchain.lastTime !== null) {
        const d = new Date(onchain.lastTime * 1000);
        lastCheckinStr = `${d.toLocaleDateString()}, ${d.toLocaleTimeString()}`;
      }

      setLastOnchainTime(onchain.lastTime);
      setUser({
        isConnected: true,
        address: stxAddress,
        lastCheckin: lastCheckinStr,
        totalCheckins: onchain.total,
        streak: onchain.streak,
      });

      addActivity('connect');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect wallet.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWalletStacks();
    setUser(INITIAL_STATE);
    setActivities([]);
    setErrorMsg(null);
    setLastOnchainTime(null);
    setRemainingSec(null);
  }, []);

  const handleCheckin = useCallback(async () => {
    if (!user.isConnected || !user.address) {
      setErrorMsg('Please connect your Stacks wallet first.');
      return;
    }
    if (loadingCheckin || !canCheckin) return;

    try {
      setLoadingCheckin(true);
      setErrorMsg(null);

      const tx = await callCheckin();
      const txId = (tx as any).txid || (tx as any).txId;

      if (!txId) {
        setErrorMsg('Check-in failed or was rejected.');
        return;
      }

      // Optimistic update
      addActivity('check-in', txId);
      
      // TRIGGER CONFETTI
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f3ff', '#b026ff', '#0066ff']
      });

      const onchain = await fetchUserCheckin(user.address);
      let lastCheckinStr: string | null = null;
      if (onchain.lastTime !== null) {
        const d = new Date(onchain.lastTime * 1000);
        lastCheckinStr = `${d.toLocaleDateString()}, ${d.toLocaleTimeString()}`;
      }

      setLastOnchainTime(onchain.lastTime);
      setUser(prev => ({
        ...prev,
        totalCheckins: onchain.total,
        lastCheckin: lastCheckinStr,
        streak: onchain.streak,
      }));

    } catch (err) {
      console.error(err);
      setErrorMsg('Check-in transaction failed.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoadingCheckin(false);
    }
  }, [user.isConnected, user.address, loadingCheckin, canCheckin]);

  return (
    <div className={`min-h-screen relative overflow-x-hidden pb-20 transition-colors duration-300 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
      <AnimatedBackground theme={theme} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative group">
                <div className={`absolute inset-0 blur-lg opacity-50 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'bg-neon-purple' : 'bg-blue-400'}`}></div>
                <Hexagon className={`relative w-8 h-8 ${theme === 'dark' ? 'text-white fill-neon-purple/20' : 'text-blue-600 fill-blue-100'}`} strokeWidth={1.5} />
              </div>
              <span className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                gm<span className={theme === 'dark' ? 'text-neon-cyan' : 'text-blue-500'}>stacks</span>
              </span>
            </motion.div>

            <div className="flex items-center gap-4">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

              <AnimatePresence mode='wait'>
                {user.isConnected ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-4"
                    key="connected"
                  >
                    <div className="hidden md:flex flex-col items-end mr-2">
                       <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Connected</span>
                       <span className={`font-mono text-sm ${theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'}`}>{shortenAddress(user.address!)}</span>
                    </div>
                    <NeonButton variant="secondary" onClick={handleDisconnect} className="!px-4 !py-2">
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect
                    </NeonButton>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key="connect-button"
                  >
                    <NeonButton onClick={handleConnect} isLoading={isConnecting}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </NeonButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-2xl text-transparent bg-clip-text ${theme === 'dark' ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400' : 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500'}`}>
              Daily On-Chain <br />
              <span className={`text-transparent bg-clip-text ${theme === 'dark' ? 'bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan' : 'bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-500'}`}>
                Check-In Ritual
              </span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Prove your consistency on the Stacks blockchain. Build your streak, earn reputation, and secure your place in the future of Bitcoin layers.
            </p>
          </motion.div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-200 rounded-xl shadow-lg z-50 backdrop-blur-md"
              >
                <AlertCircle className="w-5 h-5" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <StatsGrid user={user} isLoading={isConnecting} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Action Card */}
          <div className="lg:col-span-7 space-y-8">
            <GlassCard className="p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 dark:from-neon-blue/5 to-transparent pointer-events-none"></div>
               
               <div className="relative z-10 space-y-10 max-w-lg w-full">
                  <div>
                    <h2 className={`text-3xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      Ready to Check-in?
                    </h2>
                    <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                      Record your daily activity on-chain. Reset happens every 24h.
                    </p>
                  </div>

                  <div className="relative">
                    {user.isConnected ? (
                      <motion.button
                        whileHover={canCheckin && !loadingCheckin ? { scale: 1.02, translateY: -2 } : {}}
                        whileTap={canCheckin && !loadingCheckin ? { scale: 0.98 } : {}}
                        onClick={handleCheckin}
                        disabled={loadingCheckin || !canCheckin}
                        className={`
                          relative w-full h-28 rounded-3xl flex items-center justify-center gap-4 text-2xl font-bold tracking-wide transition-all duration-300 overflow-hidden
                          ${loadingCheckin || !canCheckin
                            ? 'bg-slate-200/50 dark:bg-slate-800/50 cursor-not-allowed text-slate-400 border border-white/5'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-neon-blue dark:to-neon-purple text-white shadow-xl hover:shadow-[0_0_50px_rgba(0,102,255,0.4)] border border-white/20'
                          }
                        `}
                      >
                        {loadingCheckin ? (
                          <div className="flex flex-col items-center animate-pulse">
                            <span>Broadcasting...</span>
                            <span className="text-xs opacity-70 font-normal mt-1 font-mono">Check Wallet</span>
                          </div>
                        ) : !canCheckin && remainingSec !== null ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-[0.3em] opacity-80 mb-2">Next available in</span>
                            <span className="text-3xl font-mono">{formatCountdown(remainingSec)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-[-10%] transition-transform duration-700 ease-out skew-y-12"></div>
                            <CheckCircle2 className="w-10 h-10" />
                            <span>CHECK-IN NOW</span>
                            <Sparkles className="w-6 h-6 animate-pulse text-yellow-300" />
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <div className="w-full h-28 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/5 text-slate-500 gap-3">
                         <Wallet className="w-8 h-8 opacity-50" />
                         <span>Connect wallet to enable check-in</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <span>Weekly Goal</span>
                      <span>{weeklyProgress} / {weeklyGoal} Days</span>
                    </div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${weeklyPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-neon-blue dark:to-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                      ></motion.div>
                    </div>
                  </div>
               </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-5">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}
