const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('create-room', (roomId) => {
    currentRoom = roomId;
    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(socket.id);
    socket.join(roomId);
    io.to(roomId).emit('update-count', rooms[roomId].size);
  });

  socket.on('join-room', (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = new Set();
    currentRoom = roomId;
    rooms[roomId].add(socket.id);
    socket.join(roomId);
    io.to(roomId).emit('update-count', rooms[roomId].size);
  });

  socket.on('file-chunk', (data) => {
    if (data.room && rooms[data.room]) {
      socket.to(data.room).emit('receive-file', {
        name: data.name,
        size: data.size,
        data: data.data,
        type: data.type,
        isLast: data.isLast,
        senderId: socket.id
      });
    }
  });

  socket.on('disconnect', () => {
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
