import { X, ShieldAlert, ShieldCheck, HelpCircle, AlertTriangle, Sword } from 'lucide-react';
import t from '../utils/i18n';

export default function GameModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm, 
  confirmText = 'ACCEPT', 
  cancelText = 'DISMISS' 
}) {
  if (!isOpen) return null;

  const icons = {
    info: <ShieldAlert className="text-blue-400" size={24} />,
    warning: <AlertTriangle className="text-yellow-400" size={24} />,
    error: <AlertTriangle className="text-red-400" size={24} />,
    success: <ShieldCheck className="text-green-400" size={24} />,
    confirm: <HelpCircle className="text-game-accent" size={24} />
  };

  const headerColors = {
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    success: 'bg-green-600',
    confirm: 'bg-game-text'
  };

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="quest-window bg-game-bg border-2 border-game-text w-full max-w-xs rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden scale-in-center">
        
        {/* HEADER */}
        <div className={`${headerColors[type] || 'bg-game-text'} p-2 flex items-center justify-between border-b-2 border-game-text`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/20 rounded-sm animate-pulse" />
            <span className="text-[10px] font-black pixel-text text-white uppercase tracking-widest">{title || 'SYSTEM_LOG'}</span>
          </div>
          <button onClick={onClose} className="text-white hover:scale-110 transition-transform active:scale-90 cursor-pointer">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-game-text/5 border-2 border-game-text/10 rounded-full animate-bounce-subtle">
            {icons[type]}
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-black pixel-text text-game-text uppercase leading-tight tracking-wide">{message}</p>
            <div className="flex items-center justify-center gap-1 opacity-20">
              <div className="w-1 h-1 bg-game-text rounded-full" />
              <div className="w-10 h-px bg-game-text" />
              <div className="w-1 h-1 bg-game-text rounded-full" />
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-3 bg-game-text/5 flex gap-2 border-t-2 border-game-text/10">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-2 font-black pixel-text text-sm border-2 border-game-text hover:bg-game-text/5 transition-all rounded-sm cursor-pointer"
              >
                {t('CANCEL')}
              </button>
              <button
                onClick={async () => {
                  await onConfirm();
                  onClose();
                }}
                className="flex-1 py-2 font-black pixel-text text-sm bg-game-accent border-2 border-game-text shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all rounded-sm text-game-text cursor-pointer"
              >
                {t('CONFIRM')}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={`game-button flex-1 rounded-sm text-[8px] py-1.5 font-black transition-all game-button-accent`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
      
      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10001 bg-size-[100%_4px,3px_100%]" />
    </div>
  );
}
