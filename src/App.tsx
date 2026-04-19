import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import SnakeGame from './components/SnakeGame';
import MusicPlayer, { Track } from './components/MusicPlayer';

const DUMMY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Drift',
    artist: 'AI Synthwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverColor: '#ff00ff', // magenta
  },
  {
    id: '2',
    title: 'Cybernetic Pulse',
    artist: 'AI Darkwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverColor: '#00f3ff', // cyan
  },
  {
    id: '3',
    title: 'Digital Horizon',
    artist: 'AI Chillwave',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverColor: '#39ff14', // green
  }
];

export default function App() {
  const [highScore, setHighScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [justBeatHighScore, setJustBeatHighScore] = useState(false);

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
    
    // Celebrate if we beat an existing positive high score for the first time this round
    if (highScore > 0 && score > highScore && !justBeatHighScore) {
      setJustBeatHighScore(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#39ff14', '#00f3ff', '#ff00ff'],
        zIndex: 100
      });
    }

    if (score > highScore) {
      setHighScore(score);
    }

    if (score === 0) {
      setJustBeatHighScore(false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#050505] text-white overflow-x-hidden flex flex-col font-sans selection:bg-[#39ff14] selection:text-black">
      
      <motion.div 
        id="main-layout"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full flex-1 p-4 md:p-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-8"
      >
        
        {/* Left Column: Playlist / Music Player */}
        <div id="left-panel" className="flex flex-col gap-8 order-2 lg:order-1">
          <motion.div 
            id="app-branding"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs tracking-[0.5em] uppercase text-[#00f3ff] font-mono font-bold"
          >
            Synth-Snake
          </motion.div>
          
          <div className="bg-[#222] p-4 rounded-lg border border-[#eab308]/50 text-[#eab308] font-mono w-full">
            <span className="text-lg font-bold mb-1 block">⚠️ WARNING</span>
            <p className="text-[10px] leading-tight">The tails keep confusing u 💀<br/>Decoy rats will KILL you!</p>
          </div>

          <MusicPlayer tracks={DUMMY_TRACKS} />
        </div>

        {/* Center Canvas / Dynamic View */}
        <div id="center-panel" className="relative flex flex-col items-center justify-center order-1 lg:order-2 shadow-2xl bg-[radial-gradient(circle_at_center,#111_0%,#050505_100%)] border border-[#222] rounded-xl overflow-hidden min-h-[500px] lg:min-h-[600px]">
          <SnakeGame onScoreUpdate={handleScoreUpdate} />
        </div>

        {/* Right Column: Stats */}
        <div id="right-panel" className="flex flex-col justify-between order-3">
          <motion.div 
            id="score-display"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-left lg:text-right bg-[#111] lg:bg-transparent p-6 lg:p-0 rounded-xl border border-[#222] lg:border-none"
          >
            <span id="current-score-label" className="text-[10px] font-mono uppercase tracking-[3px] text-[#666] block mb-2">Current Score</span>
            <div id="current-score-value" className="text-7xl lg:text-[100px] font-display font-black text-[#39ff14] leading-none tracking-tighter">
              {currentScore.toString().padStart(3, '0')}
            </div>
            <div id="high-score-display" className="mt-6 lg:mt-8 pt-6 lg:pt-0 border-t border-[#222] lg:border-none">
              <span id="high-score-label" className="text-[10px] font-mono uppercase tracking-[3px] text-[#666] block mb-1">
                High Score
              </span>
              <div id="high-score-value" className="text-3xl font-display font-bold text-white">
                {highScore.toString().padStart(3, '0')}
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}
