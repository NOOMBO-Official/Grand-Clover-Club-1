import React, { useState, useEffect } from 'react';

const EVENTS = [
  "🌟 BIG WIN ON MACHINE #42: $5,000! 🌟",
  "🎰 New VIP lounge now open for Grand Clover Club members!",
  "💰 Progressive Jackpot is heating up! Play now!",
  "🍸 Happy Hour at the Martini Bar: Half price drinks until 7 PM.",
  "✨ Welcome to the Grand Clover Club - Where luck meets luxury! ✨",
  "🔥 HOT STREAK: Player 'LuckyDan' just hit 5 wins in a row!",
  "💎 Collect 100 spins to unlock the Dedicated Spinner achievement!",
  "⚡ FRIDAY NIGHTS ARE CHARGED UP! 2X Multiplier on all Jackpot wins from 8PM to Midnight!",
  "🎉 WEEKEND MADNESS: Play 100 spins this weekend to enter the $50,000 Grand Drawing!",
  "🍻 Friday Night Special: Free drinks for all Grand Clover Club platinum members!",
  "🤑 Sunday Funday! Earn double loyalty points on every spin!",
  "💎 The Weekend Vault is open! Massive payouts all weekend long!",
];

export const CasinoTicker: React.FC = () => {
  const [tickerText, setTickerText] = useState(EVENTS.join("  |  "));

  useEffect(() => {
    // Occasionally update or shuffle the ticker text to keep it fresh
    const interval = setInterval(() => {
      const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
      setTickerText(shuffled.join("  |  "));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-8 bg-black/80 border-b border-yellow-600/50 z-50 overflow-hidden flex items-center shadow-lg">
      <div className="whitespace-nowrap animate-ticker inline-block text-sm md:text-base font-medium tracking-wide text-yellow-200/90" style={{ textShadow: '0 0 5px rgba(250,204,21,0.5)', fontFamily: 'Courier New, monospace' }}>
        {tickerText}  |  {tickerText}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
      `}</style>
    </div>
  );
};
