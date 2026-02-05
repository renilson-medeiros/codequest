import { CheckSquare, Clock, ShieldCheck, ShieldAlert, Disc, Music } from 'lucide-react';
import t from '../utils/i18n';

export default function QuestCard({ quest, onClick }) {
  const isCompleted = quest.status === 'completed';
  const completedCount = quest.completed_tasks_count || 0;
  const totalCount = quest.total_tasks_count || 0;
  const musicCount = quest.songs_count || 0;

  return (
    <div 
      onClick={() => onClick(quest)}
      className={`
        quest-window p-3 cursor-pointer group transition-all duration-200 rounded-md
        hover:translate-y-1 active:translate-y-1.5
        ${isCompleted ? 'border-game-accent bg-game-accent/5 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,1)]' : 'border-black bg-white hover:border-game-accent shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]'}
      `}
    >
      <div className="flex flex-col gap-3">
        {/* TOP SECTION */}
        <div className="flex gap-2 items-start justify-start">
            <div className={`w-8 h-8 border flex items-center justify-center rounded-sm shrink-0 ${isCompleted ? 'bg-game-accent border-game-text' : 'bg-game-bg border-game-text shadow-inner'}`}>
              {isCompleted ? <ShieldCheck size={18} className="text-game-text" /> : <ShieldAlert size={18} className="text-game-text" />}
            </div>
            <div className="min-w-0">
              <p className="text-[6px] font-black uppercase tracking-[0.3em] text-game-text/30 mb-0.5">{t('FOCUS_ACTIVE')}</p>
              <h3 className="text-[11px] font-black pixel-text text-game-text uppercase truncate leading-none">
                {quest.title}
              </h3>
            </div>
          </div>

        {/* INFO SECTION */}
        <div className="space-y-0.5">
          <p className="text-[8px] font-bold text-black/40 leading-snug uppercase tracking-widest line-clamp-2 italic">
            {quest.description || 'No briefing found.'}
          </p>
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-3 mt-auto border-t border-retro-light-gray pt-2">
          <div className="flex items-center gap-1">
            <CheckSquare size={10} className="text-game-text/40" />
            <span className="text-[7px] font-bold text-game-text/60">{completedCount}/{totalCount} {t('DONE')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Music size={10} className="text-game-text/40" />
            <span className="text-[7px] font-bold text-game-text/60">{musicCount} {t('LOOT_LIST')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
