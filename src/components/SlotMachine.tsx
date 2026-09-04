import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Reel } from './Reel';
import { SymbolType, PAYTABLE } from '../types';
import { audio } from '../lib/audio';
import { ChromaKeyVideo } from './ChromaKeyVideo';
import { motion } from 'motion/react';
import { ArrowLeft, HelpCircle, Menu } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { SettingsControls } from './SettingsControls';
import { CasinoTicker } from './CasinoTicker';
import { useCasinoEvents } from '../hooks/useCasinoEvents';

const SYMBOL_WEIGHTS: Record<SymbolType, number> = {
  cherry: 30,
  lemon: 25,
  diamond: 15,
  seven: 10,
  jackpot: 2,
};

const getRandomSymbol = (activeEventId?: string): SymbolType => {
  let weights = { ...SYMBOL_WEIGHTS };
  
  if (activeEventId === 'jackpot_fever') {
    weights.jackpot = 20; // Massive increase
    weights.cherry = 10;
    weights.lemon = 10;
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  for (const [sym, weight] of Object.entries(weights)) {
    if (rand < weight) return sym as SymbolType;
    rand -= weight;
  }
  return 'cherry';
};

interface SlotMachineProps {
  onBack: () => void;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({ onBack }) => {
  const { balance, spin: globalSpin, addWin } = useGame();
  const { activeEvent } = useCasinoEvents();
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<SymbolType[]>(['seven', 'seven', 'seven']);
  const [reelsStopped, setReelsStopped] = useState(3);
  const [winAmount, setWinAmount] = useState(0);
  const [lastWinStr, setLastWinStr] = useState<string>('');

  React.useEffect(() => {
    if (activeEvent) {
      audio.playChargeUp();
    }
  }, [activeEvent?.id]);

  const handleSpin = useCallback(() => {
    if (spinning || balance < bet) return;
    
    globalSpin(bet);
    setSpinning(true);
    setReelsStopped(0);
    setWinAmount(0);
    setLastWinStr('');
    
    audio.playLeverPull();
    const spinSound = audio.playReelSpin();

    // Determine results before spinning
    const newResults: SymbolType[] = [getRandomSymbol(activeEvent?.id), getRandomSymbol(activeEvent?.id), getRandomSymbol(activeEvent?.id)];
    setResults(newResults);

    // Stop spin sound slightly before last reel stops
    setTimeout(() => {
      spinSound?.stop();
    }, 2800);

  }, [spinning, balance, bet, globalSpin]);

  const handleReelStop = useCallback(() => {
    audio.playReelStop();
    setReelsStopped(prev => prev + 1);
  }, []);

  React.useEffect(() => {
    if (reelsStopped === 3 && spinning) {
      setSpinning(false);
      checkWin(results);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelsStopped]);

  const checkWin = (currentResults: SymbolType[]) => {
    const resKey = currentResults.join(',');
    let multiplier = 0;
    
    if (PAYTABLE[resKey]) {
      multiplier = PAYTABLE[resKey];
    } else if (currentResults[0] === 'cherry' && currentResults[1] === 'cherry') {
      multiplier = 5;
    } else if (currentResults[0] === 'cherry') {
      multiplier = 2;
    }

    if (multiplier > 0) {
      if (activeEvent?.id === 'friday_charge' && PAYTABLE[resKey] && currentResults[0] === 'jackpot') {
        multiplier *= 2;
      }
      if (activeEvent?.id === 'lucky_reels' && PAYTABLE[resKey] && currentResults[0] === 'seven') {
        multiplier *= 2;
        audio.playChargeUp();
      }
      const won = multiplier * bet;
      setWinAmount(won);
      addWin(won);
      setLastWinStr(`WON $${won}!`);
      audio.playWinBell();
      audio.playCoinFountain(3);
      triggerConfetti();
    } else {
      audio.playLose();
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col bg-[#1a0a00] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] select-none overflow-hidden font-sans text-white pt-8">
      <CasinoTicker />
      
      {/* Background Lighting / Saloon Vibe */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#451a03] via-[#78350f] to-[#271000] z-0 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[radial-gradient(circle,rgba(251,191,36,0.2)_0%,transparent_60%)] pointer-events-none z-0"></div>
      
      {/* Saloon Background Accents */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0 pointer-events-none"></div>

      {/* Top Navigation Bar (AAA Mobile style - matching the image) */}
      <div className="h-12 md:h-16 w-full bg-gradient-to-b from-[#1e293b] to-[#020617] border-b-[3px] border-[#fbbf24] flex items-center justify-between px-2 md:px-6 z-50 shadow-[0_5px_20px_rgba(0,0,0,0.9)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent opacity-50"></div>
        
        {/* Left: Star / Level progress */}
        <div className="flex items-center">
          <div className="relative w-32 md:w-48 h-6 md:h-8 bg-[#0f172a] border-2 border-[#475569] rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] ml-4 md:ml-8">
             <div className="absolute -left-6 md:-left-8 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04] rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.8)] z-10">
               <span className="text-xl md:text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">⭐</span>
             </div>
             <div className="h-full w-2/3 bg-gradient-to-r from-[#60a5fa] to-[#1d4ed8] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]"></div>
          </div>
        </div>

        {/* Center: Coin Balance */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
           <div className="relative w-40 md:w-56 h-7 md:h-9 bg-[#0f172a] border-2 border-[#475569] rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
             <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-b from-[#fef08a] to-[#ca8a04] rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.5)] z-10 text-[#451a03] font-black">
               $
             </div>
             <span className="text-white font-black font-sans text-sm md:text-lg tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)] pl-4">
               {balance.toLocaleString('en-US')}
             </span>
           </div>
        </div>

        {/* Right: Blue Buttons */}
        <div className="flex items-center gap-2 md:gap-4 relative z-50">
          <SettingsControls />
          <button className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-b from-[#60a5fa] to-[#1e3a8a] border-[3px] border-[#bfdbfe] shadow-[0_3px_5px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center text-white font-black text-lg md:text-2xl hover:brightness-110 active:translate-y-1 transition-all">
            <HelpCircle size={24} strokeWidth={3} className="drop-shadow-md hidden md:block" />
            <span className="md:hidden">?</span>
          </button>
          <button onClick={onBack} className="w-16 h-8 md:w-24 md:h-12 rounded-full bg-gradient-to-b from-[#60a5fa] to-[#1e3a8a] border-[3px] border-[#bfdbfe] shadow-[0_3px_5px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center text-white hover:brightness-110 active:translate-y-1 transition-all">
            <ArrowLeft size={24} strokeWidth={4} className="drop-shadow-md" />
          </button>
          <button className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-gradient-to-b from-[#60a5fa] to-[#1e3a8a] border-[3px] border-[#bfdbfe] shadow-[0_3px_5px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center text-white hover:brightness-110 active:translate-y-1 transition-all">
            <Menu size={24} strokeWidth={3} className="drop-shadow-md" />
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative px-2 py-4 z-10">
        
        {/* GOLD RUSH Marquee */}
        <div className="relative z-30 -mb-6 md:-mb-10 pointer-events-none drop-shadow-[0_15px_15px_rgba(0,0,0,0.9)]">
          <div className="absolute inset-0 bg-[#451a03] border-4 border-[#ca8a04] rounded-xl transform scale-y-110 shadow-inner mix-blend-overlay"></div>
          <div className="bg-gradient-to-b from-[#78350f] via-[#451a03] to-[#271000] border-[4px] md:border-[6px] border-[#fde047] rounded-xl px-10 py-3 md:px-16 md:py-6 shadow-[0_10px_20px_rgba(0,0,0,0.9),inset_0_5px_10px_rgba(255,255,255,0.2)]">
            <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309] tracking-widest" style={{ WebkitTextStroke: '2px #451a03', filter: 'drop-shadow(0 5px 2px rgba(0,0,0,0.9))' }}>
              GOLD RUSH
            </h1>
          </div>
        </div>

        {/* Wooden Slot Frame */}
        <div className="w-full max-w-[90vw] md:max-w-[70vw] h-full max-h-[550px] md:max-h-[650px] bg-[#2a1200] rounded-sm border-x-[20px] md:border-x-[40px] border-y-[24px] md:border-y-[48px] border-[#5c2e0e] relative flex shadow-[0_30px_60px_rgba(0,0,0,1),inset_0_20px_40px_rgba(0,0,0,1)]" style={{ borderImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png") 40 stretch' }}>
          
          {/* Decorative Star Rails (Left) */}
          <div className="absolute -left-[18px] md:-left-[36px] top-0 bottom-0 w-[16px] md:w-[32px] flex flex-col justify-between py-2 md:py-4 z-20">
            {['#4ade80', '#22c55e', '#eab308', '#f59e0b', '#ef4444', '#b91c1c', '#ec4899', '#be185d'].map((color, i) => (
               <div key={`l-star-${i}`} className="w-full flex justify-center text-center text-[10px] md:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ color }}>⭐</div>
            ))}
          </div>

          {/* Decorative Star Rails (Right) */}
          <div className="absolute -right-[18px] md:-right-[36px] top-0 bottom-0 w-[16px] md:w-[32px] flex flex-col justify-between py-2 md:py-4 z-20">
            {['#4ade80', '#22c55e', '#eab308', '#f59e0b', '#ef4444', '#b91c1c', '#ec4899', '#be185d'].map((color, i) => (
               <div key={`r-star-${i}`} className="w-full flex justify-center text-center text-[10px] md:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ color }}>⭐</div>
            ))}
          </div>

          {/* Inner Reels Area */}
          <div className="flex-1 w-full h-full flex bg-black relative">
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-20 pointer-events-none"></div>
            
            {/* Reel 1 */}
            <div className="flex-1 relative z-10">
              <Reel spinning={spinning} result={results[0]} delay={500} onStop={handleReelStop} theme="dark" />
            </div>
            {/* Wooden Divider */}
            <div className="w-3 md:w-6 h-full bg-[#5c2e0e] border-x-2 border-[#3e1b05] z-30 shadow-[0_0_15px_rgba(0,0,0,0.9)]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>
            
            {/* Reel 2 */}
            <div className="flex-1 relative z-10">
              <Reel spinning={spinning} result={results[1]} delay={1000} onStop={handleReelStop} theme="dark" />
            </div>
            {/* Wooden Divider */}
            <div className="w-3 md:w-6 h-full bg-[#5c2e0e] border-x-2 border-[#3e1b05] z-30 shadow-[0_0_15px_rgba(0,0,0,0.9)]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>
            
            {/* Reel 3 */}
            <div className="flex-1 relative z-10">
              <Reel spinning={spinning} result={results[2]} delay={1500} onStop={handleReelStop} theme="dark" />
            </div>
          </div>
          
        </div>
        
        {/* Flag Girl Overlay */}
        <ChromaKeyVideo 
          src="https://firebasestorage.googleapis.com/v0/b/cosmic-backbone-489617-j1.firebasestorage.app/o/game%20assets%2FFlag%20Girl%20Video%20%231.mp4?alt=media&token=6e44bfb6-4d42-4648-90b9-2aba1202cd76"
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] max-w-[900px] h-[150%] md:h-[160%] z-[70] pointer-events-none transition-all duration-700 ease-out origin-center ${winAmount > 0 && activeEvent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        />

        {/* Floating Win Alert */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[80] pointer-events-none flex flex-col items-center">
          {activeEvent && winAmount >= bet * 5 && (
            <span className={`text-4xl md:text-6xl font-black text-fuchsia-400 drop-shadow-[0_10px_30px_rgba(232,121,249,1)] transition-all duration-300 animate-bounce mb-4 text-center ${winAmount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} style={{ WebkitTextStroke: '2px #4c1d95' }}>
              ⚡ {activeEvent.name.toUpperCase()} BONUS! ⚡
            </span>
          )}
          <span className={`text-6xl md:text-8xl font-black text-[#fef08a] drop-shadow-[0_10px_30px_rgba(250,204,21,1)] transition-all duration-300 ${winAmount > 0 ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-50'}`} style={{ WebkitTextStroke: '3px #451a03' }}>
            {lastWinStr}
          </span>
        </div>
      </div>

      {/* Bottom Control Deck (Glossy buttons from image) */}
      <div className="h-24 md:h-36 w-full bg-gradient-to-b from-[#374151] to-[#0f172a] border-t-4 border-[#6b7280] shadow-[0_-15px_30px_rgba(0,0,0,1)] relative z-30 flex items-center justify-center px-2 md:px-10 gap-3 md:gap-8 pb-4">
        
        {/* Left: Info/Orange Button */}
        <button className="w-16 h-12 md:w-28 md:h-20 rounded-xl bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#9a3412] border-t-4 border-[#fdba74] border-b-[8px] border-b-[#7c2d12] shadow-[0_10px_20px_rgba(0,0,0,0.9)] active:translate-y-[8px] active:border-b-0 active:mb-[8px] transition-all flex items-center justify-center group">
          <span className="text-white font-black text-[10px] md:text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-90 group-hover:opacity-100">PAYTABLE</span>
        </button>

        {/* Center-Left: Blue Rectangle (Decrease Bet) */}
        <button 
          onClick={() => !spinning && setBet(Math.max(10, bet - 10))}
          className="w-20 h-12 md:w-32 md:h-20 rounded-xl bg-gradient-to-b from-[#60a5fa] via-[#2563eb] to-[#1e3a8a] border-t-4 border-[#bfdbfe] border-b-[8px] border-b-[#172554] shadow-[0_10px_20px_rgba(0,0,0,0.9)] active:translate-y-[8px] active:border-b-0 active:mb-[8px] transition-all flex items-center justify-center group"
        >
          <span className="text-white font-black text-xs md:text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-90 group-hover:opacity-100">BET -</span>
        </button>

        {/* Center: Bet Display */}
        <div className="w-24 h-12 md:w-40 md:h-20 rounded-xl bg-gradient-to-b from-[#1e3a8a] to-[#020617] border-2 border-[#3b82f6] shadow-[inset_0_10px_20px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative overflow-hidden">
           <span className="text-[#93c5fd] text-[8px] md:text-xs font-black tracking-widest absolute top-1 md:top-2 opacity-80">TOTAL BET</span>
           <span className="text-white font-black text-sm md:text-2xl mt-2 md:mt-4 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">${bet}</span>
        </div>

        {/* Center-Right: Blue Rectangle (Increase Bet) */}
        <button 
          onClick={() => !spinning && setBet(Math.min(balance, bet + 10))}
          className="w-20 h-12 md:w-32 md:h-20 rounded-xl bg-gradient-to-b from-[#60a5fa] via-[#2563eb] to-[#1e3a8a] border-t-4 border-[#bfdbfe] border-b-[8px] border-b-[#172554] shadow-[0_10px_20px_rgba(0,0,0,0.9)] active:translate-y-[8px] active:border-b-0 active:mb-[8px] transition-all flex items-center justify-center group"
        >
           <span className="text-white font-black text-xs md:text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] opacity-90 group-hover:opacity-100">BET +</span>
        </button>

        {/* Right: Massive Green Spin Button */}
        <button 
          onClick={handleSpin}
          disabled={spinning || balance < bet}
          className="w-32 h-12 md:w-64 md:h-20 rounded-xl bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#14532d] border-t-4 border-[#bbf7d0] border-b-[8px] border-b-[#064e3b] shadow-[0_10px_20px_rgba(0,0,0,0.9)] active:translate-y-[8px] active:border-b-0 active:mb-[8px] transition-all flex items-center justify-center disabled:grayscale group ml-2 md:ml-4"
        >
          <span className="text-white font-black text-xl md:text-4xl drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)] tracking-widest">SPIN</span>
        </button>

      </div>
    </div>
  );
};
