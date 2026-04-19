import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useGameStore } from '../store/gameStore';

export function InstructionScreen() {
  const setHasSeenInstructions = useGameStore(s => s.setHasSeenInstructions);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-8 text-center"
    >
      <h1 className="text-4xl md:text-6xl font-display font-black text-[#00f3ff] mb-6 uppercase tracking-widest">
        Neon Snake Arena
      </h1>
      <p className="text-[#666] font-mono mb-12 max-w-2xl text-sm md:text-base leading-relaxed">
        Welcome to the next evolution of Snake. Play solo against the elusive neon rat, 
        or battle your friends in local and online multiplayer arenas. First to 10 points wins!
      </p>
      
      <button 
        onClick={() => setHasSeenInstructions(true)}
        className="px-8 py-4 bg-transparent border-2 border-[#39ff14] text-[#39ff14] font-bold uppercase tracking-widest rounded-lg hover:bg-[#39ff14] hover:text-black transition-all"
      >
        I'm Ready
      </button>
    </motion.div>
  );
}

export function MenuScreen() {
  const setMode = useGameStore(s => s.setMode);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full w-full gap-8 p-4"
    >
      <h2 className="text-4xl font-display font-black text-white uppercase tracking-widest text-center mb-12">
        Select Mode
      </h2>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center">
        {/* Single Player */}
        <div 
          onClick={() => setMode('single')}
          className="flex-1 bg-[#111] p-8 rounded-2xl border border-[#333] cursor-pointer hover:border-[#39ff14] transition-all group flex flex-col items-center text-center"
        >
          <div className="text-[80px] mb-6 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
            🤖
          </div>
          <h3 className="text-2xl font-bold font-display text-white mb-2 uppercase group-hover:text-[#39ff14] transition-colors">
            Single Player
          </h3>
          <p className="text-sm font-mono text-[#666]">Solo survival mode against the rat.</p>
        </div>

        {/* Multiplayer */}
        <div 
          onClick={() => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
              setMode('online_lobby');
            } else {
              setMode('local_multi');
            }
          }}
          className="flex-1 bg-[#111] p-8 rounded-2xl border border-[#333] cursor-pointer hover:border-[#ff00ff] transition-all group flex flex-col items-center text-center"
        >
          <div className="text-[80px] mb-6 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all flex justify-center gap-2">
            🤖<span className="text-[#ff00ff]">⚔️</span>🤖
          </div>
          <h3 className="text-2xl font-bold font-display text-white mb-2 uppercase group-hover:text-[#ff00ff] transition-colors">
            Multiplayer
          </h3>
          <p className="text-sm font-mono text-[#666]">
            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) 
              ? 'Create a room and battle 4 players online.' 
              : 'Local 2-player battle. WASD vs Arrows!'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
