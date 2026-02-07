import React from 'react';
import { Volume2 } from 'lucide-react';

const AudioUnlockModal = ({ onUnlock }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-game-bg border-4 border-game-text p-8 rounded-lg shadow-2xl max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-game-accent rounded-full flex items-center justify-center border-4 border-game-text pulse-glow">
            <Volume2 size={40} className="text-game-text" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black pixel-text text-game-accent uppercase tracking-tighter">
            Áudio Bloqueado
          </h2>
          <p className="text-game-text/70 text-sm font-medium leading-tight">
            Para que as músicas do Spotify toquem dentro do CodeQuest, precisamos da sua permissão.
          </p>
        </div>

        <button
          onClick={onUnlock}
          className="w-full bg-game-accent text-game-text font-black py-4 border-4 border-game-text shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:bg-game-accent/90 transition-all uppercase tracking-widest pixel-text"
        >
          Liberar Player
        </button>
        
        <p className="text-[10px] text-game-text/40 italic">
          *Regra obrigatória do navegador para evitar sons indesejados.
        </p>
      </div>
    </div>
  );
};

export default AudioUnlockModal;
