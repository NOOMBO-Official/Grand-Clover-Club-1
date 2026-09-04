/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Lobby } from './components/Lobby';
import { SlotMachine } from './components/SlotMachine';
import { VideoSlot } from './components/VideoSlot';
import { GameProvider } from './context/GameContext';

export type ScreenType = 'lobby' | 'classic' | 'video';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('lobby');

  return (
    <GameProvider>
      <div className="w-[100dvw] h-[100dvh] overflow-hidden bg-black text-white selection:bg-yellow-500/30">
        <AnimatePresence mode="wait">
          {currentScreen === 'lobby' && (
            <Lobby key="lobby" onSelect={setCurrentScreen} />
          )}
          {currentScreen === 'classic' && (
            <SlotMachine key="classic" onBack={() => setCurrentScreen('lobby')} />
          )}
          {currentScreen === 'video' && (
            <VideoSlot key="video" onBack={() => setCurrentScreen('lobby')} />
          )}
        </AnimatePresence>
      </div>
    </GameProvider>
  );
}

