import { useState } from 'react';
import { Scroll, Plus, Trash2, X, Sword } from 'lucide-react';
import GameModal from './GameModal';
import { questsAPI, checkpointsAPI } from '../api/api';
import t from '../utils/i18n';

export default function CreateQuestModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [checkpoints, setCheckpoints] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });

  if (!isOpen) return null;

  const addCheckpoint = () => {
    setCheckpoints([...checkpoints, '']);
  };

  const removeCheckpoint = (index) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const updateCheckpoint = (index, value) => {
    const updated = [...checkpoints];
    updated[index] = value;
    setCheckpoints(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || loading || success) return;
    
    const validCheckpoints = checkpoints.filter(c => c.trim() !== '');
    if (validCheckpoints.length === 0) {
      setErrorModal({ show: true, message: t('DEFINE_OBJECTIVE') });
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateQuestModal] Registering Mission:', title);
      const questResponse = await questsAPI.create(title, description);
      const questId = questResponse.id;
      
      console.log('[CreateQuestModal] Registering Objectives...');
      for (let i = 0; i < validCheckpoints.length; i++) {
        await checkpointsAPI.create(questId, validCheckpoints[i], i + 1);
      }
      
      setSuccess(true);
      console.log('[CreateQuestModal] MISSION_ACCEPTED! Showing animation...');
      
      setTimeout(() => {
        onCreated(); // Refresh App state
        onClose();   // Close Modal
        
        // Reset local state AFTER modal is closed
        setTimeout(() => {
          setTitle('');
          setDescription('');
          setCheckpoints(['']);
          setSuccess(false);
        }, 300);
      }, 1500);
    } catch (error) {
      console.error('Error creating quest:', error);
      setErrorModal({ 
        show: true, 
        message: t('REGISTRY_FAILED')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-game-bg/95 flex items-center justify-center z-2000 p-4 animate-in fade-in duration-200">
      <div className="quest-window max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0px_4px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 rounded-md border-2 border-black bg-white">
        
        {/* MODAL HEADER - COMPACT */}
        <div className="p-3 border-b-2 border-black bg-black text-white flex items-center justify-between no-drag shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm">
              <Scroll size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm font-black pixel-text leading-none uppercase tracking-widest">{t('NEW_MISSION')}</h2>
              <p className="text-[6px] font-black uppercase tracking-[0.2em] mt-1 opacity-40">{t('SYSTEM_REGISTRY')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all rounded-sm cursor-pointer"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>

        {/* REGISTRY FORM - COMPACT & SCROLLABLE */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden no-drag">
          <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            {success ? (
              <div className="py-20 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 border-4 border-game-accent flex items-center justify-center rounded-full mb-4 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.5)]">
                   <Sword size={32} className="text-game-accent animate-bounce" />
                </div>
                <h3 className="text-lg font-black pixel-text text-game-accent uppercase tracking-tighter">{t('MISSION_ACCEPTED')}</h3>
                <p className="text-[8px] font-black text-black/30 mt-2 tracking-[0.3em] uppercase">{t('DEPLOYING_INTEL')}</p>
              </div>
            ) : (
              <>
                {/* TITLE */}
                <div>
                  <label className="text-[6px] font-black uppercase tracking-[0.3em] text-black/30 mb-1.5 block">{t('DIRECTIVE')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="EX: CODE_REFACTOR"
                    className="w-full bg-retro-light-gray border-2 border-black focus:border-game-accent px-3 py-2 text-black placeholder-black/10 focus:outline-none transition-all font-black text-xs uppercase rounded-sm"
                    required
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="text-[6px] font-black uppercase tracking-[0.3em] text-black/30 mb-1.5 block">{t('INTEL')}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="DETAILS..."
                    rows={2}
                    className="w-full bg-retro-light-gray border-2 border-black focus:border-game-accent px-3 py-2 text-black placeholder-black/10 focus:outline-none transition-all font-bold text-[9px] resize-none uppercase rounded-sm leading-tight"
                  />
                </div>

                {/* MILESTONES */}
                <div>
                  <label className="text-[6px] font-black uppercase tracking-[0.3em] text-black/30 mb-1.5 block">{t('OBJECTIVES')}</label>
                  <div className="space-y-2 pr-1">
                    {checkpoints.map((checkpoint, index) => (
                      <div key={index} className="flex gap-1.5 group">
                        <div className="w-6 h-6 shrink-0 bg-white border border-black flex items-center justify-center font-black pixel-text text-[10px] text-black group-focus-within:bg-game-accent rounded-sm shadow-[0px_1px_0px_0px_rgba(0,0,0,1)]">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={checkpoint}
                          onChange={(e) => updateCheckpoint(index, e.target.value)}
                          placeholder={`OBJ_${index + 1}`}
                          className="flex-1 bg-retro-light-gray border border-black focus:border-game-accent px-2 py-1 text-black placeholder-black/10 focus:outline-none transition-all font-black uppercase text-[9px] rounded-sm"
                        />
                        {checkpoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCheckpoint(index)}
                            className="w-6 h-6 bg-retro-red/10 border border-retro-red/20 hover:bg-retro-red hover:border-black text-retro-red hover:text-white transition-all flex items-center justify-center shrink-0 rounded-sm cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addCheckpoint}
                    className="mt-3 w-full border border-dashed border-black/20 hover:border-black hover:bg-retro-light-gray/30 hover:translate-y-0.5 py-2 text-black/20 hover:text-black transition-all text-[7px] font-black uppercase tracking-[0.2em] rounded-sm cursor-pointer"
                  >
                    + {t('ADD_OBJECTIVE')}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ACTION BUTTONS - ELITE */}
          {!success && (
            <div className="p-4 border-t border-retro-light-gray shrink-0 bg-white">
              <button 
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full game-button rounded-sm game-button-accent py-2.5 font-black text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2 hover:translate-y-0.5 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-game-text border-t-transparent animate-spin rounded-full" />
                ) : t('ACCEPT_MISSION')}
              </button>

              <GameModal 
                isOpen={errorModal.show}
                onClose={() => setErrorModal({ show: false, message: '' })}
                title={t('REGISTRY_ERROR')}
                message={errorModal.message}
                type="error"
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}