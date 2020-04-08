const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require('path');

const users = {};

app.use(express.static(path.join(__dirname, 'client/build')));

io.on("connection", (socket) => {
    console.log("Connected")
    console.log(socket.handshake.address)

    // Add new connection id to users
    if (!users[socket.id]) {
        users[socket.id] = socket.id;
    }
    // Send ID back to client
    socket.emit("yourID", socket.id);

    // Send list of users to everyone
    io.sockets.emit("allUsers", users);

    // Remove user on disconnect
    socket.on("disconnect", () => {
        delete users[socket.id];
    });

    // PM user asking to connect
    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("hey", {
            signal: data.signalData,
            from: data.from,
        });
    });

    // PM back saying yes
    socket.on("acceptCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

server.listen(process.env.PORT || 5000, () => console.log("server is running on port 5000"));
