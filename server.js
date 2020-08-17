class Player{
	constructor(ID, isGhost){
		this.usertag = ID;
		this.name = users[ID];
    	this.isGhost = isGhost;
    	this.isDead = false;
    	this.timesKnifed = 0;
    	this.tiredDays = 0;
    	this.leavesRoom = false;
    	this.investigating = null;
    	this.murderers = null;
	}
	//increases the counter of stabs on victim, and shows the murderer left the room. If the victim is awake, they see the murderer
	knife(victim) {
		victim.timesKnifed++;
		this.leavesRoom = true;
		this.tiredDays = 0;
		victim.murderers = this;
	}
	//tape lets player investigate, info will be revealed at the start of the next day.
	tape(suspect) {
    	this.investigating = suspect;
    	this.tiredDays = 0;
	}
	awake() {
    	if (this.tiredDays >= 3) {
        	return false;
    	}
    	else {
        	this.tiredDays++;
        	return true;
        }
}

}

class GameClient {
    constructor(participantIDs) {
        this.daysPassed = 0;
        this.participants = [];
        //keeping as singular values now, will make lists when implement repossession.
        this.ghostOne = null;
        this.ghostTwo = null;
        this.votesTotal = 0;
        this.gameActive = true;
        console.log(participantIDs);
        //choosing who the ghosts are
        var randomElement = Math.floor(Math.random() * participantIDs.length);
        var randomElement2 = Math.floor(Math.random() * participantIDs.length);
        while (randomElement == randomElement2) {
            randomElement2 = Math.floor(Math.random() * participantIDs.length)
        }
    
        //adding participants while saying which one's are ghosts
        for (var i = 0; i < participantIDs.length; i++) {
            var playerIsGhost = false;
            if(i == randomElement || i == randomElement2){
                playerIsGhost = true;
            }
            var newPlayer = new Player(participantIDs[i], playerIsGhost);
            this.participants.push(newPlayer);
        }

        this.ghostOne = this.participants[randomElement];
        this.ghostTwo = this.participants[randomElement2];

        console.log(this.participants);
    }

    startDay() {
    	this.daysPassed++;
        console.log(`===== Dawn of the ${this.daysPassed}'th day =====`);
        io.sockets.emit('game-event', `===== Dawn of the ${this.daysPassed}'th day =====`);
        let dead = [];
    		//runs through players, acting out what happened during the night.
    	for (var i = 0; i < this.participants.length; i++) {
        	var thisUser = this.participants[i];
        	var tolerance = 1;

        	//kills user depending on how much sleep they got
        	if (thisUser.tiredDays != 0) {tolerance = 0};
        	if (thisUser.timesKnifed > tolerance) {
                //add user to death list.
                dead.push(thisUser.usertag);
                console.log(`${thisUser.name} has been killed.`);
                io.sockets.emit('game-event', `${thisUser.name} has been killed.`);
                //makes the user a spectator.
                io.to(thisUser.usertag).emit('trigger-spectator',null);
        	}
        	//tells player who chose tape whether their suspect left the room
        	else {
                if (thisUser.investigating != null) {
            	    if (thisUser.investigating.leavesRoom){
                	    console.log(`${thisUser.name} saw ${thisUser.investigating.name} leave the room.`);
                	    io.sockets.emit('game-event', `${thisUser.name} saw ${thisUser.investigating.name} leave the room.`);
            	    }
            	    else {
                	console.log(`${thisUser.name} didn't see ${thisUser.investigating.name} leave the room.`);
                	io.sockets.emit('game-event', `${thisUser.name} didn't see ${thisUser.investigating.name} leave the room.`);
            	    }
            
                }
        	//tells the people who stayed up who tried to kill them
        	    else {
            	    if (thisUser.murderer != null) {
            	        console.log(`${thisUser.name} saw ${thisUser.murderer.name} try to kill them.`);
            	        io.sockets.emit('game-event', `${thisUser.name} saw ${thisUser.murderer.name} try to kill them.`);
            	    }
                }
            }
        	//reset night stats
        	thisUser.timesKnifed = 0;
        	thisUser.investigating = null;
        	thisUser.murderer = null;
        	thisUser.leavesRoom = false;
        }

        if (dead.includes(this.ghostOne.usertag)) {
        	io.to(this.ghostTwo.usertag).emit('game-event', `The other ghost has been released from ${this.ghostOne.name}`);
        }
        else {
        	io.to(this.ghostTwo.usertag).emit('game-event', `The other ghost still possesses ${this.ghostOne.name}`);
        }

        if (dead.includes(this.ghostTwo.usertag)) {
        	io.to(this.ghostOne.usertag).emit('game-event', `The other ghost has been released from ${this.ghostTwo.name}`);
        }
        else {
        	io.to(this.ghostOne.usertag).emit('game-event', `The other ghost still possesses ${this.ghostTwo.name}`);
        }



        //filter out all dead people from participants
        this.participants = this.participants.filter(player => !(dead.includes(player.usertag)))
        console.log(`Surviving participants: ${this.participants.map(x => x.name).join()}`)
        io.sockets.emit('game-event', `Surviving participants: ${this.participants.map(x => x.name).join(', ')}`)
    }
        
    //checks whether ghosts are present and will tell player whether they won or not, this function is not finished.
    endGame() {
        /*
        var ghostsPresent = 0;

        for (var i = 0; i < this.participants.length; i++) {
            if (this.participants[i].isGhost == true) {
                ghostsPresent++;
            }
        }*/
        const ghostsPresent = this.participants.reduce((ghosts, participant) => ghosts + participant.isGhost, 0)

        console.log(`The game ended with ${ghostsPresent} ghosts left.`)
        io.sockets.emit('end', ghostsPresent)
        this.gameActive = false;
    }
}


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
let unanimous, voteForNight;

//when a socket connects to the server
//Sockets reference:
// socket.on(message-type, function()) - receiving data from socket, triggers function().
// io.sockets.emit(message-type, data) - sending data to all connected sockets.
// socket.broadcast.emit(message-type, data) - sending data to all connected sockets except the socket which triggered it.
// socket.emit(message-type, data) - sending data to only the socket which triggered it.
io.on('connection', socket => {

	
    
    console.log(`new connection from ${socket.id}`);
    socket.emit('get-name', null);
    socket.emit('phase', 0);

    // when start button is pressed, initialize game client
    socket.on('start-game', () => {
		console.log("Game Start");
		io.sockets.emit('game-event', "Game Start");
        gameInstance = new GameClient(Object.keys(users));
        io.sockets.emit('phase', 1);
        unanimous = true;
	})
    
    //when username is entered, track name in users, send user-connected message to all clients, update participants box
    socket.on('new-user', name => {
        users[socket.id] = name;
        console.log(`${name} joined.`);
        socket.broadcast.emit('user-connected', name);
        io.sockets.emit('participants', users);

        // turns user into a spectator if there is there is an active game.
        if (gameInstance != null && gameInstance.gameActive) {
        	socket.emit('trigger-spectator', null);
        }

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
        io.sockets.emit('participants', users);
    })

    //when server receives command
    //Day Phase
    //option = 'stay' or 'leave'

    socket.on('button-day', option => {
        socket.emit('phase', 2);
        console.log(`${users[socket.id]} voted to ${option}.`);
        io.sockets.emit('game-event', `${users[socket.id]} voted to ${option}.`);

        //TO DO: what happens when vote stay or leave.
        gameInstance.votesTotal++;
        if (option === "stay") {
            unanimous = false;
        }
        if (gameInstance.votesTotal >= gameInstance.participants.length) {
            if (unanimous === true) {
                gameInstance.endGame();
            }
            else {
                console.log(`Vote failed; when ready, proceed to night.`);
                io.sockets.emit('game-event', `Vote failed; when ready, proceed to night.`);
                io.sockets.emit('phase', 3)
                voteForNight = 0;
            }
        }
    })

    
    socket.on('button-proceed', () => {
        socket.emit('phase', 4);
        console.log(`${users[socket.id]} wants to proceed to night.`);
        io.sockets.emit('game-event', `${users[socket.id]} wants to proceed to night.`);
        voteForNight++;
        var majority = Math.floor(gameInstance.participants.length / 2);
        //TO DO: what happens when vote to proceed.

        if (voteForNight > majority) {
            voteForNight = 0;
            gameInstance.votesTotal = 0;
            unanimous = true;
            console.log(`Proceed to night.`);
            io.sockets.emit('game-event', `Proceed to night.`);
            io.sockets.emit('phase', 5)
        }



        
    })

    //Night Phase
    //choice = {option: 'awake' or 'stab' or 'tape', target: id }
    socket.on('button-night', choice => {

        //keep track of whether everyone made a choice
        gameInstance.votesTotal++;
        var tempIndexActor = gameInstance.participants.findIndex(player => player.usertag === socket.id);


        if (choice.option === 'stab') {
            socket.emit('phase', 6);
            console.log(`${users[socket.id]} attempted to stab ${users[choice.targetid]}.`);
            //TO DO: what happens in stabbing.

            var tempIndexVictim = gameInstance.participants.findIndex(player => player.usertag === choice.targetid);

            gameInstance.participants[tempIndexActor].knife(gameInstance.participants[tempIndexVictim]);


            io.sockets.emit('game-event', `${users[socket.id]} attempted to stab ${users[choice.targetid]}.`);
        }
        if (choice.option === 'tape') {
            socket.emit('phase', 6);
            console.log(`${users[socket.id]} investigated ${users[choice.targetid]}.`);
            //TO DO: what happens in taping.

            var tempIndexSuspect =  gameInstance.participants.findIndex(player => player.usertag === choice.targetid);
            gameInstance.participants[tempIndexActor].tape(gameInstance.participants[tempIndexSuspect]);



            io.sockets.emit('game-event', `${users[socket.id]} investigated ${users[choice.targetid]}.`);
        }
        if (choice.option === 'awake') {
            
            //TO DO: what happens in staying awake.
            if (gameInstance.participants[tempIndexActor].awake()) {
                socket.emit('phase', 6);
                console.log(`${users[socket.id]} is staying awake.`);
                io.sockets.emit('game-event', `${users[socket.id]} is staying awake.`);
            }
            else {
                gameInstance.votesTotal--;
                console.log(`${users[socket.id]} is too tired, pick another option.`);
                io.sockets.emit('game-event', `${users[socket.id]} is too tired, pick another option.`);
            }


            
        }
        if (gameInstance.votesTotal >= gameInstance.participants.length) {
            console.log(`Everyone has chosen.`);
            io.sockets.emit('game-event', `Everyone has chosen.`);
            io.sockets.emit('phase', 1)
            gameInstance.votesTotal = 0;
            gameInstance.startDay();
        }


    })


})