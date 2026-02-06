import { useState, useEffect } from 'react';
import { 
  User, 
  SkipBack, 
  Play, 
  Pause, 
  Skull,
  SkipForward 
} from 'lucide-react';
import { userAPI, spotifyAPI } from './api/api';
import './index.css';

export default function PlayerWindow() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('codequest_theme') || '#f2b43b';
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', themeColor);
    
    // Listen for theme changes from main window
    if (window.electronAPI?.onThemeChange) {
      window.electronAPI.onThemeChange((newColor) => {
        setThemeColor(newColor);
        localStorage.setItem('codequest_theme', newColor);
      });
    }
  }, []);

  // Update theme when it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', themeColor);
  }, [themeColor]);

  // Initial Data Load
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, authStatus, tierData] = await Promise.all([
        userAPI.getStats(),
        spotifyAPI.getAuthStatus(),
        spotifyAPI.getUserTier().catch(() => ({ is_premium: false }))
      ]);
      setStats(statsData);
      setUser(authStatus?.user);
      setIsPremium(tierData?.is_premium || false);
    } catch (error) {
      console.error('Error loading player window data:', error);
    }
  };

  const handlePlayPause = async () => {
    if (!isPremium) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    
    try {
      if (isPlaying) {
        await spotifyAPI.pause();
      } else {
        await spotifyAPI.play();
      }
      setIsPlaying(!isPlaying);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrevious = () => {
    if (!isPremium) {
      setShowTooltip(true);

      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    spotifyAPI.previous();
  };

  const handleNext = () => {
    if (!isPremium) {
      setShowTooltip(true);

      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    spotifyAPI.next();
  };

  return (
    <div className="h-screen w-screen bg-game-bg text-game-text flex items-center justify-between px-4 overflow-hidden select-none drag-region">
      
      {/* LEFT: Profile & Stats */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-md border-2 border-game-text bg-white flex items-center justify-center overflow-hidden">
            {user?.image ? (
              <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-game-text/40" />
            )}
          </div>
        </div>

        {/* Text Info */}
        <div className="flex flex-col">
          <span className="text-xs font-black pixel-text uppercase flex flex-col">
            <span className='text-[8px] text-game-text/40 -mb-0.5'>PLAYER</span>
            <span className='text-game-accent'>{user?.display_name || 'Hero'}</span>
          </span>
          
          {/* XP Bar */}
          <div className="w-24 mt-0">
             <div className="flex justify-between text-[8px] font-bold mb-0.5 opacity-60">
               <span>XP</span>
               <span>{stats?.xp || 0}/{stats?.xp_to_next_level || 50}</span>
             </div>
             <div className="h-2 w-full bg-game-text/10 rounded-full border border-game-text/20 overflow-hidden">
               <div 
                 className="h-full rounded-full bg-game-accent transition-all duration-500"
                 style={{ width: `${Math.min(((stats?.xp || 0) / (stats?.xp_to_next_level || 50)) * 100, 100)}%` }}
               />
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Player Controls */}
      <div className="flex items-center gap-2 no-drag relative">
        {/* Tooltip for Free users */}
        {showTooltip && !isPremium && (
          <div className="absolute -top-4 text-center uppercase right-0 bg-game-accent text-retro-black px-3 py-2 rounded-md text-[10px] font-bold border-2 border-game-text shadow-lg z-50">
            <span className='flex flex-col items-center '>
              <Skull />
              Apenas com Spotify Premium
            </span>
          </div>
        )}

        <button 
          className={`p-2 rounded-md border-2 transition-all ${
            isPremium 
              ? 'cursor-pointer text-game-text/50 hover:bg-game-text/10 border-game-text/20 bg-game-text/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]/50 hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'
              : 'cursor-not-allowed text-game-text/20 border-game-text/10 bg-game-text/5 opacity-50'
          }`}
          onClick={handlePrevious}
        >
          <SkipBack size={20} fill="currentColor" />
        </button>

        <button 
          onClick={handlePlayPause}
          className={`w-10 h-10 border-2 border-game-text rounded-md flex items-center justify-center transition-all ${
            isPremium
              ? 'cursor-pointer bg-game-accent text-game-text shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'
              : 'cursor-not-allowed bg-game-accent/30 text-game-text/30 opacity-50'
          }`}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>

        <button 
          className={`p-2 rounded-md border-2 transition-all ${
            isPremium 
              ? 'cursor-pointer text-game-text/50 hover:bg-game-text/10 border-game-text/20 bg-game-text/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]/50 hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'
              : 'cursor-not-allowed text-game-text/20 border-game-text/10 bg-game-text/5 opacity-50'
          }`}
          onClick={handleNext}
        >
          <SkipForward size={20} fill="currentColor" />
        </button>
      </div>

    </div>
  );
}
