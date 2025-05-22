// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const roomConnections = {}; // Store connections per room

app.use(express.static(path.join(__dirname, 'public'))); // Serve static frontend

io.on('connection', (socket) => {
  let joinedRoom = null;

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    joinedRoom = roomId;

    if (!roomConnections[roomId]) roomConnections[roomId] = new Set();
    roomConnections[roomId].add(socket.id);

    io.to(roomId).emit('connected-count', roomConnections[roomId].size);
  });

  socket.on('send-file', (data) => {
    const { name, size, data: fileData, room } = data;
    socket.to(room).emit('receive-file', { name, size, data: fileData });
  });

  socket.on('disconnect', () => {
    if (joinedRoom && roomConnections[joinedRoom]) {
      roomConnections[joinedRoom].delete(socket.id);
      io.to(joinedRoom).emit('connected-count', roomConnections[joinedRoom].size);
      if (roomConnections[joinedRoom].size === 0) delete roomConnections[joinedRoom];
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
