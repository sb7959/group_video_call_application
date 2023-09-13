const express = require("express");
const { ExpressPeerServer } = require("peer");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  return res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    console.log("joined the room");
    socket.join(roomId);

    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("message", (message) => {
      //here socket.to not used because we wanted to send message to all inc the sender, which is not possible with socket.to
      io.to(roomId).emit("createMessage", message, userId);
    });
    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});
console.log("getting started");
server.listen(3030);
