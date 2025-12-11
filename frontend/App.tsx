import React, { useState, useCallback, useEffect } from 'react';
import { GlassCard } from './components/GlassCard';
import { NeonButton } from './components/NeonButton';
import { StatsGrid } from './components/StatsGrid';
import { ActivityFeed } from './components/ActivityFeed';
import { ThemeToggle } from './components/ThemeToggle';
import { UserState, ActivityItem } from './types';
import { Hexagon, Wallet, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  connectWalletStacks,
  disconnectWalletStacks,
  fetchUserCheckin,
  callCheckin,
  getStoredStxAddress,
} from './stacksClient';
import { isConnected } from '@stacks/connect';

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

  // --- Auto-connect on reload, if wallet session exists ---
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
          const timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateString = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
          lastCheckinStr = `${dateString}, ${timeString}`;
        }

        setLastOnchainTime(onchain.lastTime);

        setUser({
          isConnected: true,
          address: stored,
          lastCheckin: lastCheckinStr,
          totalCheckins: onchain.total,
          streak: onchain.streak,
        });

        setActivities(prev => [
          {
            id: 'auto-connect',
            type: 'connect',
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
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

  // --- Can user check-in now? (24h rule via on-chain lastTime) ---
  const canCheckin = (() => {
    if (!user.isConnected) return false;
    if (lastOnchainTime === null) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    const diff = nowSec - lastOnchainTime;
    return diff >= 86400;
  })();

  // --- Countdown updater based on lastOnchainTime ---
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
        const timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        lastCheckinStr = `${dateString}, ${timeString}`;
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
      setErrorMsg('Failed to connect wallet. Make sure a Stacks wallet extension is installed.');
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
      setTimeout(() => setErrorMsg(null), 3000);
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
        setTimeout(() => setErrorMsg(null), 4000);
        return;
      }

      addActivity('check-in', txId);

      const onchain = await fetchUserCheckin(user.address);

      let lastCheckinStr: string | null = null;
      if (onchain.lastTime !== null) {
        const d = new Date(onchain.lastTime * 1000);
        const timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        lastCheckinStr = `${dateString}, ${timeString}`;
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
      setErrorMsg('Check-in transaction failed or was rejected.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoadingCheckin(false);
    }
  }, [user.isConnected, user.address, loadingCheckin, canCheckin]);

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden pb-20 transition-colors duration-300 ${
        theme === 'light'
          ? 'text-slate-800'
          : 'text-slate-200 selection:bg-neon-cyan/30 selection:text-white'
      }`}
    >
      {/* Background Effects */}
      <div className="fixed inset-0 -z-50 transition-colors duration-500 bg-slate-50 dark:bg-neon-bg">
        <div
          className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-pulse-slow transition-opacity duration-500 
          ${
            theme === 'dark'
              ? 'bg-neon-purple/20 opacity-30'
              : 'bg-blue-400/15 opacity-40'
          }`}
        ></div>
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-pulse-slow transition-opacity duration-500
          ${
            theme === 'dark'
              ? 'bg-neon-cyan/10 opacity-30'
              : 'bg-purple-400/15 opacity-40'
          }`}
          style={{ animationDelay: '1.5s' }}
        ></div>
        <div
          className={`absolute top-[20%] right-[20%] w-[20vw] h-[20vw] rounded-full blur-[80px] transition-opacity duration-500
          ${
            theme === 'dark'
              ? 'bg-neon-blue/10 opacity-20'
              : 'bg-cyan-400/15 opacity-30'
          }`}
        ></div>

        <div
          className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay transition-opacity duration-300 ${
            theme === 'dark' ? 'opacity-20 brightness-150 contrast-150' : 'opacity-10'
          }`}
        ></div>
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            theme === 'dark' ? 'opacity-10' : 'opacity-[0.02]'
          }`}
          style={{
            backgroundImage: `linear-gradient(${
              theme === 'dark' ? '#4f4f4f' : '#000'
            } 1px, transparent 1px), linear-gradient(90deg, ${
              theme === 'dark' ? '#4f4f4f' : '#000'
            } 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-black/50 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`absolute inset-0 blur-lg opacity-50 ${
                    theme === 'dark' ? 'bg-neon-purple' : 'bg-blue-400'
                  }`}
                ></div>
                <Hexagon
                  className={`relative w-8 h-8 ${
                    theme === 'dark'
                      ? 'text-white fill-neon-purple/20'
                      : 'text-blue-600 fill-blue-100'
                  }`}
                  strokeWidth={1.5}
                />
              </div>
              <span
                className={`text-2xl font-bold tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                gm
                <span
                  className={
                    theme === 'dark' ? 'text-neon-cyan' : 'text-blue-500'
                  }
                >
                  stacks
                </span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

              {user.isConnected ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Connected as
                    </span>
                    <span
                      className={`font-mono text-sm ${
                        theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'
                      }`}
                    >
                      {shortenAddress(user.address!)}
                    </span>
                  </div>
                  <NeonButton
                    variant="secondary"
                    onClick={handleDisconnect}
                    className="!px-4 !py-2"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </NeonButton>
                </div>
              ) : (
                <NeonButton onClick={handleConnect} isLoading={isConnecting}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </NeonButton>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 relative">
          <h1
            className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-2xl text-transparent bg-clip-text 
            ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-white via-slate-200 to-slate-400'
                : 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500'
            }`}
          >
            Daily On-Chain <br />
            <span
              className={`text-transparent bg-clip-text ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan'
                  : 'bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-500'
              }`}
            >
              Check-In Ritual
            </span>
          </h1>
          <p
            className={`text-lg max-w-2xl mx-auto leading-relaxed ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Prove your consistency on the Stacks blockchain. Build your streak, earn reputation, and
            secure your place in the future of Bitcoin layers.
          </p>

          {errorMsg && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 flex items-center gap-2 px-4 py-2
                            bg-red-50 dark:bg-red-500/10
                            border border-red-300 dark:border-red-500/50
                            text-red-700 dark:text-red-200
                            rounded-lg shadow-md z-50">
              <AlertCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
        </div>

        <StatsGrid user={user} isLoading={isConnecting} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <GlassCard className="p-8 md:p-12 flex flex-col items-center justify-center text-center relative border-t border-white/20 dark:border-white/10">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 dark:from-neon-blue/5 to-transparent pointer-events-none"></div>

              <div className="relative z-10 space-y-8 max-w-lg w-full">
                <div>
                  <h2
                    className={`text-3xl font-bold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    Ready to Check-in?
                  </h2>
                  <p
                    className={
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }
                  >
                    Record your daily activity on-chain. Reset happens every 24h.
                  </p>
                </div>

                <div className="py-8">
                  {user.isConnected ? (
                    <>
                      <button
                        onClick={handleCheckin}
                        disabled={loadingCheckin || !canCheckin}
                        className={`
                          group relative w-full h-24 rounded-2xl flex items-center justify-center gap-4 text-2xl font-bold tracking-wide transition-all duration-500
                          ${
                            loadingCheckin || !canCheckin
                              ? 'bg-slate-200/50 dark:bg-slate-800/50 cursor-not-allowed text-slate-400 border border-white/5'
                              : 'bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-neon-blue/20 dark:to-neon-purple/20 hover:from-blue-200/50 hover:to-purple-200/50 dark:hover:from-neon-blue/30 dark:hover:to-neon-purple/30 border border-blue-200 dark:border-neon-blue/30 hover:border-blue-400 dark:hover:border-neon-cyan hover:shadow-[0_0_40px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_40px_rgba(0,102,255,0.3)] hover:-translate-y-1'
                          }
                        `}
                      >
                        {loadingCheckin ? (
                          <>
                            <div className="absolute inset-0 rounded-2xl overflow-hidden">
                              <div className="h-full bg-white/20 w-1/2 animate-[shimmer_1s_infinite] skew-x-12 translate-x-[-150%]"></div>
                            </div>
                            <span className="animate-pulse flex flex-col items-center">
                              Broadcasting...
                              <span className="text-xs font-mono font-normal opacity-70 mt-1">
                                Confirm in Wallet
                              </span>
                            </span>
                          </>
                        ) : !canCheckin && remainingSec !== null ? (
                          <>
                            <div
                              className={`absolute inset-0 blur-xl opacity-50 rounded-2xl ${
                                theme === 'dark'
                                  ? 'bg-slate-900/60'
                                  : 'bg-slate-300/70'
                              }`}
                            ></div>
                            <div className="relative flex flex-col items-center">
                              <span
                                className={`text-xs font-mono uppercase tracking-[0.25em] mb-1 ${
                                  theme === 'dark'
                                    ? 'text-slate-400'
                                    : 'text-slate-600'
                                }`}
                              >
                                Next check-in in
                              </span>
                              <span
                                className={`text-2xl font-semibold ${
                                  theme === 'dark'
                                    ? 'text-slate-100'
                                    : 'text-slate-800'
                                }`}
                              >
                                {formatCountdown(remainingSec)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl ${
                                theme === 'dark'
                                  ? 'bg-neon-blue/20'
                                  : 'bg-blue-400/20'
                              }`}
                            ></div>
                            <CheckCircle2
                              className={`w-8 h-8 group-hover:scale-110 transition-transform duration-300 ${
                                theme === 'dark'
                                  ? 'text-neon-cyan'
                                  : 'text-blue-600'
                              }`}
                            />
                            <span
                              className={`${
                                theme === 'dark'
                                  ? 'text-white'
                                  : 'text-slate-800'
                              } group-hover:text-blue-600 dark:group-hover:text-white transition-colors`}
                            >
                              CHECK-IN TODAY
                            </span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-24 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-black/5 dark:bg-black/20">
                      <p className="text-slate-500 flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Connect wallet to enable check-in
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs uppercase tracking-wider text-slate-500">
                    <span>Weekly Goal</span>
                    <span>{`${weeklyProgress}/${weeklyGoal} Days`}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-neon-blue dark:to-neon-cyan transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                      style={{ width: `${weeklyPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-5 h-full">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </main>
    </div>
  );
}
