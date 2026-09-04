import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Reel } from './Reel';
import { SymbolType, PAYTABLE } from '../types';
import { audio } from '../lib/audio';
import { ChromaKeyVideo } from './ChromaKeyVideo';
import { motion } from 'motion/react';
import { Home, Plus, Info, Minus, Menu } from 'lucide-react';
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

interface VideoSlotProps {
  onBack: () => void;
}

export const VideoSlot: React.FC<VideoSlotProps> = ({ onBack }) => {
  const { balance, spin: globalSpin, addWin } = useGame();
  const { activeEvent } = useCasinoEvents();
  const [bet, setBet] = useState(10000);
  const [spinning, setSpinning] = useState(false);
  
  // Need 5 columns, each with 3 visible rows. We'll track the "center" row for logic, 
  // but let's just let the Reels handle their own visuals. For simplicity, we just pass 
  // one result to each reel (the center symbol) and it stops there. 
  // In a real game we'd check all 3 rows. We'll simplify the win check for this demo.
  const [results, setResults] = useState<SymbolType[]>(['diamond', 'cherry', 'seven', 'lemon', 'jackpot']);
  const [reelsStopped, setReelsStopped] = useState(5);
  const [winAmount, setWinAmount] = useState(0);

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
    
    audio.playLeverPull();
    const spinSound = audio.playReelSpin();

    // Determine results before spinning
    const newResults: SymbolType[] = [getRandomSymbol(activeEvent?.id), getRandomSymbol(activeEvent?.id), getRandomSymbol(activeEvent?.id), getRandomSymbol(activeEvent?.id), getRandomSymbol(activeEvent?.id)];
    setResults(newResults);

    setTimeout(() => {
      spinSound?.stop();
    }, 4800);

  }, [spinning, balance, bet, globalSpin]);

  const handleReelStop = useCallback(() => {
    audio.playReelStop();
    setReelsStopped(prev => prev + 1);
  }, []);

  React.useEffect(() => {
    if (reelsStopped === 5 && spinning) {
      setSpinning(false);
      checkWin(results);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reelsStopped]);

  const checkWin = (currentResults: SymbolType[]) => {
    // Count matches (ignoring positions for this simplified demo)
    const counts = currentResults.reduce((acc, sym) => {
      acc[sym] = (acc[sym] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let maxMatch = 0;
    let winSym = '';
    
    Object.entries(counts).forEach(([sym, count]) => {
      if (count > maxMatch) {
        maxMatch = count;
        winSym = sym;
      }
    });

    let multiplier = 0;
    
    if (maxMatch === 5) {
      multiplier = 500;
    } else if (maxMatch === 4) {
      multiplier = 50;
    } else if (maxMatch === 3) {
      multiplier = 10;
    }

    if (multiplier > 0) {
      if (activeEvent?.id === 'friday_charge' && winSym === 'jackpot') {
        multiplier *= 2;
      }
      if (activeEvent?.id === 'lucky_reels' && winSym === 'seven') {
        multiplier *= 2;
        audio.playChargeUp();
      }
      const won = multiplier * bet;
      setWinAmount(won);
      addWin(won);
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
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-[#140b2e] select-none overflow-hidden font-sans text-white pt-[max(0.5rem,env(safe-area-inset-top))]">
      <CasinoTicker />
      
      {/* Background Dots Pattern (Deep space / halftone style) */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff22_2px,transparent_2px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b0845] via-[#210959] to-[#0a021c] z-0 pointer-events-none mix-blend-overlay"></div>

      {/* Top Navigation Bar (AAA Mobile style) */}
      <div className="min-h-[3.5rem] md:h-16 w-full bg-gradient-to-b from-[#fde047] via-[#eab308] to-[#713f12] flex items-center justify-between px-1 sm:px-2 md:px-6 py-1 z-20 shadow-[0_5px_15px_rgba(0,0,0,0.8)] border-b-[3px] border-[#fef08a] gap-1 sm:gap-2">
        
        {/* Left: Home & Balance */}
        <div className="flex flex-1 min-w-0 items-center gap-1 sm:gap-2 md:gap-4">
          <button onClick={onBack} className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-b from-[#b45309] to-[#451a03] rounded-full border-[2px] sm:border-[3px] border-[#fef08a] shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all">
            <Home className="text-[#fef08a]" fill="currentColor" size={16} />
          </button>
          
          <div className="flex flex-1 min-w-0 max-w-[140px] sm:max-w-[180px] md:max-w-[220px] items-center bg-black/80 rounded-full border-2 border-[#ca8a04] h-7 sm:h-8 md:h-10 pl-1 pr-1 md:pr-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative ml-2 sm:ml-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 shrink-0 rounded-full bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#854d0e] flex items-center justify-center text-[#451a03] font-black text-sm sm:text-lg shadow-[0_2px_4px_rgba(0,0,0,0.6)] border-2 border-[#fef08a] absolute -left-2 sm:-left-3 md:-left-4">
              $
            </div>
            <span className="flex-1 truncate pl-5 sm:pl-6 md:pl-8 pr-1 sm:pr-2 text-white font-bold font-sans text-xs sm:text-sm md:text-base tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
              {balance.toLocaleString('en-US')}
            </span>
            <button className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-b from-[#4ade80] to-[#166534] flex items-center justify-center text-white border-2 border-[#86efac] shadow-[0_2px_4px_rgba(0,0,0,0.5)] hover:brightness-110 active:scale-95 z-10 mr-0 sm:mr-1">
              <Plus size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Center: Buy/Deal Toggle */}
        <div className="hidden lg:flex shrink-0 items-center bg-[#451a03]/80 p-1 rounded-full border-2 border-[#fef08a] shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]">
          <button className="px-6 py-1 bg-gradient-to-b from-[#4ade80] to-[#14532d] rounded-full text-white font-black tracking-widest text-sm shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#86efac]">BUY</button>
          <button className="px-6 py-1 bg-gradient-to-b from-[#f87171] to-[#7f1d1d] rounded-full text-white font-black tracking-widest text-sm shadow-[0_2px_4px_rgba(0,0,0,0.5)] border border-[#fca5a5] ml-1">DEAL</button>
        </div>

        {/* Right: Level & Menu */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4 relative z-50">
          <SettingsControls />
          <div className="hidden md:flex items-center bg-gradient-to-r from-[#1e3a8a] to-[#172554] rounded-full border-2 border-[#60a5fa] h-8 md:h-10 pr-6 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] relative pl-10 ml-6">
            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 text-2xl md:text-3xl drop-shadow-[0_0_8px_rgba(96,165,250,1)] z-10 text-[#60a5fa]">
              ⭐
            </div>
            <span className="text-white font-black tracking-widest text-xs md:text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">LEVEL 3</span>
          </div>
          <button className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-b from-[#fef08a] to-[#b45309] rounded-full border-[2px] sm:border-[3px] border-[#fef08a] shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all text-[#451a03]">
            <Menu size={16} strokeWidth={3} className="sm:hidden" />
            <Menu size={24} strokeWidth={3} className="hidden sm:block" />
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 min-h-0 w-full flex items-stretch justify-center relative z-10">
        
        {/* The Reels Container - AAA Style Golden Frame */}
        <div className="w-full h-full bg-[#0a0410] border-y-[6px] md:border-y-[12px] border-x-0 border-[#fef08a] shadow-[inset_0_5px_20px_rgba(0,0,0,0.9)] relative flex overflow-hidden">
          
          {/* LED Striped Side Rails */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-b from-[#fef08a] via-[#ca8a04] to-[#854d0e] z-20 flex flex-col justify-center items-center border-r-4 border-[#451a03] shadow-[5px_0_15px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center justify-between h-full py-8 text-black font-black font-sans">
              <span className="text-xl md:text-3xl rotate-[-90deg] whitespace-nowrap tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] mb-8">10</span>
              <span className="text-xs md:text-sm rotate-[-90deg] whitespace-nowrap tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] opacity-80">LINES</span>
            </div>
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-gradient-to-b from-[#fef08a] via-[#ca8a04] to-[#854d0e] z-20 flex flex-col justify-center items-center border-l-4 border-[#451a03] shadow-[-5px_0_15px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center justify-between h-full py-8 text-black font-black font-sans">
              <span className="text-xs md:text-sm rotate-[-90deg] whitespace-nowrap tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] opacity-80 mt-8">LINES</span>
              <span className="text-xl md:text-3xl rotate-[-90deg] whitespace-nowrap tracking-widest drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">10</span>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-[#2e1065] via-transparent to-[#2e1065] opacity-50 z-10 pointer-events-none"></div>

          {/* 5 Reels */}
          <div className="flex-1 border-r-4 border-black/80 relative ml-12 md:ml-16">
            <Reel spinning={spinning} result={results[0]} delay={500} onStop={handleReelStop} />
          </div>
          <div className="flex-1 border-r-4 border-black/80 relative">
            <Reel spinning={spinning} result={results[1]} delay={1000} onStop={handleReelStop} />
          </div>
          <div className="flex-1 border-r-4 border-black/80 relative">
            <Reel spinning={spinning} result={results[2]} delay={1500} onStop={handleReelStop} />
          </div>
          <div className="flex-1 border-r-4 border-black/80 relative">
            <Reel spinning={spinning} result={results[3]} delay={2000} onStop={handleReelStop} />
          </div>
          <div className="flex-1 relative mr-12 md:mr-16">
            <Reel spinning={spinning} result={results[4]} delay={2500} onStop={handleReelStop} />
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
            {winAmount > 0 ? `WON $${winAmount}!` : ''}
          </span>
        </div>

      </div>

      {/* Bottom Control Bar (AAA Mobile style) */}
      <div className="h-28 md:h-32 w-full bg-[#1e293b] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] border-t-8 border-[#fef08a] shadow-[0_-15px_30px_rgba(0,0,0,0.8)] relative z-30 flex items-center justify-between px-1 sm:px-2 md:px-12 pb-2 gap-1 sm:gap-2 md:gap-6">
        
        {/* Info Button */}
        <button className="hidden sm:flex w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-gradient-to-b from-[#ef4444] to-[#7f1d1d] border-[3px] border-[#fca5a5] shadow-[0_5px_10px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.4)] flex items-center justify-center text-white hover:brightness-110 active:translate-y-1 transition-all">
          <Info size={32} strokeWidth={3} />
        </button>

        {/* Bet Controls Box */}
        <div className="flex-1 min-w-0 max-w-[200px] flex items-center justify-between bg-black/80 rounded-[2rem] border-2 border-[#ca8a04] px-1 py-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
          <button 
            onClick={() => !spinning && setBet(Math.max(10, bet - 1000))}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-gradient-to-b from-[#3b82f6] to-[#1e3a8a] border-2 border-[#93c5fd] flex items-center justify-center shadow-md active:translate-y-1 hover:brightness-110"
          >
            <Minus size={20} strokeWidth={3} />
          </button>
          
          <div className="flex flex-col items-center justify-center px-1 sm:px-2 md:px-6 truncate">
            <span className="text-[8px] sm:text-[10px] md:text-xs text-[#60a5fa] font-black tracking-widest uppercase drop-shadow-md">TOTAL BET</span>
            <span className="text-xs sm:text-sm md:text-xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] truncate">
              {bet.toLocaleString('en-US')}
            </span>
          </div>

          <button 
            onClick={() => !spinning && setBet(Math.min(balance, bet + 1000))}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-gradient-to-b from-[#3b82f6] to-[#1e3a8a] border-2 border-[#93c5fd] flex items-center justify-center shadow-md active:translate-y-1 hover:brightness-110"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Total Win Display */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-[#172554] border-[3px] border-[#60a5fa] rounded-xl px-8 py-2 min-w-[200px] md:min-w-[250px] shadow-[inset_0_5px_15px_rgba(0,0,0,0.8),0_0_15px_rgba(59,130,246,0.3)]">
          <span className="text-[10px] md:text-sm text-[#93c5fd] font-black tracking-widest uppercase drop-shadow-md">TOTAL WIN</span>
          <span className={`text-2xl md:text-4xl font-black transition-colors ${winAmount > 0 ? 'text-[#fef08a] drop-shadow-[0_0_10px_rgba(250,204,21,1)]' : 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]'}`}>
            {winAmount > 0 ? winAmount.toLocaleString('en-US') : '0'}
          </span>
        </div>

        {/* Max Bet & Spin */}
        <div className="flex flex-1 sm:flex-none justify-end items-center gap-1 sm:gap-2 md:gap-6">
          <button 
            onClick={() => !spinning && setBet(balance)}
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 rounded-full bg-gradient-to-b from-[#c084fc] to-[#6b21a8] border-[3px] sm:border-[4px] border-[#e9d5ff] shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_4px_8px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center active:translate-y-1 hover:brightness-110 transition-all group"
          >
            <span className="text-white font-black text-[10px] sm:text-sm md:text-base drop-shadow-md group-hover:text-yellow-200">MAX</span>
            <span className="text-white font-black text-[10px] sm:text-sm md:text-base drop-shadow-md group-hover:text-yellow-200">BET</span>
          </button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleSpin}
            disabled={spinning || balance < bet}
            className="relative flex-[2] sm:flex-none w-full min-w-[80px] max-w-[160px] sm:w-28 h-16 sm:h-20 md:w-40 md:h-28 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#14532d] border-[4px] sm:border-[6px] border-[#86efac] shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_4px_15px_rgba(255,255,255,0.6)] flex flex-col items-center justify-center group disabled:opacity-50 disabled:grayscale transition-all"
          >
            <span className="text-white font-black text-xl sm:text-3xl md:text-4xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] tracking-wider">SPIN</span>
            <span className="text-[#dcfce7] text-[6px] sm:text-[9px] md:text-xs font-bold mt-0 sm:mt-1 opacity-90 tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">HOLD FOR AUTOSPIN</span>
          </motion.button>
        </div>

      </div>

    </div>
  );
};
