import { useState, useEffect } from 'react';
import { 
  Gamepad, 
  User, 
  LogIn 
} from 'lucide-react';
import { spotifyAPI, userAPI } from '../api/api';
import t from '../utils/i18n';
import UserProfileModal from './UserProfileModal';

export default function Header({ themeColor, setThemeColor }) {
  const [spotifyAuth, setSpotifyAuth] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    checkSpotifyAuth();
    loadStats();
    
    // Refresh stats every 30s
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload stats whenever profile is opened
  useEffect(() => {
    if (showProfile) {
      loadStats();
    }
  }, [showProfile]);

  const loadStats = async () => {
    try {
      const data = await userAPI.getStats();
      setStats(data);
    } catch (e) {
      console.error('Stats load error:', e);
    }
  };

  const checkSpotifyAuth = async () => {
    try {
      const status = await spotifyAPI.getAuthStatus();
      setSpotifyAuth(status);
    } catch (error) {
      console.error('Error checking Spotify:', error);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      const { auth_url } = await spotifyAPI.getLoginUrl();
      window.open(auth_url, '_blank');
      setTimeout(checkSpotifyAuth, 5000);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <header className="p-2 sm:p-2 border-b-2 bg-game-text drag-region select-none relative z-3000">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* LOGO SECTION */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-game-accent text-game-text flex items-center justify-center rounded border border-game-text shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Gamepad size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black pixel-text text-game-bg leading-none">CODEQUEST</h1>
            <p className="text-[7px] font-bold text-game-bg/50 uppercase tracking-[0.2em] mt-0.5">Adventure Log v1.1.2</p>
          </div>
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-3 no-drag relative">
          {spotifyAuth?.authenticated ? (
            <div 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 bg-game-card p-1 px-2 border-2 border-game-text rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-y-0.5 hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none"
            >
              <div className="text-right">
                <div className="text-[6px] font-black uppercase text-game-text/40 tracking-widest">
                  LVL {stats?.level || 1}
                </div>
                <div className="text-[10px] font-black text-game-text uppercase leading-none">
                  {spotifyAuth.user?.display_name || 'Hero'}
                </div>
              </div>
              <div className="w-6 h-6 rounded-sm border border-game-text overflow-hidden bg-white flex items-center justify-center relative">
                {spotifyAuth.user?.image ? (
                  <img 
                    src={spotifyAuth.user.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={12} className="text-game-text/40" />
                )}
                {/* XP Indicator Dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-game-accent border border-game-text rounded-full" />
              </div>
            </div>
          ) : (
            <button 
              onClick={handleSpotifyLogin}
              className="game-button rounded-md game-button-accent flex items-center gap-2 text-[10px] py-1"
            >
              <LogIn size={12} strokeWidth={3} />
              {t('LOGIN_HERO')}
            </button>
          )}

          <UserProfileModal 
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            stats={stats}
            user={spotifyAuth?.user}
            theme={themeColor}
            setTheme={setThemeColor}
          />
        </div>
      </div>
    </header>
  );
}
