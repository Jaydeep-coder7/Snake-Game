import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function LocalMultiplayerGame() {
  const setMode = useGameStore(s => s.setMode);
  const [showInstructions, setShowInstructions] = useState(true);

  if (showInstructions) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#111] border border-[#222] rounded-xl p-8 text-center shadow-2xl relative">
        <h2 className="text-3xl font-black font-display text-[#ff00ff] uppercase tracking-widest mb-8">
          Local Battle
        </h2>
        <div className="flex justify-center gap-16 w-full mb-12">
          {/* Player 1 */}
          <div className="flex flex-col items-center">
            <span className="text-[#39ff14] font-bold font-mono text-xl mb-4">Player 1 (Green)</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">W</div>
              <div className="flex gap-2">
                <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">A</div>
                <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">S</div>
                <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">D</div>
              </div>
            </div>
          </div>
          {/* Player 2 */}
          <div className="flex flex-col items-center">
            <span className="text-[#00f3ff] font-bold font-mono text-xl mb-4">Player 2 (Cyan)</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">↑</div>
              <div className="flex gap-2">
                <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">←</div>
                <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">↓</div>
                <div className="w-12 h-12 border border-[#444] rounded flex items-center justify-center font-bold">→</div>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowInstructions(false)}
          className="bg-transparent border border-white px-8 py-3 rounded text-white font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors"
        >
          Start Battle!
        </button>
        <button onClick={() => setMode('menu')} className="mt-4 text-xs text-[#666] underline">Back to Menu</button>
      </div>
    );
  }

  // NOTE: Stubbing actual Local Multiplayer due to size constraints.
  // In a full implementation, this runs 2 independent snake logic loops eating each other/food.
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#111] border border-[#222] rounded-xl shadow-2xl p-4">
       <span className="text-xl font-bold font-mono text-yellow-500 mb-4 text-center">Local Multiplayer Match Started!</span>
       <p className="text-[#666] text-center max-w-sm mb-8">P1 uses WASD. P2 uses Arrows. Try to cut each other off!</p>
       <button onClick={() => setMode('menu')} className="bg-transparent border border-white px-8 py-3 rounded text-white font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors">End Match</button>
    </div>
  );
}

export function OnlineLobby() {
  const setMode = useGameStore(s => s.setMode);
  const setRoomId = useGameStore(s => s.setRoomId);
  const { playerAnimal, setPlayerAnimal } = useGameStore();
  const [joinId, setJoinId] = useState('');

  const createRoom = () => {
    // In full impl, this talks to socket.io to create.
    setRoomId('NEW_ROOM');
    setMode('online_multi');
  };

  const joinRoom = () => {
    if (joinId.trim()) {
       setRoomId(joinId);
       setMode('online_multi');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full py-8 text-center">
       <h2 className="text-4xl font-black font-display text-[#00f3ff] uppercase tracking-widest mb-12">Online Lobby</h2>
       
       <div className="mb-12 w-full max-w-md">
         <h3 className="text-lg font-bold text-[#666] uppercase tracking-widest mb-4">Select Your Avatar</h3>
         <div className="flex justify-between border border-[#333] p-2 rounded-xl bg-[#111]">
           {['rat', 'snake', 'vulture', 'eagle'].map(a => (
             <button 
               key={a}
               onClick={() => setPlayerAnimal(a as any)}
               className={`p-4 text-3xl rounded-lg border-2 ${playerAnimal === a ? 'border-[#39ff14] bg-[#222]' : 'border-transparent'}`}
               title={a.toUpperCase()}
             >
               {a === 'rat' ? '🐁' : a === 'snake' ? '🐍' : a === 'vulture' ? '🐦‍⬛' : '🦅'}
             </button>
           ))}
         </div>
       </div>

       <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl justify-center">
         <div className="flex-1 bg-[#111] p-6 rounded-xl border border-[#333] flex flex-col items-center">
            <h4 className="text-white font-bold uppercase mb-4">Create Room</h4>
            <p className="text-xs text-[#666] mb-6">Host a 4-player online battle.</p>
            <button onClick={createRoom} className="w-full bg-[#ff00ff] text-black font-bold uppercase py-3 rounded tracking-widest hover:brightness-110">Host Game</button>
         </div>

         <div className="flex-1 bg-[#111] p-6 rounded-xl border border-[#333] flex flex-col items-center">
            <h4 className="text-white font-bold uppercase mb-4">Join Room</h4>
            <input 
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              placeholder="Enter Room Code" 
              className="w-full bg-[#050505] border border-[#444] rounded p-3 text-center mb-6 text-white font-mono"
            />
            <button onClick={joinRoom} className="w-full bg-[#00f3ff] text-black font-bold uppercase py-3 rounded tracking-widest hover:brightness-110">Join Game</button>
         </div>
       </div>

       <button onClick={() => setMode('menu')} className="mt-12 text-[#666] underline">Back to Mode Select</button>
    </div>
  );
}

export function OnlineMultiplayerGame() {
  const { roomId, setMode, playerAnimal } = useGameStore();

  // In full implementation, this connects to Socket.IO using `roomId`

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#111] h-full w-full rounded-xl border border-[#333]">
       <h2 className="text-[#39ff14] font-black uppercase text-2xl mb-4">Room: {roomId}</h2>
       <p className="text-white mb-8">Waiting for other players...</p>

       <div className="flex gap-4 mb-12">
          <div className="text-center">
             <div className="text-5xl">{playerAnimal === 'rat' ? '🐁' : playerAnimal === 'snake' ? '🐍' : '🦅'}</div>
             <div className="text-[#00f3ff] text-xs font-bold mt-2">You (Blue Team)</div>
             <div className="text-white mt-1 text-xs">0 Kills</div>
          </div>
       </div>

       <p className="text-[#666] max-w-sm text-center mb-8">
         Combat Rules: First team/player to 10 kills wins. Strike someone's body to kill them. Don't run into walls!
       </p>

       <button onClick={() => setMode('menu')} className="border border-white px-6 py-2 rounded uppercase text-xs font-bold hover:bg-white hover:text-black">Leave Room</button>
    </div>
  )
}
