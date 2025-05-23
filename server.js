const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    io.to(room).emit("update-count", rooms[room].length);

    socket.on("start-file", (data) => {
      socket.to(room).emit("file-received", { name: data.name, size: data.size });
    });

    socket.on("file-chunk", (data) => {
      socket.to(room).emit("file-chunk", data);
    });

    socket.on("disconnect", () => {
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(id => id !== socket.id);
        io.to(room).emit("update-count", rooms[room].length);
      }
    });
  });
});

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});