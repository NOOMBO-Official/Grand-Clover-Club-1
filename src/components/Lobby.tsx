import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, VolumeX, LogIn, LogOut, Mail, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { audio } from '../lib/audio';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useCasinoEvents } from '../hooks/useCasinoEvents';

interface LobbyProps {
  onSelect: (game: 'classic' | 'video') => void;
  authToken?: string | null;
  onLogout?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onSelect }) => {
  const { jackpot, volume, setVolume, user, oauthToken, loginWithGoogle, loginWithSunniFanzz, logout } = useGame();
  const { activeEvent, timeToFriday, newEventToast } = useCasinoEvents();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Start jazz lounge music when lobby opens
    audio.startJazzLoop();
    return () => {};
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowLoginModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const isAuthenticated = user || oauthToken;

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row bg-[#0a0a0a] overflow-hidden">
      <AnimatePresence>
        {newEventToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-black/90 border-[3px] border-yellow-500 rounded-xl p-4 md:p-6 shadow-[0_10px_40px_rgba(250,204,21,0.6)] flex items-center gap-6 backdrop-blur-md pointer-events-auto cursor-pointer"
            onClick={() => { /* optional dismiss */ }}
          >
            <div className="text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,1)]">🔔</div>
            <div>
              <p className="text-yellow-400 font-bold text-xs md:text-sm uppercase tracking-[0.3em] mb-1">New Event Live!</p>
              <p className="text-white font-black text-xl md:text-2xl drop-shadow-md">{newEventToast.name}</p>
            </div>
            <div className="text-4xl animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,1)]" style={{ animationDelay: '0.2s' }}>🔔</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar with Volume and Jackpot - Overlays everything */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 md:px-8 z-50 pointer-events-none">
        <button 
          onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
          className="text-yellow-500 hover:text-yellow-300 p-2 rounded-full border border-yellow-700/50 hover:bg-white/10 transition-colors pointer-events-auto bg-black/50"
        >
          {volume > 0 ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
        
        <div className="flex flex-col items-center bg-black/90 px-6 md:px-12 py-2 rounded-b-3xl border-x-4 border-b-4 border-yellow-600 shadow-[0_10px_30px_rgba(0,0,0,1)] pointer-events-auto">
          <span className="text-yellow-600 text-[10px] md:text-xs font-bold tracking-widest">PROGRESSIVE JACKPOT</span>
          <span className="text-2xl md:text-4xl font-mono text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]">
            ${jackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="pointer-events-auto">
          {isAuthenticated ? (
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-yellow-500 hover:text-yellow-300 px-4 py-2 rounded-full border border-yellow-700/50 hover:bg-white/10 transition-colors bg-black/50 font-bold tracking-widest text-sm"
            >
              <LogOut size={18} /> LOGOUT
            </button>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 text-yellow-500 hover:text-yellow-300 px-4 py-2 rounded-full border border-yellow-700/50 hover:bg-white/10 transition-colors bg-black/50 font-bold tracking-widest text-sm"
            >
              <LogIn size={18} /> LOGIN
            </button>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && !isAuthenticated && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-b from-[#1a0f0f] to-[#0a0505] p-6 md:p-8 rounded-3xl border-4 border-yellow-700 shadow-[0_20px_50px_rgba(0,0,0,1)] max-w-md w-full relative pointer-events-auto"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-black text-center text-yellow-500 mb-6 font-serif">SIGN IN</h2>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => { loginWithSunniFanzz(); setShowLoginModal(false); }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl font-bold text-white shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  Sign in with SunniFanzz
                </button>
                
                <button 
                  onClick={() => { loginWithGoogle(); setShowLoginModal(false); }}
                  className="w-full py-3 px-4 bg-white text-gray-900 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Sign in with Google
                </button>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-700"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-bold">OR EMAIL</span>
                  <div className="flex-grow border-t border-gray-700"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border-2 border-yellow-900/50 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black border-2 border-yellow-900/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  
                  {authError && <p className="text-red-500 text-sm text-center font-bold">{authError}</p>}
                  
                  <button 
                    type="submit"
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-xl font-black text-yellow-950 shadow-[0_5px_15px_rgba(250,204,21,0.3)] hover:brightness-110 transition-all"
                  >
                    {isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}
                  </button>
                </form>
                
                <p className="text-center text-sm text-gray-400 mt-2">
                  {isSignUp ? 'Already have an account?' : 'Need an account?'}
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    type="button"
                    className="ml-2 text-yellow-500 hover:text-yellow-400 font-bold"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grand Title - Floating in Center */}
      <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none text-center w-full">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, type: 'spring' }}
        >
          <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-yellow-600 tracking-widest drop-shadow-[0_10px_20px_rgba(0,0,0,1)]" style={{ fontFamily: 'Georgia, serif' }}>
            GRAND CLOVER
          </h1>
          <h2 className="text-xl md:text-3xl text-white font-bold tracking-[0.5em] mt-2 drop-shadow-[0_5px_10px_rgba(0,0,0,1)] bg-black/50 inline-block px-8 py-2 rounded-full border border-white/20 backdrop-blur-md">
            CLUB
          </h2>
        </motion.div>

        {/* Dynamic Event Banner / Countdown */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', bounce: 0.5 }}
          className="mt-6 pointer-events-auto flex flex-col items-center gap-4"
        >
          {activeEvent ? (
            <div className={`bg-gradient-to-r ${activeEvent.theme === 'purple' ? 'from-purple-900 via-indigo-900 to-purple-900 border-fuchsia-400 shadow-[0_0_30px_rgba(192,132,252,0.6)] text-fuchsia-300' : activeEvent.theme === 'gold' ? 'from-yellow-900 via-amber-900 to-yellow-900 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] text-yellow-300' : 'from-blue-900 via-cyan-900 to-blue-900 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)] text-cyan-300'} border-2 p-3 px-6 md:px-8 rounded-full inline-flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform`} title={activeEvent.description}>
               <span className="text-2xl md:text-3xl animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">⚡</span>
               <div className="text-center md:text-left">
                  <p className="font-black text-xs md:text-sm tracking-widest uppercase text-shadow-sm">Event Active!</p>
                  <p className="text-white font-bold text-sm md:text-lg drop-shadow-md">{activeEvent.name}</p>
               </div>
               <span className="text-2xl md:text-3xl animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">⚡</span>
            </div>
          ) : (
            <div className="bg-black/80 border border-yellow-600/50 p-4 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,1)] text-center w-full max-w-md backdrop-blur-md">
               <p className="text-yellow-500 font-bold tracking-widest text-xs mb-2 uppercase" style={{ fontFamily: 'Georgia, serif' }}>Next Friday Night Charge-Up</p>
               <div className="bg-zinc-900 rounded-lg p-2 border-2 border-zinc-700 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
                 <span className="text-red-500 font-black text-lg md:text-2xl tracking-[0.2em] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" style={{ fontFamily: 'Courier New, monospace' }}>
                   {timeToFriday}
                 </span>
               </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Classic 3-Reel Side (Left/Top) */}
      <div 
        onClick={() => onSelect('classic')}
        className="group relative flex-1 w-full h-full cursor-pointer overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-yellow-600/50 hover:border-yellow-400 transition-colors"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900 to-[#2a0808] opacity-90 group-hover:opacity-100 transition-opacity z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.2),_transparent_70%)] z-0 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-end md:justify-center h-full p-10 pb-20 md:pb-10 text-center">
          <div className="flex gap-2 mb-6 drop-shadow-[0_0_20px_rgba(255,0,0,1)] transform group-hover:-translate-y-4 transition-transform duration-500">
            <span className="text-7xl md:text-9xl font-black text-red-500">7</span>
            <span className="text-7xl md:text-9xl font-black text-red-500">7</span>
            <span className="text-7xl md:text-9xl font-black text-red-500">7</span>
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-yellow-500 mb-4 font-serif drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">CLASSIC 3-REEL</h3>
          <p className="text-yellow-200/80 text-lg mb-8 max-w-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Experience the authentic mechanical feel of the golden era.</p>
          
          <div className="flex items-center gap-3 text-yellow-900 font-black text-xl bg-gradient-to-b from-yellow-300 to-yellow-600 px-8 py-4 rounded-full border-2 border-yellow-200 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all shadow-xl">
            <Play size={28} fill="currentColor" />
            <span>PLAY CLASSIC</span>
          </div>
        </div>
      </div>

      {/* Modern 5-Reel Side (Right/Bottom) */}
      <div 
        onClick={() => onSelect('video')}
        className="group relative flex-1 w-full h-full cursor-pointer overflow-hidden border-t-4 md:border-t-0 md:border-l-4 border-purple-600/50 hover:border-purple-400 transition-colors"
      >
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-900 to-[#0f0b29] opacity-90 group-hover:opacity-100 transition-opacity z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.2),_transparent_70%)] z-0 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-end md:justify-center h-full p-10 pb-20 md:pb-10 text-center">
          <div className="flex gap-2 mb-6 drop-shadow-[0_0_20px_rgba(168,85,247,1)] text-purple-300 transform group-hover:-translate-y-4 transition-transform duration-500">
            <div className="w-12 h-16 md:w-16 md:h-24 bg-black border-4 border-purple-500 rounded-lg flex items-center justify-center text-3xl md:text-5xl shadow-inner">💎</div>
            <div className="w-12 h-16 md:w-16 md:h-24 bg-black border-4 border-purple-500 rounded-lg flex items-center justify-center text-3xl md:text-5xl shadow-inner">💎</div>
            <div className="w-12 h-16 md:w-16 md:h-24 bg-black border-4 border-purple-500 rounded-lg flex items-center justify-center text-3xl md:text-5xl shadow-inner">💎</div>
            <div className="hidden md:flex w-16 h-24 bg-black border-4 border-purple-500 rounded-lg items-center justify-center text-5xl shadow-inner">💎</div>
            <div className="hidden md:flex w-16 h-24 bg-black border-4 border-purple-500 rounded-lg items-center justify-center text-5xl shadow-inner">💎</div>
          </div>
          <h3 className="text-4xl md:text-5xl font-bold text-purple-400 mb-4 font-serif drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">MODERN 5-REEL</h3>
          <p className="text-purple-200/80 text-lg mb-8 max-w-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">High definition video slots with expanded paylines and features.</p>
          
          <div className="flex items-center gap-3 text-white font-black text-xl bg-gradient-to-b from-purple-500 to-purple-800 px-8 py-4 rounded-full border-2 border-purple-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all shadow-xl">
            <Play size={28} fill="currentColor" />
            <span>PLAY MODERN</span>
          </div>
        </div>
      </div>

    </div>
  );
};

