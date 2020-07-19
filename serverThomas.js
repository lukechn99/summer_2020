//game code goes here

//Player object, keeps track of stats that change throughout the day
function Player(name, isGhost){
    this.name = name;
    this.isGhost = isGhost;
    this.isDead = false;
    this.timesKnifed = 0;
    this.tiredDays = 0;
    this.leavesRoom = false;
    this.investigating = null;
    this.murderers = null;
}

//increases the counter of stabs on victim, and shows the murderer left the room. If the victim is awake, they see the murderer
function knife(murderer, victim){
    victim.timesKnifed++;
    murderer.leavesRoom = true;
    murderer.tiredDays = 0;
    victim.murderers = murderer;
}

//tape lets player investigate, info will be revealed at the start of the next day.
function tape(investigator,suspect){
    investigator.investigating = suspect;
    investigator.tiredDays = 0;
}

//just checks whether the player can sleep or not depending on how many days they stayed awake in a row.
function awake(insomniac){
    if(insomniac.tiredDays >= 3){
        return false;
    }
    else{
        tiredDays++;
        return true;
    }
}

function startDay(thisGame){
    thisGame.daysPassed++;
    console.log(`Dawn of the ${thisGame.daysPassed}'th day`);
    socket.broadcast.emit('chat-message', `Dawn of the ${thisGame.daysPassed}'th day`);

    //runs through players, acting out what happened during the night.
    for(var i = 0; i < thisGame.participants.length; i++){
        var thisUser = thisGame.participants[i];
        var tolerance = 1;

        //kills user depending on how much sleep they got
        if(thisUser.tiredDays != 0) tolerance = 0;
        if(thisUser.timesKnifed > tolerance){
            thisGame.killPlayer(thisUser.name);
            i--;
        }
        //tells player who chose tape whether their suspect left the room
        else if(thisUser.investigating != null){
            if(thisUser.investigating.leavesRoom){
                console.log(`${thisUser.name} saw ${thisUser.investigating.name} leave the room`);
                socket.broadcast.emit('chat-message', `${thisUser.name} saw ${thisUser.investigating.name} leave the room`);
            }
            else{
                console.log(`${thisUser.name} didn't see ${thisUser.investigating.name} leave the room`);
                socket.broadcast.emit('chat-message', `${thisUser.name} didn't see ${thisUser.investigating.name} leave the room`);
            }
            
        }
        //tells the people who stayed up who tried to kill them
        else{
            if(thisUser.murderer != null){
                console.log(`${thisUser.name} saw ${thisUser.murderer.name} try to kill them`);
                socket.broadcast.emit('chat-message', `${thisUser.name} saw ${thisUser.murderer.name} try to kill them`);
            }
        }

        thisUser.timesKnifed = 0;
        thisUser.investigating = null;
        thisUser.murderer = null;
        thisUser.leavesRoom = false;

    }
}

function GameClient(participantNames){
    this.daysPassed = 0;
    this.participants;
    this.votesTotal;
    
    //choosing who the ghosts are
    var randomElement = Math.floor(Math.random() * participantNames.length);
    var randomElement2 = Math.floor(Math.random() * participantNames.length);
    while(randomElement == randomElement2){
        randomElement2 = Math.floor(Math.random() * participantNames.length)
    }

    //adding participants while saying which one's are ghosts
    for(var i = 0; i < participantNames.length; i++){
        var playerIsGhost = false;
        if(i == randomElement || i == randomElement2){
            playerIsGhost = true;
        }
        var newPlayer = new Player(participantNames(i),playerIsGhost);
        participants.push(newPlayer);
    }
}

//removes players from list of participants
GameClient.prototype.killPlayer = function(playerName) {
  for(var i = 0; i < participants.length; i++){
    if(participants[i].name == playerName){
        console.log(playerName + ' has been killed');
        io.sockets.emit('game-event', playerName + ' has been killed');

        participants.splice(i,1);

    }
  }
};

//checks whether ghosts are present and will tell player whether they won or not, this function is not finished.
GameClient.prototype.endGame = function(){
    var ghostsPresent = 0;

    for(var i = 0; i < participants.length; i++){
        if(participants[i].isGhost == true){
            ghostsPresent++;
        }
    }
};




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

var gameInstance = null;

//when a socket connects to the server
//Sockets reference:
// socket.on(message-type, function()) - receiving data from socket, triggers function().
// io.sockets.emit(message-type, data) - sending data to all connected sockets.
// socket.broadcast.emit(message-type, data) - sending data to all connected sockets except the socket which triggered it.
// socket.emit(message-type, data) - sending data to only the socket which triggered it.
io.on('connection', socket => {

	socket.on('start-game', () => {
		console.log("Game Start");
		socket.broadcast.emit('game-event', "Game Start");
		gameInstance = new GameClient(Object.values(users));
	})
    
    console.log(`new connection from ${socket.id}`);
    
    //when username is entered, track name in users, send user-connected message to all clients, update participants box
    socket.on('new-user', name => {
        users[socket.id] = name;
        console.log(`${name} joined.`);
        socket.broadcast.emit('user-connected', name);
        io.sockets.emit('participants', Object.values(users));
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
        io.sockets.emit('participants', Object.values(users));
    })

    //when server receives command
    //Day Phase
    //option = 'stay' or 'leave'


    var unanimous = true;
    socket.on('button-day', option => {
        console.log(`${users[socket.id]} voted to ${option}.`);
        io.sockets.emit('game-event', `${users[socket.id]} voted to ${option}.`);

        //TO DO: what happens when vote stay or leave.
        gameInstance.votesTotal++;
        if(option == "stay"){
            unanimous = false;
        }
        if(gameInstance.votesTotal >= gameInstance.participants.lenth){
            if(unanimous = false){
                gameInstance.endGame();
            }
            else{
                console.log(`Vote failed; when ready, procceed to night.`);
                io.sockets.emit('game-event', `Vote failed; when ready, procceed to night.`);
            }
        }


        
    })

    var voteForNight = 0;
    socket.on('button-proceed', () => {
        console.log(`${users[socket.id]} wants to proceed to night.`);
        io.sockets.emit('game-event', `${users[socket.id]} wants to proceed to night.`);

        var majority = Math.floor(gameInstance.participants.length / 2);
        //TO DO: what happens when vote to proceed.

        if(voteForNight > majority){
            voteForNight = 0;
            gameInstance.votesTotal = 0;
            unanimous = true;
            console.log(`Proceed to night.`);
            io.sockets.emit('game-event', `Proceed to night.`);
        }



        
    })

    //Night Phase
    //choice = {option: 'awake' or 'stab' or 'tape', target: 'name' }
    socket.on('button-night', choice => {

        //keep track of whether everyone made a choice
        gameInstance.votesTotal++;
        var tempindexActor = gameInstance.participants.find(users[socket.id]);


        if (choice.option === 'stab') {
            console.log(`${users[socket.id]} attempted to stab ${choice.target}.`);
            //TO DO: what happens in stabbing.

            var tempindexVictim = gameInstance.participants.find(users[choice.target]);

            knife(gameInstance.participants[tempIndexActor], gameInstance.participants[tempindexVictim]);


            io.sockets.emit('game-event', `${users[socket.id]} attempted to stab ${choice.target}.`);
        }
        if (choice.option === 'tape') {
            console.log(`${users[socket.id]} investigated ${choice.target}.`);
            //TO DO: what happens in taping.

            var tempindexSuspect =  gameInstance.participants.find(users[choice.target]);
            suspect(gameInstance.participants[tempIndexActor], gameInstance.participants[tempindexSuspect]);



            io.sockets.emit('game-event', `${users[socket.id]} investigated ${choice.target}.`);
        }
        if (choice.option === 'awake') {
            
            //TO DO: what happens in staying awake.

            if(awake(gameInstance.participants[tempIndexActor])){
                console.log(`${users[socket.id]} is staying awake.`);
                io.sockets.emit('game-event', `${users[socket.id]} is staying awake.`);
            }
            else{
                gameInstance.votesTotal--;
                console.log(`${users[socket.id]} is too tired, pick another option.`);
                io.sockets.emit('game-event', `${users[socket.id]} is too tired, pick another option.`);
            }


            
        }
        if(gameInstance.votesTotal >= gameInstance.participants.length){
            console.log(`Everyone has chosen.`);
            io.sockets.emit('game-event', `Everyone has chosen.`);
            startDay(gameInstance);
        }


    })


})