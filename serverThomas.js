//game code goes here

//Player object, keeps track of stats that change throughout the day
/*function Player(name, isGhost){
    this.name = name;
    this.isGhost = isGhost;
    this.isDead = false;
    this.timesKnifed = 0;
    this.tiredDays = 0;
    this.leavesRoom = false;
    this.investigating = null;
    this.murderers = null;
} */

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
	knife(victim){
		victim.timesKnifed++;
		this.leavesRoom = true;
		this.tiredDays = 0;
		victim.murderers = murderer;
	}
	//tape lets player investigate, info will be revealed at the start of the next day.
	tape(suspect){
    	this.investigating = suspect;
    	this.tiredDays = 0;
	}
	awake(){
    	if(this.tiredDays >= 3){
        	return false;
    	}
    	else{
        	this.tiredDays++;
        	return true;
    }
}

}



//just checks whether the player can sleep or not depending on how many days they stayed awake in a row.


/*function startDay(){
    this.daysPassed++;
    console.log(`Dawn of the ${this.daysPassed}'th day`);
    socket.broadcast.emit('chat-message', `Dawn of the ${this.daysPassed}'th day`);

    //runs through players, acting out what happened during the night.
    for(var i = 0; i < this.participants.length; i++){
        var thisUser = this.participants[i];
        var tolerance = 1;

        //kills user depending on how much sleep they got
        if(thisUser.tiredDays != 0) tolerance = 0;
        if(thisUser.timesKnifed > tolerance){
            this.killPlayer(thisUser.name);
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
} */
class GameClient {
    constructor(participantIDs) {
        this.daysPassed = 0;
        this.participants = [];
        this.votesTotal;
        console.log(participantIDs);
        //choosing who the ghosts are
        var randomElement = Math.floor(Math.random() * participantIDs.length);
        var randomElement2 = Math.floor(Math.random() * participantIDs.length);
        while(randomElement == randomElement2){
            randomElement2 = Math.floor(Math.random() * participantIDs.length)
        }
    
        //adding participants while saying which one's are ghosts
        for(var i = 0; i < participantIDs.length; i++){
            var playerIsGhost = false;
            if(i == randomElement || i == randomElement2){
                playerIsGhost = true;
            }
            var newPlayer = new Player(participantIDs[i], playerIsGhost);
            this.participants.push(newPlayer);
        }
        console.log(this.participants);
    }

    startDay(){
    	this.daysPassed++;
    	console.log(`Dawn of the ${this.daysPassed}'th day`);
    	socket.broadcast.emit('chat-message', `Dawn of the ${this.daysPassed}'th day`);

    		//runs through players, acting out what happened during the night.
    	for(var i = 0; i < this.participants.length; i++){
        	var thisUser = this.participants[i];
        	var tolerance = 1;

        	//kills user depending on how much sleep they got
        	if(thisUser.tiredDays != 0) tolerance = 0;
        	if(thisUser.timesKnifed > tolerance){
            	this.killPlayer(thisUser.name);
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
        	//reset night stats
        	thisUser.timesKnifed = 0;
        	thisUser.investigating = null;
        	thisUser.murderer = null;
        	thisUser.leavesRoom = false;
    	}
    }
    //removes players from list of participants
    killPlayer(playerID) {
        for(var i = 0; i < participants.length; i++){
            if(participants[i].usertag == playerID){
                console.log(participants[i].name + ' has been killed');
                io.sockets.emit('game-event', participants[i].name + ' has been killed');
        
                participants.splice(i,1);
        
            }
        }
    }
    //checks whether ghosts are present and will tell player whether they won or not, this function is not finished.
    endGame() {
        var ghostsPresent = 0;

        for(var i = 0; i < participants.length; i++){
            if(participants[i].isGhost == true){
                ghostsPresent++;
            }
        }
        console.log(ghostsPresent)
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
    socket.emit('get-name', null)
    
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
            if(unanimous == true){
                gameInstance.endGame();
            }
            else{
                console.log(`Vote failed; when ready, proceed to night.`);
                io.sockets.emit('game-event', `Vote failed; when ready, proceed to night.`);
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
        var tempIndexActor = gameInstance.participants.findIndex(player => player.usertag === socket.id);


        if (choice.option === 'stab') {
            console.log(`${users[socket.id]} attempted to stab ${choice.target}.`);
            //TO DO: what happens in stabbing.

            var tempIndexVictim = gameInstance.participants.findIndex(player => player.usertag === choice.socket.id);

            gameInstance.participants[tempIndexActor].knife(gameInstance.participants[tempIndexVictim]);


            io.sockets.emit('game-event', `${users[socket.id]} attempted to stab ${choice.target}.`);
        }
        if (choice.option === 'tape') {
            console.log(`${users[socket.id]} investigated ${choice.target}.`);
            //TO DO: what happens in taping.

            var tempIndexSuspect =  gameInstance.participants.findIndex(player => player.usertag === choice.socket.id);
            gameInstance.participants[tempIndexActor].suspect(gameInstance.participants[tempIndexSuspect]);



            io.sockets.emit('game-event', `${users[socket.id]} investigated ${choice.target}.`);
        }
        if (choice.option === 'awake') {
            
            //TO DO: what happens in staying awake.

            if(gameInstance.participants[tempIndexActor].awake()){
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
            gameInstance.startDay();
        }


    })


})