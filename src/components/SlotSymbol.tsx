import React from 'react';
import { SymbolType } from '../types';

interface SymbolProps {
  type: SymbolType;
  className?: string;
}

export const SlotSymbol: React.FC<SymbolProps> = ({ type, className = '' }) => {
  const getSymbolContent = () => {
    switch (type) {
      case 'cherry':
        return (
          <img src="https://firebasestorage.googleapis.com/v0/b/cosmic-backbone-489617-j1.firebasestorage.app/o/game%20assets%2FCherry.png?alt=media&token=0dba053c-637b-44ec-a561-39f39814db5a" alt="Cherry" className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" />
        );
      case 'lemon':
        return (
          <img src="https://firebasestorage.googleapis.com/v0/b/cosmic-backbone-489617-j1.firebasestorage.app/o/game%20assets%2FLemon.png?alt=media&token=6121f93b-5957-4f06-b268-b55153cd97cb" alt="Lemon" className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" />
        );
      case 'diamond':
        return (
          <img src="https://firebasestorage.googleapis.com/v0/b/cosmic-backbone-489617-j1.firebasestorage.app/o/game%20assets%2FDiamond.png?alt=media&token=6beb2f71-917a-420e-8aa0-82e9f6383c6d" alt="Diamond" className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" />
        );
      case 'seven':
        return (
          <img src="https://firebasestorage.googleapis.com/v0/b/cosmic-backbone-489617-j1.firebasestorage.app/o/game%20assets%2F7.png?alt=media&token=deac1858-b339-42cb-89f3-f918d2b58df1" alt="Seven" className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" />
        );
      case 'jackpot':
        return (
          <img src="https://firebasestorage.googleapis.com/v0/b/cosmic-backbone-489617-j1.firebasestorage.app/o/game%20assets%2FJackpot.png?alt=media&token=921ffca9-37af-44be-9c1c-48ca57e408d7" alt="Jackpot" className="w-full h-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]" />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center justify-center p-2 ${className}`}>
      {getSymbolContent()}
    </div>
  );
};
