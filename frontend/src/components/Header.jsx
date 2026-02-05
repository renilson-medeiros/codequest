import { useState, useEffect } from 'react';
import { 
  Gamepad, 
  User, 
  LogIn 
} from 'lucide-react';
import { spotifyAPI } from '../api/api';
import t from '../utils/i18n';

export default function Header({ themeColor, setThemeColor }) {
  const [spotifyAuth, setSpotifyAuth] = useState(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const themes = [
    { name: 'GOLD', color: '#f2b43b' },
    { name: 'AQUA', color: '#42feea' },
    { name: 'EMERALD', color: '#42fe8a' },
    { name: 'PURPLE', color: '#c342fe' },
    { name: 'CRIMSON', color: '#fc5d47' },
    { name: 'AZURE', color: '#42b0fe' },
  ];

  useEffect(() => {
    checkSpotifyAuth();
  }, []);

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

        {/* USER PROFILE & THEME PICKER */}
        <div className="flex items-center gap-3 no-drag relative">
          {spotifyAuth?.authenticated ? (
            <div 
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex items-center gap-2 bg-game-card p-1 px-2 border-2 border-game-text rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:translate-y-0.5 hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none"
            >
              <div className="text-right">
                <div className="text-[6px] font-black uppercase text-game-text/40 tracking-widest">Hero</div>
                <div className="text-[10px] font-black text-game-text uppercase leading-none">{spotifyAuth.user?.display_name || 'Gamer'}</div>
              </div>
              <div className="w-6 h-6 rounded-sm border border-game-text overflow-hidden bg-white flex items-center justify-center">
                {spotifyAuth.user?.image ? (
                  <img 
                    src={spotifyAuth.user.image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={12} className="text-game-text/40" />
                )}
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

          {/* THEME SELECTOR DROPDOWN */}
          {showThemePicker && (
            <div className="absolute top-full right-0 mt-2 p-2 bg-game-card border-2 border-game-text rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-30 animate-in slide-in-from-top-2 duration-200">
              <div className="text-[7px] font-black text-game-text/30 uppercase tracking-[0.2em] mb-2 px-1">{t('EQUIP_THEME')}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {themes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setThemeColor(t.color);
                      setShowThemePicker(false);
                    }}
                    className={`
                      w-7 h-7 rounded-sm border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer
                      ${themeColor === t.color ? 'border-game-text shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'border-game-text/20'}
                    `}
                    style={{ backgroundColor: t.color }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
