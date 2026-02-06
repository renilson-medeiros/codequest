import React from 'react';
import { X, Trophy, Star, Shield, Zap, User, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import t from '../utils/i18n';

export default function UserProfileModal({ isOpen, onClose, stats, user, theme, setTheme }) {
  if (!isOpen) return null;

  const themes = [
    { id: 'classic', name: 'Classic Green', color: '#00ff00' },
    { id: 'amber', name: 'Retro Amber', color: '#ffb000' },
    { id: 'cyan', name: 'Cyber Cyan', color: '#00ffff' },
    { id: 'purple', name: 'Neon Purple', color: '#d300c5' },
    { id: 'red', name: 'Alert Red', color: '#ff0000' }
  ];

  const calculateProgress = () => {
    if (!stats) return 0;
    return (stats.xp / stats.xp_to_next_level) * 100;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-game-text/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="quest-window border-2 rounded-lg border-game-text w-full max-w-xs relative shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-game-text hover:bg-game-text/10 p-1 rounded transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <button
            onClick={() => {}}
            className="absolute top-2 left-2 text-game-accent hover:bg-game-text/10 p-1 rounded transition-colors opacity-50 cursor-not-allowed"
          >
            <Gift size={20} />
          </button>

          <div className="flex flex-col items-center gap-2">
            
            {/* 1. Avatar + Level */}
            <div className="relative mt-2">
              <div className="w-18 h-18 rounded-full border-4 border-game-text bg-white flex items-center justify-center overflow-hidden">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-game-text/40" />
                )}
              </div>
              {/* Level Badge */}
              <div 
                className="absolute bottom-0 right-0 bg-game-accent text-game-text text-xs rounded-full w-5 h-5 flex items-center justify-center font-black border-2 border-game-text"
              >
                {stats?.level || 1}
              </div>
            </div>

            {/* 2. Name + Tier */}
            <div className="text-center w-full">
              <h2 className="text-md font-black text-game-text pixel-text uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                {user?.display_name || 'Hero'}
              </h2>
              <div className="inline-block px-2 pb-0.5 rounded-md border-2 border-game-text/5 bg-game-text/5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-game-text/30">
                  {user?.product || 'Spotify Free'}
                </span>
              </div>
            </div>

            {/* 3. XP Bar */}
            <div className="w-full">
              <div className="flex justify-between px-1 items-end mb-0.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-game-text/50">XP</span>
                <span className="text-[8px] font-black text-game-text/50">
                  {stats?.xp || 0} / {stats?.xp_to_next_level || 50}
                </span>
              </div>
              <div className="h-4 rounded-full border-2 border-game-text bg-game-text/10 relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full rounded-full bg-game-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* 4. Stats */}
            <div className="flex items-center justify-between w-full gap-4 pt-2">
               <div className="flex rounded-md flex-col items-center flex-1 border-2 border-game-text bg-game-text/5 p-2 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xl font-black pixel-text text-game-text leading-none mb-1">
                    {stats?.quests_completed || 0}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-game-text/50">
                    Quests
                  </span>
               </div>
               
               <div className="flex rounded-md flex-col items-center flex-1 border-2 border-game-text bg-game-text/5 p-2 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xl font-black pixel-text text-game-text leading-none mb-1">
                     {stats?.total_songs_played || 0}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-game-text/50">
                    Tracks
                  </span>
               </div>
            </div>

            {/* 5. Theme Selector */}
            <div className="w-full pt-2 border-t-2 border-game-text/10 mt-1">
              <div className="flex flex-col gap-2 justify-between items-start px-1">
                <span className="text-[8px] font-bold uppercase tracking-widest text-game-text/40">THEME</span>
                <div className="flex gap-1.5">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.color)}
                      className={`
                        w-12 h-8 rounded-md border-game-text border-2 cursor-pointer transition-transform hover:scale-105
                        ${theme === t.color ? 'border-game-text bg-game-text shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'border-game-text/20 bg-transparent'}
                      `}
                      style={{ backgroundColor: theme === t.color ? t.color : t.color }}
                      title={t.name}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
