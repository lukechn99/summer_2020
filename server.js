//game code goes here


//web application with express
const express = require("express");
const app = express();
const server = app.listen(3000);

app.use(express.static("public"));

//socket server-side programming with socket.io
console.log("Running server.js");

const socket = require("socket.io");
const io = socket(server);
//object to track clients
const users = {};

//when a socket connects to the server
//Sockets reference:
// socket.on(message-type, function()) - receiving data from socket, triggers function().
// io.sockets.emit(message-type, data) - sending data to all connected sockets.
// socket.broadcast.emit(message-type, data) - sending data to all connected sockets except the socket which triggered it.
// socket.emit(message-type, data) - sending data to only the socket which triggered it.
io.on('connection', socket => {
    
    console.log(`new connection from ${socket.id}`);
    
    //when username is entered, track name in users, send user-connected message to all clients, update participants box
    socket.on('new-user', name => {
        users[socket.id] = name;
        console.log(`${name} joined.`);
        socket.broadcast.emit('user-connected', name);
        io.sockets.emit('participants', Object.values(users))
    })
    
    //when server receives message, send chat message to all clients
    socket.on('send-chat-message', message => {
        console.log(`message from ${users[socket.id]}: ${message}`);
        socket.broadcast.emit('chat-message', {message: message, name: users[socket.id]});
    })
    
    //when client disconnects, send user-disconnect message to all clients, update participants box
    socket.on('disconnect', () => {
        socket.broadcast.emit('user-disconnected', users[socket.id]);
        console.log(`${users[socket.id]} left.`);
        delete users[socket.id];
        io.sockets.emit('participants', Object.values(users))
    })

    //when server receives command
    //Day Phase
    //option = 'stay' or 'leave'
    socket.on('button-day', option => {
        console.log(`${users[socket.id]} voted to ${option}.`);
        //TO DO: what happens when vote stay or leave.

        io.sockets.emit('game-event', `${users[socket.id]} voted to ${option}.`)
    })

    socket.on('button-proceed', () => {
        console.log(`${users[socket.id]} wants to proceed to night.`);
        //TO DO: what happens when vote to proceed.

        io.sockets.emit('game-event', `${users[socket.id]} wants to proceed to night.`)
    })

    //Night Phase
    //choice = {option: 'awake' or 'stab' or 'tape', target: 'name' }
    socket.on('button-night', choice => {
        if (choice.option === 'stab') {
            console.log(`${users[socket.id]} attempted to stab ${choice.target}.`);
            //TO DO: what happens in stabbing.

            io.sockets.emit('game-event', `${users[socket.id]} attempted to stab ${choice.target}.`)
        }
        if (choice.option === 'tape') {
            console.log(`${users[socket.id]} investigated ${choice.target}.`);
            //TO DO: what happens in taping.

            io.sockets.emit('game-event', `${users[socket.id]} investigated ${choice.target}.`)
        }
        if (choice.option === 'awake') {
            console.log(`${users[socket.id]} is staying awake.`);
            //TO DO: what happens in staying awake.

            io.sockets.emit('game-event', `${users[socket.id]} is staying awake.`)
        }
    })


})