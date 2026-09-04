import React from 'react';
import { useGame } from '../context/GameContext';
import { Volume2, VolumeX, FastForward, Play } from 'lucide-react';

export const SettingsControls: React.FC = () => {
  const { isMuted, toggleMute, gameSpeed, setGameSpeed } = useGame();

  return (
    <div className="flex items-center gap-2 md:gap-3 bg-black/40 border border-white/10 p-1 md:p-1.5 rounded-full backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
      <button 
        onClick={toggleMute}
        className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-500 flex items-center justify-center hover:brightness-125 transition-all text-white shadow-inner active:translate-y-1"
        title={isMuted ? "Unmute Sound" : "Mute Sound"}
      >
        {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-yellow-400" />}
      </button>

      <button 
        onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : 1)}
        className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-b flex items-center justify-center border-2 hover:brightness-125 transition-all shadow-inner active:translate-y-1 ${
          gameSpeed > 1 
            ? 'from-yellow-500 to-orange-700 border-yellow-300 text-white shadow-[0_0_10px_rgba(234,179,8,0.5)]'
            : 'from-gray-700 to-gray-900 border-gray-500 text-gray-300'
        }`}
        title={gameSpeed > 1 ? "Normal Speed" : "Fast Speed"}
      >
        {gameSpeed > 1 ? <FastForward size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
};
