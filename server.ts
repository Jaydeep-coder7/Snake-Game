import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';

const PORT = 3000;
const GRID_SIZE = 30;

// Simple Game Engine for Online Rooms
interface Player {
  id: string; // Socket ID
  animal: 'rat' | 'snake' | 'vulture' | 'eagle';
  team: 'red' | 'blue';
  body: { x: number, y: number }[];
  direction: { x: number, y: number };
  nextDirection: { x: number, y: number };
  kills: number;
  alive: boolean;
}

interface Room {
  id: string;
  state: 'waiting' | 'playing' | 'ended';
  players: Record<string, Player>;
  food: { x: number, y: number };
}

const rooms: Record<string, Room> = {};

function generateFood() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE)
  };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Vite Middleware for Dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Prod static files
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  // Socket.IO Logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', (animal: string) => {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      rooms[roomId] = {
        id: roomId,
        state: 'waiting',
        players: {},
        food: generateFood()
      };
      socket.join(roomId);
      rooms[roomId].players[socket.id] = {
        id: socket.id,
        animal: animal as any,
        team: Object.keys(rooms[roomId].players).length % 2 === 0 ? 'red' : 'blue',
        body: [{ x: 5, y: 5 }, { x: 5, y: 6 }],
        direction: { x: 0, y: -1 },
        nextDirection: { x: 0, y: -1 },
        kills: 0,
        alive: true
      };
      
      socket.emit('room_created', roomId);
      io.to(roomId).emit('room_state', rooms[roomId]);
    });

    socket.on('join_room', (data: { roomId: string, animal: string }) => {
      const room = rooms[data.roomId];
      if (room && room.state === 'waiting' && Object.keys(room.players).length < 4) {
        socket.join(data.roomId);
        room.players[socket.id] = {
          id: socket.id,
          animal: data.animal as any,
          team: Object.keys(room.players).length % 2 === 0 ? 'red' : 'blue',
          body: [{ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }],
          direction: { x: 0, y: -1 },
          nextDirection: { x: 0, y: -1 },
          kills: 0,
          alive: true
        };
        io.to(data.roomId).emit('room_state', room);
      } else {
        socket.emit('error', 'Room full or invalid');
      }
    });

    socket.on('start_game', (roomId: string) => {
      const room = rooms[roomId];
      if (room && room.state === 'waiting') {
        room.state = 'playing';
        io.to(roomId).emit('game_started');
      }
    });

    socket.on('input', (data: { roomId: string, dir: { x: number, y: number } }) => {
      const room = rooms[data.roomId];
      if (room && room.players[socket.id]) {
        // Prevent 180 turn
        const player = room.players[socket.id];
        if (player.direction.x !== -data.dir.x || player.direction.y !== -data.dir.y) {
          room.players[socket.id].nextDirection = data.dir;
        }
      }
    });

    socket.on('disconnect', () => {
      // Cleanup rooms
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          delete rooms[roomId].players[socket.id];
          io.to(roomId).emit('room_state', rooms[roomId]);
          if (Object.keys(rooms[roomId].players).length === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });

  // Main Game Loop (10 ticks per second)
  setInterval(() => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.state === 'playing') {
        
        let anyoneWon = false;
        let winnerName = "";

        Object.values(room.players).forEach(player => {
          if (!player.alive) return;
          
          player.direction = player.nextDirection;
          const head = player.body[0];
          const newHead = {
            x: head.x + player.direction.x,
            y: head.y + player.direction.y
          };

          // Wall collision
          if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            player.alive = false;
            return;
          }

          player.body.unshift(newHead);

          // Eat food
          if (newHead.x === room.food.x && newHead.y === room.food.y) {
            room.food = generateFood();
            player.kills++; // In this context food = points
          } else {
            player.body.pop();
          }

          // Player-to-player collision (HEAD to BODY)
          Object.values(room.players).forEach(otherPlayer => {
            if (otherPlayer.id !== player.id && otherPlayer.alive) {
              for (const segment of otherPlayer.body) {
                if (newHead.x === segment.x && newHead.y === segment.y) {
                  // Player crashed into someone else
                  player.alive = false;
                  otherPlayer.kills++; 
                  if (otherPlayer.kills >= 10) {
                    anyoneWon = true;
                    winnerName = otherPlayer.id;
                  }
                }
              }
            }
          });
          
          if (player.kills >= 10) {
            anyoneWon = true;
            winnerName = player.id;
          }
        });

        if (anyoneWon) {
          room.state = 'ended';
          io.to(roomId).emit('game_ended', winnerName);
        } else {
          io.to(roomId).emit('game_tick', room);
        }
      }
    }
  }, 100);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
