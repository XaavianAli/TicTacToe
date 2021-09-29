//Using ws package for web socket connections
const WebSocket = require('ws');
const PORT = 3002

//Starting server
const wss = new WebSocket.Server({ port: PORT });
console.log(`Server started on port ${PORT}`);

//Global variables that keep track of those connected to the server
let players = [null,null];
let ready = [false,false];
const everyone = [];

//On connection
wss.on('connection', function connection(ws) {

    ws.isAlive = true;
    ws.on('pong', heartbeat);

	ws.on('message', function incoming(data) {

        //Tell me what it is and print in console
		data = JSON.parse(data);
		console.log(data.text);

        //Update the board for everyone
        if (data.goal == "moveMade"){
            for (let i = 0;i < everyone.length;i++){
                if (ws !== everyone[i]){
                    q = {goal:"moveMade", player:data.player, sid:data.sid, text:"User made move"};
                    q = JSON.stringify(q);
                    everyone[i].send(q);
                }
            }
		}

        //Lets server know player is ready
        if (data.goal === "ready"){
            if (data.playerStatus !== "S"){
                if (data.playerStatus === "X"){
                    ready[0] = true;
                } else if (data.playerStatus === "O"){
                    ready[1] = true;
                }
                if (ready[0] && ready[1]){
                    console.log("Game Starting");
                    for(let i = 0; i < everyone.length; i++){
                        sendData(everyone[i], {goal: "start", text: "Starting Game!"});
                    }
                }
            }
        }

        //Ensures all clients are on the same page at the end of the games
        if (data.goal === "ended"){
            ready[0] = false;
            sendData(players[0],{goal: "cleanup"});
            ready[1] = false;
            sendData(players[1],{goal: "cleanup"});
        }

    });

    //Assigning player roles on connection (X, O, or Spectator)
    if (players[0] === null){
        players[0] = ws;
        ready[0] = true;
        sendData(ws, {goal: "setPlayerStatus", playerStatus:"X", playerName:"Player X", text:"Assigned Role Player X"});
        for (let i = 0;i < everyone.length;i++) {
            sendData(everyone[i],{goal:"reset", text: "Game resetting"});
        }
    } else if (players[1] === null){
        players[1] = ws;
        ready[1] = true;
        sendData(ws, {goal: "setPlayerStatus", playerStatus:"O", playerName:"Player O", text:"Assigned Role Player O"});
        for (let i = 0;i < everyone.length;i++) {
            sendData(everyone[i],{goal:"reset", text: "Game resetting"});
        }
    } else {
        sendData(ws, {goal: "setPlayerStatus", playerStatus:"S", playerName:"Spectator", text:"Assigned Role Spectator"});
        if (ready[0] && ready[1]){
            sendData(ws, {goal: "start", text:"Spectator start"});
        }
    }

    //Adding new ws to array
    everyone.push(ws);
    sendData(ws, {text:"Connection Successful!"});

});

//Basic function to send data to specific socket
function sendData(ws, data){
    data = JSON.stringify(data);
    ws.send(data);
}

//Function to see if connection is lost
function heartbeat() {
  this.isAlive = true;
}

//Function to remove ws from list when disconnect is detected
const interval = setInterval(function ping() {
    for (let i = 0;i < everyone.length;i++) {
        if (everyone[i].isAlive === false){
            if (everyone[i] === players[0]){
                players[0] = null;
                for (let i = 0;i < everyone.length;i++) {
                    sendData(everyone[i],{goal:"reset", text: "Game resetting"});
                }
            }
            if (everyone[i] === players[1]){
                players[1] = null;
                for (let i = 0;i < everyone.length;i++) {
                    sendData(everyone[i],{goal:"reset", text: "Game resetting"});
                }
            }
            let removed = everyone.splice(i);
            console.log("Player disconnected");
        }
        if (typeof everyone[i] !== 'undefined'){
        everyone[i].isAlive = false;
        everyone[i].ping();
        }
    }
}, 1000);

//On Close
wss.on('close', function close() {
    clearInterval(interval);
});
