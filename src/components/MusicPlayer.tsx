import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverColor: string;
}

interface MusicPlayerProps {
  tracks: Track[];
}

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [currentTrackIndex, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  const handlePrev = () => setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) setProgress((current / duration) * 100);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
    setProgress(percentage * 100);
  };

  return (
    <div id="music-player-container" className="flex flex-col gap-8 w-full">
      {/* Playlist */}
      <ul id="playlist" className="list-none flex flex-col m-0 p-0 gap-2">
        {tracks.map((track, index) => {
          const isActive = index === currentTrackIndex;
          return (
            <motion.li 
              id={`track-item-${track.id}`}
              key={track.id}
              whileHover={{ x: 4 }}
              onClick={() => {
                setCurrentTrackIndex(index);
                if (!isPlaying) togglePlay();
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-colors flex flex-col justify-center min-h-[64px] ${isActive ? 'bg-[#111] border-[#333]' : 'border-transparent hover:bg-[#111]/50'}`}
            >
              <span className={`text-lg font-display font-bold block mb-1 ${isActive ? 'text-[#ff00ff]' : 'text-white'}`}>
                {track.title}
              </span>
              <span className="text-xs font-mono text-[#666] uppercase tracking-widest">
                {track.artist}
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* Controls Panel */}
      <div id="controls-panel" className="bg-[#111] p-6 rounded-2xl border border-[#333] shadow-xl">
        <span id="now-playing-label" className="text-[10px] font-mono font-bold text-[#00f3ff] mb-4 block uppercase tracking-widest">
          Now Playing: {currentTrack.title}
        </span>
        
        {/* Visualizer */}
        <div id="visualizer" className="h-12 flex items-end gap-1 mt-6">
          {[40, 80, 100, 60, 30, 70, 90, 50, 75, 45].map((h, i) => (
            <motion.div 
              id={`vis-bar-${i}`}
              key={i} 
              className="flex-1 bg-[#00f3ff] opacity-80 rounded-t-sm" 
              animate={{ height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : `${h}%` }}
              transition={{ duration: 0.2, repeat: isPlaying ? Infinity : 0, repeatType: "reverse" }}
            />
          ))}
        </div>

        {/* Playback Controls */}
        <div id="playback-controls" className="flex justify-between items-center mt-8 gap-4">
          <button 
            id="btn-prev"
            onClick={handlePrev} 
            className="flex-1 min-h-[44px] flex items-center justify-center bg-transparent border border-[#444] text-white rounded-lg cursor-pointer hover:bg-[#222] transition-colors"
            aria-label="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            id="btn-play-pause"
            onClick={togglePlay} 
            className="flex-[2] min-h-[44px] flex items-center justify-center bg-white text-black font-display font-bold border-none rounded-lg cursor-pointer uppercase tracking-widest hover:bg-gray-200 transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button 
            id="btn-next"
            onClick={handleNext} 
            className="flex-1 min-h-[44px] flex items-center justify-center bg-transparent border border-[#444] text-white rounded-lg cursor-pointer hover:bg-[#222] transition-colors"
            aria-label="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume & Progress */}
        <div id="volume-progress-container" className="mt-8 flex flex-col gap-6">
          <div 
            id="progress-bar"
            className="w-full h-8 flex items-center group/progress cursor-pointer" 
            onClick={handleProgressClick}
          >
            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden relative">
              <motion.div 
                id="progress-fill"
                className="absolute top-0 left-0 h-full bg-[#00f3ff]"
                style={{ width: `${progress}%` }}
                layout
              />
            </div>
          </div>
          <div id="volume-control" className="flex items-center gap-4 w-full">
            <button 
              id="btn-mute"
              onClick={() => setIsMuted(!isMuted)} 
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#666] hover:text-white transition-colors"
              aria-label="Toggle Mute"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      <audio
        id="audio-element"
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />
    </div>
  );
}
