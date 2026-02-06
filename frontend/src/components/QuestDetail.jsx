import { useState, useEffect } from 'react';
import { 
  Disc,
  Trash2,
  Sword,
  Edit2,
  Save,
  X,
  PlusCircle,
  Trash,
  ArrowLeft,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ListMusic,
  Play,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';
import GameModal from './GameModal';
import { questsAPI, checkpointsAPI, spotifyAPI, musicAPI } from '../api/api';
import t from '../utils/i18n';

export default function QuestDetail({ 
  quest, 
  onBack, 
  onUpdate, 
  mini,
  isSyncActive,
  setIsSyncActive,
  syncedQuest,
  setSyncedQuest,
  syncedQuestData,
  refreshSyncedQuestData,
  lastTrackedUri,
  setLastTrackedUri
}) {
  const [questData, setQuestData] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCheckpoints, setEditCheckpoints] = useState([]);

  useEffect(() => {
    loadQuestData();
  }, [quest.id]);

  // Use global syncedQuestData if this quest is the one being synced
  const effectiveQuestData = (syncedQuest?.id === quest.id) ? syncedQuestData : questData;

  const loadQuestData = async () => {
    try {
      const data = await questsAPI.getById(quest.id);
      setQuestData(data);
    } catch (error) {
      console.error('Error loading quest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTracking = async () => {
    try {
      await questsAPI.sync(quest.id, true);
      setIsSyncActive(true);
      setSyncedQuest(quest);
      onUpdate(); 
    } catch (error) {
      console.error('Start sync error:', error);
    }
  };
  
  const handleStopTracking = async () => {
    try {
      await questsAPI.sync(quest.id, false);
      setIsSyncActive(false);
      setCurrentTrack(null);
      setSyncedQuest(null);
      onUpdate(); 
    } catch (error) {
      console.error('Stop sync error:', error);
    }
  };

  const handleCompleteCheckpoint = async (checkpointId) => {
    try {
      await checkpointsAPI.complete(checkpointId);
      if (refreshSyncedQuestData) await refreshSyncedQuestData();
      onUpdate();
      
      const updatedData = await questsAPI.getById(quest.id);
      setQuestData(updatedData);

      const allCompleted = updatedData.checkpoints.every(c => c.completed);
      if (allCompleted) {
        await questsAPI.updateStatus(quest.id, 'completed');
        await handleStopTracking();
        if (onUpdate) await onUpdate();
      }
    } catch (error) {
      console.error('Checkpoint error:', error);
    }
  };

  const handleDeleteQuest = async () => {
    setModalConfig({
      isOpen: true,
      title: t('ABANDON_MISSION'),
      message: t('REALLY_ABANDON'),
      type: "warning",
      onConfirm: async () => {
        try {
          await questsAPI.delete(quest.id).then(() => {
            if (isSyncActive && syncedQuest?.id === quest.id) {
              handleStopTracking();
            }
            onBack();
            onUpdate();
          });
        } catch (error) {
          console.error('Delete error:', error);
        }
      }
    });
  };

  const handlePlay = async () => {
    try {
      await spotifyAPI.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao fazer play:', error);
    }
  };

  const handlePause = async () => {
    try {
      await spotifyAPI.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Erro ao pausar:', error);
    }
  };

  const handleNext = async () => {
    try {
      await spotifyAPI.next();
    } catch (error) {
      console.error('Erro ao pular:', error);
    }
  };

  const handlePrevious = async () => {
    try {
      await spotifyAPI.previous();
    } catch (error) {
      console.error('Erro ao voltar:', error);
    }
  };

  const handleFinishQuest = async () => {
    setModalConfig({
      isOpen: true,
      title: t('FINISH_MISSION'),
      message: t('REALLY_FINISH'),
      type: "confirm",
      onConfirm: async () => {
        try {
           await questsAPI.updateStatus(quest.id, 'completed');
           handleStopTracking();
           if (refreshSyncedQuestData) await refreshSyncedQuestData();
           loadQuestData();
           onUpdate();
        } catch (error) {
          console.error('Finish error:', error);
        }
      }
    });
  };

  const handleViewPlaylist = async () => {
    setModalConfig({
      isOpen: true,
      title: t('RETRIEVE_LOOT'),
      message: t('LOOT_CONFIRM_MSG'),
      type: 'confirm',
      onConfirm: async () => {
        try {
          const data = await questsAPI.getPlaylist(quest.id);

          if (data.unique_songs === 0) {
            setModalConfig({ isOpen: false });

            return;
          }
          
          const uris = data.playlist.map(m => m.spotify_uri);
          const result = await spotifyAPI.createPlaylist(`CodeQuest - ${quest.title}`, uris);
          
          if (result.playlist_url) {
            try {
              await questsAPI.retrieveLoot(quest.id);
              if (refreshSyncedQuestData) await refreshSyncedQuestData();
              await loadQuestData();
              if (onUpdate) await onUpdate();
              setModalConfig({ isOpen: false });
              
            } catch (err) {
              console.error('Erro ao atualizar loot:', err.message);
              setModalConfig({
                isOpen: true,
                title: 'SYNC ERROR',
                message: 'Loot extracted but failed to update status. Please refresh.',
                type: 'error'
              });
            }
          }
        } catch (error) {
          console.error('Playlist error:', error);
          setModalConfig({ isOpen: false });
        }
      }
    });
  };

  const handleStartEdit = () => {
    setEditTitle(effectiveQuestData.quest.title);
    setEditDescription(effectiveQuestData.quest.description || '');
    setEditCheckpoints([...effectiveQuestData.checkpoints]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    try {
      // Update Quest Metadata
      await questsAPI.update(quest.id, {
        title: editTitle,
        description: editDescription
      });

      const originalIds = effectiveQuestData.checkpoints.map(c => c.id);
      const currentIds = editCheckpoints.map(c => c.id).filter(id => id);
      const toDelete = originalIds.filter(id => !currentIds.includes(id));

      for (const id of toDelete) {
        await checkpointsAPI.delete(id);
      }

      for (const [index, cp] of editCheckpoints.entries()) {
        if (cp.id) {
          await checkpointsAPI.update(cp.id, {
            title: cp.title,
            order_index: index + 1
          });
        } else {
          // Create new
          await checkpointsAPI.add(quest.id, cp.title, index + 1);
        }
      }

       setIsEditing(false);
       if (refreshSyncedQuestData) await refreshSyncedQuestData();
       loadQuestData();
       onUpdate();
    } catch (error) {
       console.error('Save edit error:', error);
       setModalConfig({
         isOpen: true,
         title: 'ERROR',
         message: 'Failed to update tactical intel.',
         type: 'error'
       });
    }
  };

  const addEditCheckpoint = () => {
    setEditCheckpoints([...editCheckpoints, { title: '', order_index: editCheckpoints.length + 1, completed: false }]);
  };

  const removeEditCheckpoint = (index) => {
    const newList = [...editCheckpoints];
    newList.splice(index, 1);
    setEditCheckpoints(newList);
  };

  const updateEditCheckpoint = (index, title) => {
    const newList = [...editCheckpoints];
    newList[index].title = title;
    setEditCheckpoints(newList);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-fit items-center justify-center p-8">
        <span className="text-[6px] font-black uppercase tracking-[0.3em] text-game-text/30 mb-1 italic leading-none">{t('LOADING')}</span>
        <div className="w-7.5 h-0.5 bg-game-text/5 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/3 bg-game-accent animate-loading-dash" />
        </div>
      </div>
    );
  }

  const completedCheckpoints = effectiveQuestData?.checkpoints.filter(c => c.completed).length || 0;
  const totalCheckpoints = effectiveQuestData?.checkpoints.length || 1;
  const progress = (completedCheckpoints / totalCheckpoints) * 100;
  const isCompleted = effectiveQuestData?.quest.status === 'completed';
  const activeCheckpoint = effectiveQuestData?.checkpoints.find(c => !c.completed);

  if (mini) {
    return (
      <div className="mt-1 animate-in fade-in duration-300">
        <div className="quest-window p-2.5 bg-game-bg border-2 border-game-text rounded-md shadow-[0px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
             <div className={`w-8 h-8 border flex items-center justify-center rounded-sm shrink-0 ${isCompleted ? 'bg-game-accent border-game-text' : 'bg-game-text/5 border-game-text/20'}`}>
                {isCompleted ? <ShieldCheck size={16} className="text-game-text" /> : <ShieldAlert size={16} className="text-game-text/40" />}
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-[6px] font-black uppercase tracking-[0.3em] text-game-text/30 mb-0.5 italic">{t('FOCUS_ACTIVE')}</p>
                <h2 className="text-[10px] font-black pixel-text text-game-text uppercase truncate leading-none">
                  {effectiveQuestData?.quest.title}
                </h2>
             </div>
          </div>
          
          {activeCheckpoint && (
            <div className="flex items-center justify-between p-3 mt-1 gap-3 rounded-md bg-game-text text-game-bg">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 border border-game-bg/20 flex items-center justify-center shrink-0 rounded-sm">
                  <Clock size={10} />
                </div>
                <span className="text-[8px] font-black text-game-bg/60 truncate uppercase tracking-tight">
                  {activeCheckpoint.title}
                </span>
              </div>
              <button
                onClick={() => handleCompleteCheckpoint(activeCheckpoint.id)}
                disabled={!isSyncActive}
                className={`px-3 cursor-pointer py-1 font-black pixel-text text-[8px] border-2 border-game-text rounded-sm shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none no-drag transition-all ${isSyncActive ? 'bg-game-accent text-game-text' : 'bg-game-bg/5 text-game-bg/20 opacity-30 cursor-not-allowed'}`}
              >
                {t('DONE')}
              </button>
            </div>
          )}
          
          {!activeCheckpoint && isCompleted && (
            <div className="mt-2 p-1.5 bg-game-accent/10 border border-game-accent text-game-accent text-[8px] font-black pixel-text text-center rounded-sm">
              {t('SUCCESS')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* HUD NAVIGATION */}
      <div className="flex items-center justify-between no-drag relative z-40 pointer-events-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-game-text/40 hover:text-game-text transition-all group font-black uppercase tracking-[0.2em] text-[7px] cursor-pointer pointer-events-auto"
        >
          <div className="w-6 h-6 flex items-center justify-center border border-game-text group-hover:bg-game-text group-hover:text-game-bg transition-all rounded-sm shadow-[0px_1px_0px_0px_rgba(0,0,0,1)]">
            <ArrowLeft className='text-game-text group-hover:text-game-bg' size={12} />
          </div>
          <span>{t('LOG_BACK')}</span>
        </button>

        <button
          onClick={handleDeleteQuest}
          className="flex items-center cursor-pointer gap-2 text-retro-red/40 hover:text-retro-red transition-all group font-black uppercase tracking-[0.2em] text-[7px]"
        >
          <span>{t('ABANDON_MSSN')}</span>
          <div className="w-6 h-6 flex items-center justify-center border border-retro-red/20 group-hover:bg-retro-red group-hover:text-white transition-all rounded-sm">
            <Trash2 size={12} />
          </div>
        </button>
      </div>

      {/* BRIEFING DASHBOARD - COMPACT */}
      <div className={`quest-window p-4 sm:p-5 relative overflow-hidden rounded-md border-2 ${isCompleted ? 'border-game-accent bg-game-accent/5' : 'border-game-text bg-game-bg shadow-[0px_3px_0px_0px_rgba(0,0,0,1)]'}`}>
        <div className="relative z-10 flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: MISSION SPECS */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4">
              <div className={`
                w-12 h-12 border-2 flex items-center justify-center text-xl shrink-0 rounded-md shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]
                ${isCompleted ? 'bg-game-accent border-game-text text-game-text' : 'bg-game-text/5 border-game-text text-game-text'}
              `}>
                {isCompleted ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div className="pt-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <span className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-sm ${isCompleted ? 'bg-game-accent border-game-text text-game-text' : 'bg-game-bg border-game-text text-game-text'}`}>
                    {isCompleted ? t('SUCCESS') : t('ACTIVE')}
                  </span>
                  <span className="text-[6px] font-black text-game-text/30 flex items-center gap-1 uppercase font-mono"><Clock size={8} /> EST: 4h</span>
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value.toUpperCase())}
                      className="w-full bg-game-text/5 border-2 border-game-text p-1 text-sm font-black pixel-text uppercase tracking-tight focus:outline-none focus:border-game-accent rounded-sm"
                      placeholder="MISSION TITLE"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-game-text/5 border-2 border-game-text p-1 text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:border-game-accent rounded-sm h-12"
                      placeholder="MISSION BRIEFING..."
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-black pixel-text text-game-text mb-1 leading-none uppercase tracking-tight truncate">
                      {effectiveQuestData?.quest.title}
                    </h1>
                    <p className="text-[9px] font-bold text-game-text/50 leading-tight uppercase tracking-widest italic line-clamp-2">
                       "{effectiveQuestData?.quest.description || 'No further intel.'}"
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* SYNC ANALYTICS */}
            <div className="space-y-1.5 bg-game-text/5 p-3 border border-game-text/10 rounded-md">
              <div className="flex justify-between items-end">
                <span className="text-[6px] font-black uppercase tracking-[0.3em] text-game-text/30">{t('SYNC_PROGRESS')}</span>
                <span className={`text-sm font-black pixel-text ${isCompleted ? 'text-game-accent' : 'text-game-text'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-game-text/5 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-game-accent' : 'bg-game-text'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: TACTICAL COMMANDS */}
          <div className="w-full lg:w-48 flex flex-col gap-2 no-drag">
            {!isCompleted ? (
              <>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-2.5 bg-game-accent text-game-text font-black pixel-text text-sm flex items-center justify-center gap-2 border-2 border-game-text rounded-md shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                      <Save size={16} /> {t('SAVE')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="w-full py-2 bg-retro-red text-white font-black pixel-text text-xs flex items-center justify-center gap-2 border-2 border-game-text rounded-md shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                      <X size={14} /> {t('CANCEL')}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={isSyncActive ? handleStopTracking : handleStartTracking}
                      className={`
                        w-full py-2.5 font-black pixel-text text-sm flex items-center justify-center gap-2 border-2 border-game-text transition-all rounded-md shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none cursor-pointer
                        ${isSyncActive ? 'bg-retro-red text-white' : 'bg-game-accent text-game-text'}
                      `}
                    >
                      {isSyncActive ? <>{t('ABORT')}</> : <>{t('SYNC')}</>}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                        onClick={handleStartEdit}
                        className="py-2 bg-game-bg border-2 border-game-text text-game-text font-black uppercase tracking-widest text-[8px] transition-all rounded-md hover:bg-game-text/5 hover:translate-y-0.5 active:translate-y-1 flex items-center justify-center gap-1 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
                      >
                        <Edit2 size={10} /> {t('EDIT')}
                      </button>
                      <button
                        onClick={handleFinishQuest}
                        className="py-2 bg-game-bg border-2 border-game-text text-game-text/50 hover:text-game-text font-black uppercase tracking-widest text-[8px] transition-all rounded-md hover:bg-game-text/5 hover:translate-y-0.5 active:translate-y-1 flex items-center justify-center gap-1 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none cursor-pointer"
                      >
                        <Sword size={10} /> {t('DONE')}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full py-3 bg-game-accent/10 border-2 border-game-accent text-game-accent font-black pixel-text text-sm text-center rounded-md">
                COMPLETE
              </div>
            )}

            <button
              onClick={handleViewPlaylist}
              disabled={!isCompleted || effectiveQuestData?.quest.loot_retrieved}
              title={!isCompleted ? t('LOOT_REQUIRE_COMPLETE') : (effectiveQuestData?.quest.loot_retrieved ? t('LOOT_RETRIEVED') : t('LOOT_READY'))}
              className={`
                w-full py-2.5 border-2 font-black pixel-text text-base transition-all rounded-md flex items-center justify-center gap-2
                ${isCompleted && !effectiveQuestData?.quest.loot_retrieved
                  ? 'bg-game-bg border-game-text text-game-text shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none hover:bg-game-text/5 cursor-pointer' 
                  : (effectiveQuestData?.quest.loot_retrieved 
                      ? 'bg-retro-emerald/20 border-retro-emerald/30 text-retro-emerald cursor-not-allowed shadow-none'
                      : 'bg-game-text/5 border-game-text/10 text-game-text/10 cursor-not-allowed shadow-none')
                }
              `}
            >
              <ListMusic size={16} /> {effectiveQuestData?.quest.loot_retrieved ? t('LOOT_RETRIEVED') : t('LOOT_LIST')}
            </button>
          </div>
        </div>
      </div>

      {/* SYNC STATUS - COMPACT */}
      {isSyncActive && currentTrack && (
        <div className="space-y-2">
          <div className="p-2 px-4 bg-retro-black text-white border-2 border-retro-black flex items-center justify-between gap-4 rounded-md shadow-[0px_2px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white/10 text-white flex items-center justify-center rounded-sm shrink-0">
                  <Disc size={14} className="animate-spin-slow" />
               </div>
                <div className="min-w-0">
                  <p className="text-[6px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">{t('SYNCING_DATA')}</p>
                  <h4 className="text-xs font-black leading-none truncate max-w-30 uppercase pixel-text">
                    {currentTrack.track_name}
                  </h4>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* OBJECTIVES GRID - COMPACT */}
      <div className="flex items-center justify-between mb-3 no-drag">
        <div className="flex items-center gap-3">
          <div className="w-1 h-3 bg-game-accent" />
          <h2 className="text-sm font-black pixel-text text-game-text uppercase tracking-wider">{isEditing ? 'MODIFY OBJECTIVES' : t('OBJECTIVES')}</h2>
        </div>
        {isEditing && (
          <button
            onClick={addEditCheckpoint}
            className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-game-accent hover:text-game-text transition-all cursor-pointer"
          >
            <PlusCircle size={14} /> ADD PHASE
          </button>
        )}
      </div>
      
      <div className="grid gap-2">
        {(isEditing ? editCheckpoints : (effectiveQuestData?.checkpoints || [])).map((checkpoint, index) => (
          <div
            key={checkpoint.id || `new-${index}`}
            className={`
              p-3 transition-all group relative overflow-hidden rounded-md border-2
              ${checkpoint.completed && !isEditing
                ? 'bg-game-text/5 border-game-text/5 opacity-40' 
                : 'hover:border-game-accent/50 bg-game-bg border-game-text/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]'
              }
            `}
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className={`
                w-7 h-7 border flex items-center justify-center font-black pixel-text text-xs shrink-0 rounded-sm shadow-[0px_1px_0px_0px_rgba(0,0,0,1)]
                ${checkpoint.completed && !isEditing ? 'bg-game-text/10 border-game-text/20 text-game-text/20 font-sans' : 'bg-game-text text-game-bg group-hover:bg-game-accent group-hover:text-game-text'}
              `}>
                {checkpoint.completed && !isEditing ? '✓' : index + 1}
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    value={checkpoint.title}
                    onChange={(e) => updateEditCheckpoint(index, e.target.value.toUpperCase())}
                    className="w-full bg-transparent border-b border-game-text/10 focus:border-game-accent focus:outline-none text-xs font-bold uppercase tracking-tight text-game-text"
                    placeholder="OBJECTIVE TITLE..."
                  />
                ) : (
                  <h3 className={`text-xs font-bold uppercase tracking-tight ${checkpoint.completed ? 'text-game-text/30 line-through' : 'text-game-text'}`}>
                    {checkpoint.title}
                  </h3>
                )}
              </div>

              {isEditing ? (
                 <button
                  onClick={() => removeEditCheckpoint(index)}
                  className="p-1.5 text-retro-red/40 hover:text-retro-red hover:bg-retro-red/5 rounded-sm transition-all cursor-pointer"
                >
                  <Trash size={14} />
                </button>
              ) : (
                !checkpoint.completed && (
                  <button
                    onClick={() => handleCompleteCheckpoint(checkpoint.id)}
                    disabled={!isSyncActive}
                    title={!isSyncActive ? "CLICK 'SYNC' TO ENABLE" : ""}
                    className={`
                      px-3 py-1.5 cursor-pointer font-black pixel-text text-[8px] uppercase tracking-widest border-2 border-game-text rounded-sm shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 no-drag transition-all
                      ${isSyncActive ? 'bg-game-accent text-game-text' : 'bg-game-text/5 text-game-text/10 border-game-text/5 cursor-not-allowed shadow-none'}
                    `}
                  >
                    {t('DONE')}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <GameModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
