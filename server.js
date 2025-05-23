const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    io.to(room).emit("update-count", rooms[room].length);

    socket.on("start-file", (data) => {
      socket.to(room).emit("start-file", data);
    });

    socket.on("file-chunk", (data) => {
      socket.to(room).emit("file-chunk", data);
    });

    socket.on("disconnect", () => {
      for (const r in rooms) {
        rooms[r] = rooms[r].filter(id => id !== socket.id);
        io.to(r).emit("update-count", rooms[r].length);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});