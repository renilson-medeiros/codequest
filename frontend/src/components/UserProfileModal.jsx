import React, { useState } from 'react';
import { X, Trophy, Star, Shield, Zap, User, Gift, ChevronLeft, ChevronRight, Info, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from './Tooltip';
import { spotifyAPI } from '../api/api';

export default function UserProfileModal({ isOpen, onClose, stats, user, theme, setTheme }) {
  if (!isOpen) return null;

  const themes = [
    { id: 'green', name: 'Green', color: '#26A685' },
    { id: 'amber', name: 'Amber', color: '#FFB000' },
    { id: 'cyan', name: 'Cyan', color: '#22D1D1' },
    { id: 'orange', name: 'Orange', color: '#FC5D47' },
    { id: 'lilac', name: 'Lilac', color: '#AE8CFD' },
    { id: 'red', name: 'Red', color: '#ED2220' },
    { id: 'blue', name: 'Blue', color: '#3B63B8' },
    { id: 'pink', name: 'Pink', color: '#ED218D' },
    { id: 'purple', name: 'Purple', color: '#7164BC' },
    { id: 'gray', name: 'Gray', color: '#A6A390' },
    { id: 'sand', name: 'Sand', color: '#DFC66A' },
    { id: 'lavender', name: 'Gray Lavender', color: '#696775' },
  ];

  const [startIndex, setStartIndex] = useState(0);
  const ITEMS_PER_PAGE = 4;

  const nextSlide = () => {
    setStartIndex((prev) => 
      prev + ITEMS_PER_PAGE >= themes.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setStartIndex((prev) => 
      prev === 0 ? Math.max(0, themes.length - ITEMS_PER_PAGE) : prev - 1
    );
  };

  const visibleThemes = themes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // calcular número total de músicas
  const totalSongs = stats?.total_songs_played || 0;

  const calculateProgress = () => {
    if (!stats) return 0;
    return (stats.xp / stats.xp_to_next_level) * 100;
  };

  const handleLogout = async () => {
    try {
      await spotifyAPI.logout();
      window.location.reload(); // Reload to trigger auth check and return to login
    } catch (error) {
      console.error('Logout error:', error);
    }
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

          {/* <button
            onClick={() => {}}
            className="absolute top-2 left-2 text-game-accent hover:bg-game-text/10 p-1 rounded transition-colors opacity-50 cursor-not-allowed"
          >
            <Gift size={20} />
          </button> */}

          <div className="flex flex-col items-center gap-2">
            
            {/* 1. Avatar + Level */}
            <div className="relative mt-2">
              <div className="w-18 h-18 rounded-lg border-2 border-game-text bg-white flex items-center justify-center overflow-hidden">
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
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-game-accent text-game-text text-xs rounded-full w-5 h-5 flex items-center justify-center font-black border-2 border-game-text"
              >
                {stats?.level || 1}
              </div>
            </div>

            {/* 2. Name + Tier */}
            <div className="text-center w-full">
              <h2 className="text-md font-black text-game-text pixel-text uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                {user?.display_name || 'Hero'}
              </h2>
              <div className="inline-block px-3 py-1.5 rounded-md border border-game-text/5 bg-game-text/5">
                <span className="text-[8px] cursor-pointer items-center font-bold uppercase tracking-widest text-game-text/30">
                  <Tooltip side='bottom' content="Apenas Usuários Premium conseguem utilizar os botões de mídia. Isso é regra do Spotify.">
                    {user?.product || 'Spotify Free'}
                  </Tooltip>
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
                     {totalSongs}
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
                
                <div className="flex items-center gap-1 w-full justify-between">
                  <button 
                    onClick={prevSlide}
                    className="cursor-pointer p-1 rounded bg-game-text hover:bg-game-text/10 text-game-bg hover:text-game-text transition-colors"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  
                  <div className="flex gap-1.5 py-1 overflow-hidden">
                    {visibleThemes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.color)}
                        className={`
                          w-12 h-8 rounded-md border-game-text border-2 cursor-pointer transition-transform hover:translate-y-0.5 shrink-0
                          ${theme === t.color ? 'border-game-text bg-game-text shadow-[0px_1px_0px_0px_rgba(0,0,0,1)]' : 'border-game-text/20 bg-transparent'}
                        `}
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      />
                    ))}
                  </div>

                  <button 
                    onClick={nextSlide}
                    className="cursor-pointer p-1 rounded bg-game-text hover:bg-game-text/10 text-game-bg hover:text-game-text transition-colors"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* 6. Logout Button */}
            <div className="w-full pt-2 mt-1">
              <button
                onClick={handleLogout}
                className="w-full py-2 flex items-center justify-center gap-2 bg-retro-red/10 border-2 border-retro-red text-retro-red font-black pixel-text uppercase text-[10px] rounded-md hover:bg-retro-red hover:text-white transition-all shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                <LogOut size={12} />
                LOGOFF
              </button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
