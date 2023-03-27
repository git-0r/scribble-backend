const express = require("express");
const app = express();
const http = require("http");
const httpServer = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
  maxHttpBufferSize: 1e8, // 100MB
  maxWebSocketBufferSize: 1e8, // 100MB
});

const players = {};
let activePlayersCount = 0;
let currentPlayerId;
let currentPlayerIndex = 0;

io.on("connection", (socket) => {
  // Handle socket events here

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    if (players[socket.id]) {
      players[socket.id].isConnected = false;
      activePlayersCount--;
      io.emit("playersData", { players, count: activePlayersCount });
    }
  });

  socket.on("canvasUpdate", (canvas) => {
    const dataSize = JSON.stringify(canvas).length;
    socket.broadcast.emit("canvasUpdate", canvas);
  });

  socket.on("newPlayer", (username) => {
    players[socket.id] = {
      username,
      score: 0,
      isConnected: true,
    };
    activePlayersCount++;
    io.emit("playersData", { players, count: activePlayersCount });
    socket.emit("playerAdded");

    if (activePlayersCount === 2) {
      let playerFound = false;

      //   start looping till find a connected player
      while (!playerFound) {
        // start from 0 index
        currentPlayerId = getCurrentPlayerId(players, currentPlayerIndex);
        // if player is connected
        if (players[currentPlayerId].isConnected) {
          //   stop loop
          playerFound = true;
          //   start game
          io.emit("start", players[currentPlayerId].username);
          //   io.emit("startTimer");
          //   reverseTimer(
          //     10,
          //     (time) => io.emit("timer", time),
          //     () => io.emit("timeOver")
          //   );
        } else {
          // increase index and loop starts again
          currentPlayerIndex++;
        }
      }
    }
  });
});

httpServer.listen(3000, () => {
  console.log("listening on *:3000");
});

const getCurrentPlayerId = (players, index) =>
  Object.keys(players)[currentPlayerIndex];
