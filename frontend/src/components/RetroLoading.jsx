import { Terminal, Shield, Cpu, Activity } from 'lucide-react';
import { useState, useEffect } from 'react'; // Added useState and useEffect
import t from '../utils/i18n';

export default function RetroLoading() {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  
    const sequence = [
      { text: `> ${t('BOOT_SEQUENCE')}`, delay: 0 },
      { text: `> ${t('INITIALIZING_KERNEL')}`, delay: 200 },
      { text: "> Loading System Config...", delay: 400 },
      { text: `> ${t('SYNCING_INTEL')}`, delay: 700 },
      { text: `> ${t('LOADING_ASSETS')}`, delay: 1000 },
      { text: "> Neural Link: STABLE", delay: 1300 },
      { text: `> ${t('READY')}`, delay: 1600 },
    ];

  useEffect(() => {
    // Progress Bar
    const progInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 20);

    // Logs
    sequence.forEach((msg, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, msg.text]);
      }, msg.delay);
    });

    return () => clearInterval(progInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-9999 bg-game-bg flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* LOGO AREA */}
        <div className="mb-8 animate-pulse text-game-accent">
          <Shield size={64} strokeWidth={1} />
        </div>

        {/* LOGS TERMINAL */}
        <div className="w-full bg-game-text text-game-bg p-4 rounded-md border-2 border-game-text shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] mb-6 font-mono h-32 overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 bg-game-text text-game-bg px-1.5 py-0.5 rounded-xs">
                <Terminal size={10} />
                <span className="text-[7px] font-black pixel-text uppercase tracking-widest">{t('BOOTING')}</span>
              </div>
              <div className="text-[7px] font-black opacity-30 pixel-text animate-pulse">{t('SYSTEM_STABLE')}</div>
            </div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <p key={i} className="text-[7px] font-bold leading-none animate-in fade-in slide-in-from-left-1">{log}</p>
            ))}
          </div>
        </div>

        {/* PROGRESS AREA */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black pixel-text text-game-text/40 tracking-[0.2em]">LOADING...</span>
            <span className="text-[9px] font-black pixel-text text-game-accent italic">{progress}%</span>
          </div>
          <div className="h-4 bg-game-text/5 border-2 border-game-text p-0.5 rounded-sm overflow-hidden">
            <div 
              className="h-full bg-game-accent transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* FOOTER SPECS */}
        <div className="mt-12 flex gap-8 items-center opacity-20">
           <Cpu size={16} className="text-game-text" />
           <Activity size={16} className="text-game-text" />
           <span className="text-[7px] font-black tracking-widest uppercase">CQ_OS_2026</span>
        </div>
      </div>
      
      {/* SCANLINE EFFECT */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10000 bg-size-[100%_4px,3px_100%]" />
    </div>
  );
}
