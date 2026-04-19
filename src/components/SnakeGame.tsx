import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

interface FakeTail {
  id: number;
  body: { x: number, y: number }[];
}

let audioCtx: AudioContext | null = null;

const playSound = (type: 'move' | 'eat' | 'die') => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'move') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'eat') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'die') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }
  } catch (err) {
    console.error("Audio playback failed", err);
  }
};

export default function SnakeGame({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [ratTransform, setRatTransform] = useState("scaleX(1) rotate(0deg)");
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);

  // New Mechanics
  const [fakeTails, setFakeTails] = useState<FakeTail[]>([]);
  const [decoyRat, setDecoyRat] = useState<{ x: number, y: number, transform: string } | null>(null);

  const snakeRef = useRef(snake);
  snakeRef.current = snake;

  const directionRef = useRef(direction);
  directionRef.current = direction;

  const fakeTailsRef = useRef(fakeTails);
  fakeTailsRef.current = fakeTails;

  const decoyRatRef = useRef(decoyRat);
  decoyRatRef.current = decoyRat;

  const decoyPanicUntilRef = useRef<number>(0);

  const scoreRef = useRef(score);
  scoreRef.current = score;

  const foodRef = useRef(food);
  foodRef.current = food;

  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    onScoreUpdate(0);
    setGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
    setRatTransform("scaleX(1) rotate(0deg)");
    setFakeTails([]);
    setDecoyRat(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Resume or start audiocontext on any user interaction gesture to bypass browser restrictions
      if (audioCtx && audioCtx.state === 'suspended') {
         audioCtx.resume();
      } else if (!audioCtx) {
         try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch(e){}
      }

      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Main game loop (Snake movement)
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      const prevSnake = snakeRef.current;
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + directionRef.current.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + directionRef.current.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check self collision (only if length > 1 to avoid direct 180-degree turn issues causing game over)
      if (prevSnake.some((segment, index) => index !== 0 && segment.x === newHead.x && segment.y === newHead.y)) {
        playSound('die');
        setGameOver(true);
        return;
      }

      // Check Fake Tails collision
      if (fakeTailsRef.current.some(tail => tail.body.some(s => s.x === newHead.x && s.y === newHead.y))) {
        playSound('die');
        setGameOver(true);
        return;
      }

      // Check Fake Decoy Rat collision (Death!)
      if (decoyRatRef.current && newHead.x === decoyRatRef.current.x && newHead.y === decoyRatRef.current.y) {
        playSound('die');
        setGameOver(true);
        return;
      }

      const newSnake = [newHead, ...prevSnake];
      let didEat = false;

      // Check Real Food collision
      if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
        didEat = true;
        playSound('eat');
        const newScore = scoreRef.current + 10;
        setScore(newScore);
        onScoreUpdate(newScore);
        setFood(generateFood(newSnake));
      } 
      else {
        newSnake.pop();
      }

      if (!didEat) {
        playSound('move');
      }

      setSnake(newSnake);
    };

    // Difficulty scaling after 100 points
    const GAME_SPEED = scoreRef.current >= 100 ? 80 : 120;
    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [gameOver, isPaused, generateFood, onScoreUpdate]); // Remove direction, food from dependencies since we use refs

  // Fake Tails Spawner loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const spawnFakeTails = () => {
      setFakeTails(prev => {
        const newTails = [...prev];
        const len = 3 + Math.floor(Math.random() * 3);
        const startX = Math.floor(Math.random() * (GRID_SIZE - len));
        const startY = Math.floor(Math.random() * GRID_SIZE);
        const body = [];
        for (let i = 0; i < len; i++) body.push({ x: startX + i, y: startY });
        
        newTails.push({ id: Date.now(), body });
        // After 100 points, keep more fake tails on screen
        const maxTails = scoreRef.current >= 100 ? 5 : 2;
        if (newTails.length > maxTails) {
          newTails.shift();
        }
        return newTails;
      });
    };

    // Spawn a new fake tail every 10 seconds
    const fakeTailInterval = setInterval(spawnFakeTails, 10000);
    return () => clearInterval(fakeTailInterval);
  }, [gameOver, isPaused]);

  // Decoy Rat Spawner (Every 50 sec, lasts for 5 sec)
  useEffect(() => {
    if (gameOver || isPaused) return;

    const spawnDecoy = () => {
      setDecoyRat({
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        transform: "scaleX(1) rotate(0deg)"
      });

      // Disappear after 5 seconds
      setTimeout(() => {
         setDecoyRat(null);
      }, 5000);
    };

    const decoyInterval = setInterval(spawnDecoy, 50000);
    return () => clearInterval(decoyInterval);
  }, [gameOver, isPaused]);

  // Real Rat movement
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveRat = () => {
      const prevFood = foodRef.current;
      const currentSnake = snakeRef.current;
      const head = currentSnake[0];

      const moves = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
      ];

      let bestMoves: typeof moves = [];
      let maxDist = -1;

      for (const m of moves) {
        const nx = prevFood.x + m.x;
        const ny = prevFood.y + m.y;

        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        if (currentSnake.some(s => s.x === nx && s.y === ny)) continue;
        // Avoid fake tails too
        if (fakeTailsRef.current.some(t => t.body.some(s => s.x === nx && s.y === ny))) continue;

        const dx = Math.min(Math.abs(nx - head.x), GRID_SIZE - Math.abs(nx - head.x));
        const dy = Math.min(Math.abs(ny - head.y), GRID_SIZE - Math.abs(ny - head.y));
        const dist = dx + dy;

        if (dist > maxDist) {
          maxDist = dist;
          bestMoves = [m];
        } else if (dist === maxDist) {
          bestMoves.push(m);
        }
      }

      if (bestMoves.length > 0) {
        const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        
        let transform = "scaleX(1) rotate(0deg)";
        if (chosen.x === -1) transform = "scaleX(1) rotate(0deg)";
        else if (chosen.x === 1) transform = "scaleX(-1) rotate(0deg)";
        else if (chosen.y === -1) transform = "scaleX(1) rotate(90deg)";
        else if (chosen.y === 1) transform = "scaleX(1) rotate(-90deg)";
        
        setRatTransform(transform);
        
        setFood({
          x: prevFood.x + chosen.x,
          y: prevFood.y + chosen.y,
        });
      }
    };

    const RAT_SPEED = scoreRef.current >= 100 ? 250 : 350;
    const ratInterval = setInterval(moveRat, RAT_SPEED);
    return () => clearInterval(ratInterval);
  }, [gameOver, isPaused, score]); // Track score dependency strictly here just so rat interval changes

  // Decoy Rat movement
  useEffect(() => {
    if (gameOver || isPaused || !decoyRatRef.current) return;

    const moveDecoy = () => {
      const prevDecoy = decoyRatRef.current;
      if (!prevDecoy) return;
      
      const currentSnake = snakeRef.current;
      const head = currentSnake[0];

      // 5% chance to start panicking for 3 seconds if not already panicking
      if (Date.now() > decoyPanicUntilRef.current && Math.random() < 0.05) {
        decoyPanicUntilRef.current = Date.now() + 3000;
      }
      const isPanicking = Date.now() < decoyPanicUntilRef.current;

      const moves = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
      ];

      let validMoves: typeof moves = [];
      let bestMoves: typeof moves = [];
      let maxDist = -1;

      for (const m of moves) {
        const nx = prevDecoy.x + m.x;
        const ny = prevDecoy.y + m.y;

        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        
        // Even when panicking, avoid stepping directly onto the snake body or fake tails
        if (currentSnake.some(s => s.x === nx && s.y === ny)) continue;
        if (fakeTailsRef.current.some(t => t.body.some(s => s.x === nx && s.y === ny))) continue;

        validMoves.push(m);

        const dx = Math.min(Math.abs(nx - head.x), GRID_SIZE - Math.abs(nx - head.x));
        const dy = Math.min(Math.abs(ny - head.y), GRID_SIZE - Math.abs(ny - head.y));
        const dist = dx + dy;

        if (dist > maxDist) {
          maxDist = dist;
          bestMoves = [m];
        } else if (dist === maxDist) {
          bestMoves.push(m);
        }
      }

      let chosenMove = null;
      if (isPanicking && validMoves.length > 0) {
        // Erratic movement: pick ANY valid move, ignoring the head distance completely
        chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      } else if (bestMoves.length > 0) {
        // Standard evasion: maximize distance from head
        chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
      }

      if (chosenMove) {
        let transform = "scaleX(1) rotate(0deg)";
        if (chosenMove.x === -1) transform = "scaleX(1) rotate(0deg)";
        else if (chosenMove.x === 1) transform = "scaleX(-1) rotate(0deg)";
        else if (chosenMove.y === -1) transform = "scaleX(1) rotate(90deg)";
        else if (chosenMove.y === 1) transform = "scaleX(1) rotate(-90deg)";
        
        setDecoyRat({
          x: prevDecoy.x + chosenMove.x,
          y: prevDecoy.y + chosenMove.y,
          transform
        });
      }
    };

    const DECOY_SPEED = scoreRef.current >= 100 ? 250 : 350;
    const decoyInterval = setInterval(moveDecoy, DECOY_SPEED);
    return () => clearInterval(decoyInterval);
  }, [gameOver, isPaused, !!decoyRat, score]); // Recreate interval only when decoy spawns/dies or score changes

  return (
    <div id="snake-game-container" className="relative flex flex-col items-center justify-center w-full h-full p-4 md:p-8">
      
      {/* Score Overlay */}
      <div id="game-score-overlay" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] md:text-[200px] font-display font-black leading-none text-[#ffffff05] pointer-events-none z-0 select-none">
        {score.toString().padStart(3, '0')}
      </div>

      <div id="game-header" className="flex justify-between items-center w-full max-w-[500px] mb-6 z-10">
        <h2 id="game-title" className="text-xs md:text-sm tracking-[0.5em] uppercase text-[#00f3ff] font-mono font-bold">
          Neon Snake {score >= 100 ? '🔥' : ''}
        </h2>
        <div id="game-score-small" className="text-[#39ff14] font-mono font-bold text-lg">
          SCORE: {score.toString().padStart(3, '0')}
        </div>
      </div>

      <div 
        id="game-board"
        className="relative bg-[rgba(0,255,65,0.02)] border-2 border-[#39ff14] shadow-[0_0_30px_rgba(57,255,20,0.15)] z-10 w-full max-w-[500px] aspect-square rounded-sm overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {/* Real Food (Rat) */}
        <div
          id="game-food"
          className="flex items-center justify-center text-[20px] md:text-[24px] drop-shadow-[0_0_10px_#ff00ff] z-0 transition-all duration-300"
          style={{
            gridColumnStart: food.x + 1,
            gridRowStart: food.y + 1,
            lineHeight: 1
          }}
        >
          <span style={{ transform: ratTransform, display: 'inline-block', transition: 'transform 0.1s' }}>🐁</span>
        </div>

        {/* Decoy Fake Food (Rat) */}
        <AnimatePresence>
          {decoyRat && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              id="game-food-decoy"
              className="flex items-center justify-center text-[20px] md:text-[24px] drop-shadow-[0_0_15px_#ff0000] z-0 transition-all duration-300 opacity-80"
              style={{
                gridColumnStart: decoyRat.x + 1,
                gridRowStart: decoyRat.y + 1,
                lineHeight: 1
              }}
            >
              <span style={{ transform: decoyRat.transform, display: 'inline-block', transition: 'transform 0.1s' }}>🐁</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fake Tails */}
        <AnimatePresence>
          {fakeTails.map((tail) => (
            <React.Fragment key={`faketail-${tail.id}`}>
              {tail.body.map((segment, index) => {
                const scale = 1 - (index / tail.body.length) * 0.35;
                const color = index % 2 === 0 ? '#ff1414' : '#e31010'; // Red Fake tails (or make them green?)
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.8, scale: scale }}
                    exit={{ opacity: 0, scale: 0 }}
                    key={`faketail-${tail.id}-${index}`}
                    className="flex items-center justify-center overflow-visible z-10 shadow-[0_0_10px_rgba(255,20,20,0.4)]"
                    style={{
                      gridColumnStart: segment.x + 1,
                      gridRowStart: segment.y + 1,
                      backgroundColor: color,
                      borderRadius: index === tail.body.length - 1 ? '3px 3px 12px 12px' : '4px',
                    }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </AnimatePresence>

        {/* Snake */}
        {snake.map((segment, index) => {
          const isHead = index === 0;
          const isTail = index === snake.length - 1;
          
          let rotation = 0;
          if (isHead) {
            if (directionRef.current.y === -1) rotation = 0;
            else if (directionRef.current.y === 1) rotation = 180;
            else if (directionRef.current.x === 1) rotation = 90;
            else if (directionRef.current.x === -1) rotation = 270;
          }

          const scale = 1 - (index / snake.length) * 0.35;
          const color = index % 2 === 0 ? '#39ff14' : '#2ce310'; // Alternating green

          return (
            <div
              id={`snake-segment-${index}`}
              key={`${segment.x}-${segment.y}-${index}`}
              className="flex items-center justify-center overflow-visible z-10 shadow-[0_0_10px_rgba(57,255,20,0.4)]"
              style={{
                gridColumnStart: segment.x + 1,
                gridRowStart: segment.y + 1,
                backgroundColor: color,
                borderRadius: isHead ? '8px 8px 3px 3px' : isTail ? '3px 3px 12px 12px' : '2px',
                transform: isHead ? `rotate(${rotation}deg) scale(1.1)` : `scale(${scale})`,
              }}
            >
              {isHead && (
                <div className="flex gap-[4px] mb-[4px]">
                  <div className="w-[3px] h-[3px] bg-black rounded-full" />
                  <div className="w-[3px] h-[3px] bg-black rounded-full" />
                </div>
              )}
            </div>
          );
        })}

        {/* Overlays */}
        <AnimatePresence>
          {gameOver && (
            <motion.div 
              id="game-over-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              <h3 id="game-over-title" className="text-4xl md:text-5xl font-display font-black text-[#ff00ff] mb-4 uppercase tracking-widest text-center">Game Over</h3>
              <p id="game-over-score" className="text-[#39ff14] mb-8 text-xl font-mono font-bold">Final Score: {score}</p>
              <button
                id="btn-play-again"
                onClick={resetGame}
                className="min-h-[44px] min-w-[160px] bg-transparent border-2 border-[#444] text-white py-3 px-8 rounded-lg cursor-pointer text-sm font-display uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all font-bold"
              >
                Play Again
              </button>
            </motion.div>
          )}

          {isPaused && !gameOver && (
            <motion.div 
              id="game-paused-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center z-20"
            >
              <h3 id="game-paused-title" className="text-3xl md:text-4xl font-display font-black text-[#00f3ff] uppercase tracking-widest">Paused</h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div id="game-instructions" className="mt-8 text-[10px] md:text-xs font-mono uppercase tracking-[3px] text-[#666] z-10 text-center flex flex-col gap-2">
        <p>Use Arrow Keys or WASD to move • Space to Pause</p>
      </div>
    </div>
  );
}
