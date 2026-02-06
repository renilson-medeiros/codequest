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
import Tooltip from './components/Tooltip';
import './index.css';

export default function PlayerWindow() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
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
    if (!isPremium) return;
    
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
    if (!isPremium) return;
    spotifyAPI.previous();
  };

  const handleNext = () => {
    if (!isPremium) return;
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
        <Tooltip 
          content={!isPremium ? (
            <span className='flex items-center gap-1'>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-spotify" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288"/>
              </svg>
              PREMIUM_ONLY
            </span>
          ) : ''}
          side="left"
        >
          <div className="flex gap-2">
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
                  : 'cursor-not-allowed bg-game-accent/30 text-game-text/30 opacity-30'
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
        </Tooltip>
      </div>

    </div>
  );
}
