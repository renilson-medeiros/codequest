import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward
} from 'lucide-react';
import { userAPI, spotifyAPI } from './api/api';
import Tooltip from './components/Tooltip';
import { initSpotifyPlayer } from './utils/SpotifyPlayer';
import AudioUnlockModal from './components/AudioUnlockModal';
import './index.css';

export default function PlayerWindow() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const playerRef = useRef(null);
  const initializationAttempted = useRef(false);
  
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('codequest_theme') || '#f2b43b';
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', themeColor);
    if (window.electronAPI?.onThemeChange) {
      window.electronAPI.onThemeChange((newColor) => {
        setThemeColor(newColor);
        localStorage.setItem('codequest_theme', newColor);
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', themeColor);
  }, [themeColor]);

  // Initial Data Load
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000); 
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, authStatus, tierData, currentPlayback] = await Promise.all([
        userAPI.getStats(),
        spotifyAPI.getAuthStatus(),
        spotifyAPI.getUserTier().catch(() => ({ is_premium: false })),
        spotifyAPI.getCurrentTrack().catch(() => null)
      ]);
      
      setStats(statsData);
      setUser(authStatus?.user);
      const premium = tierData?.is_premium || false;
      setIsPremium(premium);
      
      // Sync playing state from backend fallback
      if (currentPlayback && currentPlayback.track) {
        setIsPlaying(currentPlayback.track.is_playing);
      }

      if (authStatus?.access_token) {
        localStorage.setItem('spotify_access_token', authStatus.access_token);
        
        // Show modal if premium and not yet unlocked
        if (premium && !audioUnlocked) {
          setShowUnlockModal(true);
        }

        // Initialize Player if Premium and not already done
        if (premium && !initializationAttempted.current) {
          initializationAttempted.current = true;
          initPlayer(authStatus.access_token);
        }
      }
    } catch (error) {
      console.error('CodeQuest: Erro no loadData:', error);
    }
  };

  const initPlayer = (token) => {
    console.log("CodeQuest: Iniciando inicialização do Player...");
    initSpotifyPlayer(
      token,
      (id) => {
        console.log("CodeQuest: SDK READY! ID:", id);
        setDeviceId(id);
        setIsPlayerReady(true);
        
        // Auto-transfer whenever ready
        spotifyAPI.transferPlayback(id)
          .then(res => {
             console.log("CodeQuest: Transferência automática:", res.success);
          })
          .catch(err => console.error("CodeQuest: Erro na transferência:", err));
      },
      (state) => {
        if (state) {
          setIsPlaying(!state.paused);
        }
      }
    ).then(player => {
      playerRef.current = player;
    }).catch(err => {
      console.error("CodeQuest: Erro ao carregar player:", err);
      initializationAttempted.current = false; // Allow retry on next loadData
    });
  };

  const handleUnlockAudio = async () => {
    setAudioUnlocked(true);
    setShowUnlockModal(false);
    
    if (playerRef.current) {
      try {
        console.log("CodeQuest: Ativando elemento de áudio via gesto do usuário...");
        await playerRef.current.activateElement();
        // Force a playback command to kick the sound
        setTimeout(() => spotifyAPI.play(), 500);
      } catch (e) {
        console.error("CodeQuest: Falha ao ativar áudio:", e);
      }
    } else {
      console.warn("CodeQuest: Player ainda não carregado no momento do clique.");
      // If player wasn't ready, loadData will try to init it anyway
    }
  };

  // DEBOUNCED CONTROLS
  const handlePlayPause = async (e) => {
    e?.stopPropagation();
    if (!isPremium || isActionLoading) return;
    
    setIsActionLoading(true);
    try {
      if (playerRef.current) {
        await playerRef.current.togglePlay();
      } else {
        isPlaying ? await spotifyAPI.pause() : await spotifyAPI.play();
      }
      setTimeout(loadData, 500);
    } catch (e) {
      console.error("Play/Pause error:", e);
    } finally {
      setTimeout(() => setIsActionLoading(false), 800);
    }
  };

  const handlePrevious = async (e) => {
    e?.stopPropagation();
    if (!isPremium || isActionLoading) return;
    
    setIsActionLoading(true);
    try {
      if (playerRef.current) {
        await playerRef.current.previousTrack();
      } else {
        await spotifyAPI.previous();
      }
      setTimeout(loadData, 800);
    } catch (e) {
      console.error("Prev error:", e);
    } finally {
      setTimeout(() => setIsActionLoading(false), 1200);
    }
  };

  const handleNext = async (e) => {
    e?.stopPropagation();
    if (!isPremium || isActionLoading) return;
    
    setIsActionLoading(true);
    try {
      if (playerRef.current) {
        await playerRef.current.nextTrack();
      } else {
        await spotifyAPI.next();
      }
      setTimeout(loadData, 800);
    } catch (e) {
      console.error("Next error:", e);
    } finally {
      setTimeout(() => setIsActionLoading(false), 1200);
    }
  };

  return (
    <>
      {showUnlockModal && <AudioUnlockModal onUnlock={handleUnlockAudio} />}
      
      <div 
        className="h-screen w-screen bg-game-bg text-game-text flex items-center justify-between px-4 overflow-hidden select-none drag-region"
        onClick={() => {
          if (playerRef.current && !isPlaying && !showUnlockModal) {
            playerRef.current.activateElement().catch(() => {});
          }
        }}
      >
        
        {/* LEFT: Profile & Stats */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-md border-2 border-game-text bg-white flex items-center justify-center overflow-hidden">
            {user?.image ? (
              <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-game-text/40" />
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-black pixel-text uppercase flex flex-col">
              <span className='text-[8px] text-game-text/40 -mb-0.5'>PLAYER</span>
              <span className='text-game-accent'>{user?.display_name || 'Hero'}</span>
            </span>
            
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
        <div className="flex flex-col items-end gap-1.5 no-drag relative">
          <div className="flex items-center gap-2">
            {isPlayerReady && (
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            )}

            <Tooltip content={!isPremium ? "PREMIUM_ONLY" : ""} side="left">
              <div className="flex gap-2">
                <button 
                  className={`p-2 rounded-md border-2 transition-all ${
                    isPremium 
                      ? 'cursor-pointer text-game-text/50 hover:bg-game-text/10 border-game-text/20 bg-game-text/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]/50 hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'
                      : 'cursor-not-allowed text-game-text/20 border-game-text/10 bg-game-text/5 opacity-50'
                  } ${isActionLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={handlePrevious}
                  disabled={!isPremium || isActionLoading}
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>

                <button 
                  onClick={handlePlayPause}
                  disabled={!isPremium || isActionLoading}
                  className={`w-10 h-10 border-2 border-game-text rounded-md flex items-center justify-center transition-all ${
                    isPremium
                      ? 'cursor-pointer bg-game-accent text-game-text shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'
                      : 'cursor-not-allowed bg-game-accent/30 text-game-text/30 opacity-30'
                  } ${isActionLoading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                <button 
                  className={`p-2 rounded-md border-2 transition-all ${
                    isPremium 
                      ? 'cursor-pointer text-game-text/50 hover:bg-game-text/10 border-game-text/20 bg-game-text/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]/50 hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-y-1'
                      : 'cursor-not-allowed text-game-text/20 border-game-text/10 bg-game-text/5 opacity-50'
                  } ${isActionLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={handleNext}
                  disabled={!isPremium || isActionLoading}
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
}
