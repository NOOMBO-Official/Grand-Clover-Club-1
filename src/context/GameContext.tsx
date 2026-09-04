import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audio } from '../lib/audio';
import { db, auth, googleProvider } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';

interface GameState {
  balance: number;
  jackpot: number;
  spins: number;
  winStreak: number;
  achievements: string[];
  volume: number;
  isMuted: boolean;
  gameSpeed: number;
  user: User | null;
  oauthToken: string | null;
  spin: (bet: number) => void;
  addWin: (amount: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setGameSpeed: (s: number) => void;
  toastMessage: string | null;
  clearToast: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loginWithSunniFanzz: () => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [balance, setBalance] = useState(20670000); 
  const [jackpot, setJackpot] = useState(1450230.50);
  const [spins, setSpins] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SunniFanzz OAuth Handler
  useEffect(() => {
    // Check URL for OAuth callback (could be in hash or search params depending on implicit vs code flow)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const token = urlParams.get('access_token') || urlParams.get('token');
    
    // Also check hash (implicit flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashToken = hashParams.get('access_token');
    const urlBalance = urlParams.get('coinBalance') || hashParams.get('coinBalance');

    const finalToken = token || hashToken || code;
    
    if (finalToken) {
      if (window.opener) {
        window.opener.postMessage({ type: 'OAUTH_SUCCESS', token: finalToken, coinBalance: urlBalance }, '*');
        window.close();
      } else {
        setOauthToken(finalToken);
        if (urlBalance) {
           setBalance(Number(urlBalance));
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.token) {
        setOauthToken(event.data.token);
        if (event.data.coinBalance !== undefined) {
           setBalance(Number(event.data.coinBalance));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Firebase Auth Handler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !oauthToken) { // Firebase takes precedence unless OAuth is active
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            // User requested to explicitly use coinBalance (int64) and not a double field
            if (data.coinBalance !== undefined) {
              setBalance(Math.floor(Number(data.coinBalance)));
            } else if (data.balance !== undefined) {
              // Fallback just in case, but prefer coinBalance
              setBalance(Math.floor(Number(data.balance)));
            } else {
              // Fallback to local default if somehow missing, but DO NOT write 0 to DB
              setBalance(20670000);
            }
          } else {
            // User doesn't exist, don't create them here with a 0 balance!
            setBalance(20670000);
          }
        } catch (error) {
          console.error("Firestore error fetching user balance:", error);
          console.warn("Using local state for balance due to offline environment.");
        }
      }
    });

    return () => unsubscribe();
  }, [oauthToken]);

  // Progressive jackpot tick
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => prev + (Math.random() * 2.5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const loginWithSunniFanzz = () => {
    const clientId = 'vY1If53jTBpQsXvdZU4r';
    const redirectUri = encodeURIComponent(window.location.origin);
    const url = `https://ais-dev-qhsdljjsfdd5dewx655syy-155879438687.us-east1.run.app/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
    
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(url, 'oauth_popup', `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`);
  };

  const logout = async () => {
    try {
      if (user) {
        await signOut(auth);
      }
      setOauthToken(null);
      setUser(null);
      setBalance(20670000); // Reset to default on logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const showAchievement = (msg: string) => {
    if (!achievements.includes(msg)) {
      setAchievements(prev => [...prev, msg]);
      setToastMessage(`🏆 Achievement Unlocked: ${msg}!`);
      audio.playAchievement();
    }
  };

  const updateBalanceInDb = async (change: number) => {
    if (!user) return; // If OAuth, we only update local state unless we build an API for it
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        coinBalance: increment(change)
      });
    } catch (error) {
      console.error("Firestore error updating balance:", error);
      console.warn("Unable to update balance in DB. Using local state.");
    }
  };

  const spin = (bet: number) => {
    setBalance(prev => prev - bet);
    updateBalanceInDb(-bet);
    
    setSpins(prev => {
      const newSpins = prev + 1;
      if (newSpins === 10) showAchievement('First 10 Spins');
      if (newSpins === 100) showAchievement('Dedicated Spinner (100 Spins)');
      return newSpins;
    });
    setWinStreak(0); // Reset on spin, added on win
    setJackpot(prev => prev + (bet * 0.05)); // Add to jackpot
  };

  const addWin = (amount: number) => {
    setBalance(prev => prev + amount);
    updateBalanceInDb(amount);
    
    setWinStreak(prev => {
      const newStreak = prev + 1;
      if (newStreak === 3) showAchievement('Lucky Streak (3 Wins)');
      if (newStreak === 5) showAchievement('On Fire (5 Wins!)');
      return newStreak;
    });
    if (amount > 500) {
      showAchievement('BIG WIN');
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (!isMuted) {
      audio.setVolume(v);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      audio.setVolume(newMuted ? 0 : volume);
      return newMuted;
    });
  };

  return (
    <GameContext.Provider value={{ balance, jackpot, spins, winStreak, achievements, volume, isMuted, gameSpeed, user, oauthToken, spin, addWin, setVolume, toggleMute, setGameSpeed, toastMessage, clearToast: () => setToastMessage(null), loginWithGoogle, loginWithSunniFanzz, logout }}>
      {children}
      
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-[9999] bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-8 py-4 rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-2 border-white animate-bounce">
          {toastMessage}
        </div>
      )}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
