import { useState, useEffect, useRef } from 'react';

export interface CasinoEvent {
  id: string;
  name: string;
  description: string;
  theme: 'purple' | 'gold' | 'blue';
}

export const useCasinoEvents = () => {
  const [activeEvent, setActiveEvent] = useState<CasinoEvent | null>(null);
  const [timeToFriday, setTimeToFriday] = useState<string>("");
  const [newEventToast, setNewEventToast] = useState<CasinoEvent | null>(null);
  const prevEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    const calculateEvents = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      let currentEvent: CasinoEvent | null = null;

      // Active Event Logic
      if (day === 5 && hour >= 18) {
        currentEvent = { id: 'friday_charge', name: 'Friday Nights Charged Up', description: '2x Multiplier on Jackpots!', theme: 'purple' };
      } else if (day === 6 || day === 0) {
        currentEvent = { id: 'weekend_vault', name: 'The Weekend Vault', description: 'Massive payouts all weekend!', theme: 'gold' };
      } else if (day === 3 && hour >= 16) { 
        // Active from 4PM on Wednesdays
        currentEvent = { id: 'jackpot_fever', name: 'Jackpot Fever', description: 'Extra Jackpot symbols on the reels!', theme: 'blue' };
      } else if (day === 2 && hour >= 16) {
        // Active from 4PM on Tuesdays
        currentEvent = { id: 'lucky_reels', name: 'Lucky Reels', description: '2x Multiplier on all 7s!', theme: 'gold' };
      }

      if (currentEvent?.id !== prevEventIdRef.current) {
        if (currentEvent) {
          setNewEventToast(currentEvent);
          setTimeout(() => setNewEventToast(null), 6000);
        }
        prevEventIdRef.current = currentEvent?.id || null;
        setActiveEvent(currentEvent);
      }

      // Countdown to Friday 6PM (18:00)
      const nextFriday = new Date();
      if (day === 5 && hour >= 18) {
        // Currently active, point to next week
        nextFriday.setDate(now.getDate() + 7);
      } else {
        // Calculate days until next Friday
        const daysUntilFriday = (5 - day + 7) % 7;
        nextFriday.setDate(now.getDate() + (daysUntilFriday === 0 && hour >= 18 ? 7 : daysUntilFriday));
      }
      nextFriday.setHours(18, 0, 0, 0);

      const diff = nextFriday.getTime() - now.getTime();
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeToFriday(`${d} DAYS : ${h.toString().padStart(2, '0')} HRS : ${m.toString().padStart(2, '0')} MIN : ${s.toString().padStart(2, '0')} SEC`);
    };

    calculateEvents();
    const interval = setInterval(calculateEvents, 1000);
    return () => clearInterval(interval);
  }, []);

  return { activeEvent, timeToFriday, newEventToast };
};
