import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { SlotSymbol } from './SlotSymbol';
import { SymbolType } from '../types';
import { useGame } from '../context/GameContext';

interface ReelProps {
  spinning: boolean;
  result: SymbolType;
  delay: number; // Delay before stopping
  onStop: () => void;
  theme?: 'light' | 'dark';
}

const ALL_SYMBOLS: SymbolType[] = [
  'cherry', 'lemon', 'diamond', 'seven', 'jackpot'
];

export const Reel: React.FC<ReelProps> = ({ spinning, result, delay, onStop, theme = 'light' }) => {
  const [displaySymbols, setDisplaySymbols] = useState<SymbolType[]>([]);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbolHeight, setSymbolHeight] = useState(150);
  const { gameSpeed } = useGame();
  
  // Update symbol height based on container size to always show exactly 3 symbols
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setSymbolHeight(containerRef.current.offsetHeight / 3);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Initialize with random symbols
  useEffect(() => {
    const initial = Array.from({ length: 20 }, () => ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
    setDisplaySymbols(initial);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (spinning) {
      // Create a long strip of symbols for spinning
      const spinStrip = Array.from({ length: 40 }, () => ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
      
      // Ensure the target result is the center symbol (index length - 2)
      const centerIndex = spinStrip.length - 2;
      spinStrip[centerIndex] = result; 
      
      setDisplaySymbols(spinStrip);

      // Start the infinite spin animation
      controls.start({
        y: [0, -1500],
        transition: {
          y: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 0.3 / gameSpeed,
            ease: 'linear',
          }
        }
      });

      // Schedule the stop
      timeoutId = setTimeout(() => {
        const targetY = -((centerIndex - 1) * symbolHeight);
        
        controls.stop();
        controls.start({
          y: targetY,
          transition: {
            type: 'spring',
            stiffness: 70 * gameSpeed,
            damping: 15 / Math.sqrt(gameSpeed),
            mass: 1,
            restDelta: 0.01
          }
        }).then(() => {
          onStop();
        });
      }, delay / gameSpeed);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [spinning, result, delay, controls, onStop, symbolHeight, gameSpeed]);

  const bgClass = theme === 'dark' 
    ? "bg-gradient-to-b from-black via-gray-900 to-black"
    : "bg-gradient-to-b from-[#e2e8f0] via-[#ffffff] to-[#e2e8f0]";

  return (
    <div ref={containerRef} className={`relative w-full h-full ${bgClass} overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]`}>
      {/* Curved shadows for 3D drum effect */}
      <div className="absolute top-0 left-0 w-full h-[35%] bg-gradient-to-b from-black/60 via-black/10 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[35%] bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10 pointer-events-none" />
      
      {/* Reel Strip */}
      <motion.div 
        animate={controls}
        className={`flex flex-col items-center w-full absolute top-0 ${spinning ? 'blur-[3px]' : ''}`}
        style={{ willChange: 'transform' }}
      >
        {displaySymbols.map((sym, i) => (
          <div key={i} style={{ height: symbolHeight }} className="w-full flex items-center justify-center shrink-0 border-b border-gray-400/20 px-2">
            <SlotSymbol type={sym} className="w-full h-full drop-shadow-2xl object-contain py-4" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};
