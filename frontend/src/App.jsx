import { useState, useEffect } from 'react';
import { 
  Plus, 
  Music, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Info,
  Waves,
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import Header from './components/Header';
import QuestCard from './components/QuestCard';
import CreateQuestModal from './components/CreateQuestModal';
import QuestDetail from './components/QuestDetail';
import RetroLoading from './components/RetroLoading';
import { questsAPI, spotifyAPI, musicAPI } from './api/api';
import t from './utils/i18n';

function App() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialBoot, setInitialBoot] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [syncedQuest, setSyncedQuest] = useState(null);
  const [lastTrackedUri, setLastTrackedUri] = useState(null);
  
  // Theme State
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('codequest_theme') || '#f2b43b';
  });

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [lastCheck, setLastCheck] = useState(Date.now());
  const [syncedQuestData, setSyncedQuestData] = useState(null);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-accent', themeColor);
    localStorage.setItem('codequest_theme', themeColor);
  }, [themeColor]);

  useEffect(() => {
    loadQuests();
    fetchCurrentTrack(); 
    const interval = setInterval(fetchCurrentTrack, 5000); 
    
    // Initial boot delay
    const bootTimer = setTimeout(() => {
      setInitialBoot(false);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(bootTimer);
    };
  }, []);

  // Smooth interpolation for progress bar
  useEffect(() => {
    if (!isPlaying || !currentTrack?.duration_ms) return;
    
    const interval = setInterval(() => {
      setPlaybackProgress(prev => {
        const step = (1000 / currentTrack.duration_ms) * 100;
        return Math.min(prev + step, 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.spotify_uri]);

  // GLOBAL TRACKING LOOP
  useEffect(() => {
    if (isSyncActive && syncedQuest) {
      const interval = setInterval(() => {
        globalCheckTracking();
      }, 15000); // Check every 15s
      
      globalCheckTracking();
      return () => clearInterval(interval);
    }
  }, [isSyncActive, syncedQuest?.id, syncedQuestData?.checkpoints]);

  // Periodic refresh of synced quest data
  useEffect(() => {
    if (isSyncActive && syncedQuest) {
      const interval = setInterval(refreshSyncedQuestData, 30000); // Heavy refresh every 30s
      refreshSyncedQuestData();
      return () => clearInterval(interval);
    }
  }, [isSyncActive, syncedQuest?.id]);

  const refreshSyncedQuestData = async () => {
    if (!syncedQuest) return;
    try {
      const data = await questsAPI.getById(syncedQuest.id);
      setSyncedQuestData(data);
    } catch (error) {
      console.error('Error refreshing synced quest:', error);
    }
  };

  const globalCheckTracking = async () => {
    if (!isSyncActive || !syncedQuest) return;
    
    try {
      const resp = await spotifyAPI.getCurrentTrack();
      if (resp.playing && resp.track) {
        setCurrentTrack(resp.track);
        setIsPlaying(resp.track.is_playing);
        
        // Use the freshest syncedQuestData if available
        const data = syncedQuestData || await questsAPI.getById(syncedQuest.id);
        const activeCheckpoint = data.checkpoints.find(c => !c.completed);
        
        if (activeCheckpoint && resp.track.spotify_uri !== lastTrackedUri) {
          await musicAPI.track({
            checkpoint_id: activeCheckpoint.id,
            track_name: resp.track.track_name,
            artist: resp.track.artist,
            album: resp.track.album,
            spotify_uri: resp.track.spotify_uri,
            duration_ms: resp.track.duration_ms
          });
          setLastTrackedUri(resp.track.spotify_uri);
          refreshSyncedQuestData(); // Update song counts immediately
        }
      }
    } catch (error) {
      console.error('Global tracking error:', error);
    }
  };

  const loadQuests = async () => {
    setLoading(true);
    try {
      const resp = await questsAPI.getAll();
      setQuests(resp);
      
      // Sync local state objects with updated list data
      if (selectedQuest) {
        const updated = resp.find(q => q.id === selectedQuest.id);
        if (updated) setSelectedQuest(updated);
      }
      
      const activeSync = resp.find(q => q.is_syncing);
      if (activeSync) {
        setSyncedQuest(activeSync);
        setIsSyncActive(true);
      } else {
        setSyncedQuest(null);
        setIsSyncActive(false);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestClick = (quest) => {
    setSelectedQuest(quest);
  };

  const fetchCurrentTrack = async () => {
    try {
      const resp = await spotifyAPI.getCurrentTrack();
      if (resp.playing && resp.track) {
        setCurrentTrack(resp.track);
        setIsPlaying(resp.track.is_playing);
        if (resp.track.progress_ms !== undefined && resp.track.duration_ms) {
          // Atomic update of progress and reference time
          setPlaybackProgress((resp.track.progress_ms / resp.track.duration_ms) * 100);
        }
      } else {
        setIsPlaying(false);
        setCurrentTrack(null);
        setPlaybackProgress(0);
      }
      setLastCheck(Date.now());
    } catch (error) {
      console.error('Error fetching track:', error);
    }
  };

  const handleControl = async (action) => {
    try {
      if (action === 'play') {
        const nextState = !isPlaying;
        setIsPlaying(nextState); // Optimistic update
        nextState ? await spotifyAPI.play() : await spotifyAPI.pause();
      }
      else if (action === 'next') await spotifyAPI.next();
      else if (action === 'prev') await spotifyAPI.previous();
      
      // Delay slightly then sync
      setTimeout(fetchCurrentTrack, 800);
    } catch (error) {
      console.error('Control error:', error);
      // Rollback on error
      fetchCurrentTrack();
    }
  };

  // Auto-expand on sync
  useEffect(() => {
    if (isSyncActive && syncedQuest) {
      setIsExpanded(true);
    }
  }, [isSyncActive, syncedQuest?.id]);

  // Auto-collapse when quest is deselected (only if no sync is active)
  useEffect(() => {
    if (!selectedQuest && !isSyncActive && isExpanded) {
      setIsExpanded(false);
    }
  }, [selectedQuest, isSyncActive, isExpanded]);

  // Physically resize Electron window when MiniMode toggles
  useEffect(() => {
    if (window.electronAPI) {
      if (isMiniMode) {
        // Only allow expansion IF there is an active sync
        if (isExpanded && isSyncActive && syncedQuest) {
          window.electronAPI.resizeWindow(392, 245);
        } else {
          window.electronAPI.resizeWindow(392, 125);
        }
      } else {
        window.electronAPI.resizeWindow(400, 480);
      }
    }
  }, [isMiniMode, isExpanded, isSyncActive, syncedQuest]);

  const msToMinSec = (ms) => {
    if (!ms || isNaN(ms)) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      {initialBoot && <RetroLoading />}
      <div className={`flex flex-col font-mono text-game-text selection:bg-game-accent selection:text-black transition-all duration-300 ${isMiniMode ? 'bg-transparent p-1.5 h-fit overflow-hidden' : 'h-screen bg-game-bg overflow-hidden'}`}>
        {!isMiniMode && <div className="z-50 shrink-0 sticky top-0"><Header themeColor={themeColor} setThemeColor={setThemeColor} /></div>}
      
      <main className={`flex-1 max-w-7xl mx-auto w-full transition-all overflow-y-auto ${isMiniMode ? 'p-0 pb-0.75 h-full' : 'p-3 sm:p-4 space-y-4'}`}>
        
        {/* PLAYER HUD - FOCUS MODE COMPATIBLE */}
        <div className={`
          quest-window relative overflow-hidden group rounded-md shadow-[0px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300
          ${isMiniMode ? 'bg-game-text text-game-bg p-2.5 drag-region w-full border-2 border-game-text' : 'bg-game-bg text-game-text p-3 sm:p-4'}
        `}>
          <div className="relative z-10 flex items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <div className={`relative shrink-0 transition-all ${isMiniMode ? 'w-10 h-10' : 'w-12 h-12'}`}>
                {currentTrack?.album_art ? (
                  <img src={currentTrack.album_art} alt="Album" className={`w-full h-full object-cover border rounded-sm shadow-md ${isMiniMode ? 'border-game-bg/20' : 'border-game-text/20'}`} />
                ) : (
                  <div className={`w-full h-full border flex items-center justify-center rounded-sm ${isMiniMode ? 'bg-game-bg/5 border-game-bg/10' : 'bg-game-text/5 border-game-text/10'}`}>
                    <Music size={isMiniMode ? 14 : 18} className={isMiniMode ? 'text-game-bg/20' : 'text-game-text/20'} />
                  </div>
                )}
                {isPlaying && (
                  <div className={`absolute -bottom-1 -right-1 bg-game-accent rounded-full border-2 border-game-bg animate-pulse ${isMiniMode ? 'w-2 h-2 shadow-[0_0_8px_rgba(242,180,59,0.8)]' : 'w-3 h-3 shadow-[0_0_12px_rgba(242,180,59,0.5)]'}`} />
                )}
              </div>
              
              <div className="min-w-0">
                {!isMiniMode ? (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[6px] font-black bg-game-text/10 text-game-text/60 px-1 py-0.5 rounded-sm tracking-widest uppercase">
                      CODE_HUD
                    </span>
                    {isSyncActive && (
                      <span className="text-[6px] font-black bg-game-accent text-game-text px-1 py-0.5 rounded-sm tracking-widest uppercase animate-pulse shadow-[0_0_5px_rgba(242,180,59,0.5)]">
                        SYNC_ON
                      </span>
                    )}
                    <span className="text-[6px] font-black text-game-text/20 tracking-[0.2em] uppercase">V1.1</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[6px] font-black uppercase tracking-[0.2em] text-game-bg/30">{t('SYNCING_DATA')}</p>
                      {isSyncActive && (
                        <div className="w-1 h-1 bg-game-accent rounded-full animate-ping" />
                      )}
                    </div>
                  </div>
                )}
                <h2 className={`font-black max-w-50 pixel-text leading-none truncate uppercase tracking-wide ${isMiniMode ? 'text-sm text-game-bg max-w-62.5' : 'text-sm text-game-text  max-w-37.5'}`}>
                  {currentTrack?.track_name || t('SPOTIFY_AD_WARNING')}
                </h2>
                <p className={`font-bold truncate uppercase tracking-wide italic leading-none ${isMiniMode ? 'text-[8px] text-game-bg/50 mt-0.5' : 'text-[8px] text-game-text/40 mt-1'}`}>
                  {currentTrack?.artist || t('UNKNOWN_ARTIST')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 no-drag">
              <button 
                onClick={() => setIsMiniMode(!isMiniMode)}
                className={`w-8 h-8 cursor-pointer flex items-center justify-center rounded-sm transition-all ${isMiniMode ? 'bg-game-accent text-game-text' : 'text-game-text/60 bg-game-text/5 hover:text-game-text hover:bg-game-text/10'}`}
                title={isMiniMode ? t('EXIT_FOCUS') : t('FOCUS_MODE')}
              >
                {isMiniMode ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
            </div>
          </div>

          <div className={`${isMiniMode ? 'mt-5' : 'mt-3'} relative`}>
            <div className={`h-0.5 rounded-full overflow-hidden ${isMiniMode ? 'bg-game-bg/10' : 'bg-game-text/10'}`}>
              <div 
                className="h-full bg-game-accent transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(242,180,59,0.4)]"
                style={{ width: `${playbackProgress}%` }}
              />
            </div>
          </div>
          {isMiniMode && (
            <div className="text-xs font-black italic text-game-bg/20 pixel-text tracking-widest text-right mt-2">{t('ENCODING')}</div>
          )}
        </div>

        {/* EXPAND BUTTON FOR MINI MODE - ONLY IF SYNC IS ACTIVE */}
        {isMiniMode && isSyncActive && syncedQuest && (
          <div className="flex absolute left-1/2 -translate-x-1/2 justify-center -mt-2  z-20">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-10 h-4 bg-game-accent cursor-pointer border-2 border-game-text text-game-bg flex items-center justify-center rounded-sm hover:-translate-y-0.5 transition-all shadow-md active:translate-y-1"
            >
              <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown size={14} strokeWidth={4} />
              </div>
            </button>
          </div>
        )}

        {/* WORKSPACE AREA */}
        {!isMiniMode && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {!selectedQuest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-game-text/5 pb-2">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-4 bg-game-accent" />
                     <h2 className="text-lg font-black pixel-text text-game-text uppercase tracking-tight">{t('MISSION_LOG')}</h2>
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="game-button rounded-sm game-button-accent text-[9px] py-1 px-3 no-drag flex items-center gap-2 hover:translate-y-0.5 transition-all shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Plus size={12} strokeWidth={4} />
                    {t('NEW')}
                  </button>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center opacity-20">
                    <div className="w-6 h-6 border-2 border-game-text border-t-transparent animate-spin rounded-full mb-3" />
                  </div>
                ) : quests.length === 0 ? (
                  <div className="quest-window py-12 text-center bg-transparent border-dashed border-2 border-game-text/10 rounded-md">
                    <h4 className="text-xs font-black pixel-text text-game-text/30 uppercase">{t('NO_INTEL')}</h4>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quests.map((quest) => (
                      <div key={quest.id} onClick={() => setSelectedQuest(quest)} className="cursor-pointer no-drag">
                        <QuestCard quest={quest} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <QuestDetail 
                quest={selectedQuest} 
                onBack={() => { 
                  setSelectedQuest(null); 
                }}
                onUpdate={loadQuests}
                mini={false}
                isSyncActive={isSyncActive}
                setIsSyncActive={setIsSyncActive}
                syncedQuest={syncedQuest}
                setSyncedQuest={setSyncedQuest}
                syncedQuestData={syncedQuestData}
                refreshSyncedQuestData={refreshSyncedQuestData}
                lastTrackedUri={lastTrackedUri}
                setLastTrackedUri={setLastTrackedUri}
              />
            )}
          </div>
        )}
        
        {isMiniMode && isSyncActive && syncedQuest && isExpanded && (
          <div className="animate-in slide-in-from-top-2 mt-3 duration-300">
             <QuestDetail 
                quest={syncedQuest} 
                onBack={() => {}}
                onUpdate={loadQuests}
                mini={true}
                isSyncActive={isSyncActive}
                setIsSyncActive={setIsSyncActive}
                syncedQuest={syncedQuest}
                 setSyncedQuest={setSyncedQuest}
                 syncedQuestData={syncedQuestData}
                 refreshSyncedQuestData={refreshSyncedQuestData}
                 lastTrackedUri={lastTrackedUri}
                 setLastTrackedUri={setLastTrackedUri}
               />
          </div>
        )}
      </main>

      <CreateQuestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadQuests}
      />
      </div>
    </>
  );
}

export default App;