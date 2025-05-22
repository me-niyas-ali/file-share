const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // Serve frontend from 'public' folder

const rooms = {};
const receivedBuffers = {}; // Track file chunks by socket

io.on('connection', (socket) => {
  let currentRoom = null;

  // When a user creates a room
  socket.on('create-room', (roomId) => {
    currentRoom = roomId;
    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(socket.id);
    socket.join(roomId);
    io.to(roomId).emit('update-count', rooms[roomId].size);
  });

  // When a user joins a room
  socket.on('join-room', (roomId) => {
    currentRoom = roomId;
    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(socket.id);
    socket.join(roomId);
    io.to(roomId).emit('update-count', rooms[roomId].size);
  });

  // File chunk relay and buffer clearing
  socket.on('file-chunk', (data) => {
    if (!receivedBuffers[socket.id]) {
      receivedBuffers[socket.id] = [];
    }

    receivedBuffers[socket.id].push(Buffer.from(data.data));

    // Send chunk to others in the same room
    socket.to(data.room).emit('receive-file', {
      name: data.name,
      size: data.size,
      data: data.data,
      type: data.type,
      isLast: data.isLast,
      senderId: socket.id
    });

    // If file is fully sent, clean up buffer
    if (data.isLast) {
      delete receivedBuffers[socket.id];
    }
  });

  // Handle disconnect and clean up
  socket.on('disconnect', () => {
    if (receivedBuffers[socket.id]) {
      delete receivedBuffers[socket.id];
    }

    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].delete(socket.id);
      io.to(currentRoom).emit('update-count', rooms[currentRoom].size);
      if (rooms[currentRoom].size === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
