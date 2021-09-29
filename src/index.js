//Frontend React Code

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

//Backend Node Server
const socket = new WebSocket('ws://192.168.0.31:3002');

// Connection Opened
socket.addEventListener('open', function (event) {
	var data = {text:"Initial connection"};
	data = JSON.stringify(data);
    socket.send(data);
});

// Listen for messages
socket.addEventListener('message', function (data) {
	console.log("Received: " + data.data);
	data = JSON.parse(data.data);
    console.log('Message from server: ' + data.text);

    if(data.goal === "setPlayerStatus"){
        window.playArea.setState({playerStatus:data.playerStatus});
        window.playArea.setState({playerName:data.playerName});
        if (data.playerStatus !== "S"){
            sendServer({goal:"ready", playerStatus: window.playArea.state.playerStatus, text: window.playArea.state.playerName + " is ready"});
        } else {
            sendServer({goal: "none", text: "Spectator Joined"})
        }
    }

    if (data.goal === "moveMade") {
        window.playArea.updateBoard(data.sid);
        window.playArea.updateData();
    }

    if (data.goal === "start"){
        if (window.playArea.state.playerStatus === "S"){
            window.playArea.setState({
                boardConfig: ["e","e","e","e","e","e","e","e","e"],
                currentTurn: "Z",
                turnNo: 0,
                gameWon: false,
                winner: "Z",
                endGame: false,
            })
        }
        window.playArea.startGame();
    }

    if (data.goal === "cleanup"){
        window.playArea.setState({endGame: true, started: false});
    }

	if (data.goal === "reset"){
		reset();
		window.playArea.setState({started: true});
	}
});

//Called when waiting for new game to start
function reset(){
    window.playArea.setState({
        boardConfig: ["e","e","e","e","e","e","e","e","e"],
        currentTurn: "Z",
        turnNo: 0,
        gameWon: false,
        winner: "Z",
        endGame: false,
    })
    sendServer({goal:"ready", playerStatus: window.playArea.state.playerStatus, text: window.playArea.state.playerName + " readied up"});
}

//Base function to send data to backend
function sendServer(i){
    var data = i;
    data = JSON.stringify(data);
    console.log("Sending " + data);
    socket.send(data);
}

//Squares on the board
class Square extends React.Component {

    render(){
        return (
            <div class={"square " +this.props.value} onClick={() => this.props.parseClick(this.props.sid)}></div>
        )
    }

}

//Root React Component, contains the majority of game logic functions
class PlayArea extends React.Component {

    constructor(props){
        super(props);
        window.playArea = this;
        this.state = {
            boardConfig: ["e","e","e","e","e","e","e","e","e"],
            currentTurn: "Z",
            turnNo: 0,
            gameWon: false,
            winner: "Z",
            playerStatus: null,
            playerName: "Not connected to the server :(",
            started: false,
            endGame: false,
        }
    }

    printSquare(i){
        return <Square sid={i} value={this.state.boardConfig[i]} parseClick={() => this.parseClick(i)}/>
    }

    parseClick(i){
        if(this.state.boardConfig[i] === "e" && !this.state.gameWon && (this.state.playerStatus === this.state.currentTurn)){
            sendServer({goal:"moveMade", player:this.state.currentTurn, playerStatus: window.playArea.state.playerStatus, sid:i, text:this.state.playerName + " made move"});
            this.updateBoard(i);
            this.updateData();
        }
    }

    updateData(){
        this.switchTurn();
        this.incrementTurn();
        let w = this.checkWin(this.state.boardConfig)
        this.setState({winner: w});
        let win = this.state.winner;
        if (win === "X"){
            this.endGame("X");
        } else if (win === "O"){
            this.endGame("O");
        } else if (win === "D"){
            this.endGame("D");
        }
    }

    updateBoard(i){
        let x = this.state.boardConfig;
        x[i] = this.state.currentTurn;
        this.setState({boardConfig: x});
    }

    switchTurn(){
        let x = this.state.currentTurn;
        if(x==="X"){
            this.setState({currentTurn:"O"});
        }else{
            this.setState({currentTurn:"X"});
        }
    }

    incrementTurn(){
        let x = this.state.turnNo;
        x = x + 1;
        this.setState({turnNo: x});
    }

    checkWin(board){
        let x = [
            [0,1,2],
            [3,4,5],
            [6,7,8],
            [0,3,6],
            [1,4,7],
            [2,5,8],
            [0,4,8],
            [6,4,2]
        ];
        for (let i = 0; i < 8; i++) {
            const [a, b, c] = x[i];
            if (board[a] !== "e" && board[a] === board[b] && board[a] === board[c]) {
                this.setState({gameWon: true});
                return board[a];
            }
        }
        if (this.state.turnNo === 9){
            this.setState({gameWon: true});
            return "D";
        }
        return "Z";
    }

    startGame(){
        this.setState({currentTurn: "X"});
        this.setState({started: true});
    }

    endGame(i){
        console.log(i + " Wins");
        this.setState({started: false});
        this.setState({endGame: true});
        sendServer({goal:"ended", playerStatus: this.state.playerStatus, text:"Game Ended"});
    }

    printWho(){
        return <Who player={this.state.playerName}/>
    }

    printStatus(){
        return <Status winner={this.state.winner} status={this.state.currentTurn} started={this.state.started}/>
    }

    render() {
        return (
                <div id="playarea">
                    {this.printWho()}
                    <div id="board">
                    {this.printSquare(0)}
                    {this.printSquare(1)}
                    {this.printSquare(2)}
                    {this.printSquare(3)}
                    {this.printSquare(4)}
                    {this.printSquare(5)}
                    {this.printSquare(6)}
                    {this.printSquare(7)}
                    {this.printSquare(8)}
                    </div>
                    {this.printStatus()}
                </div>
        );
    }

}

//The top text box
class Who extends React.Component {

    render() {
        return (
            <div id="who">You are: {this.props.player}</div>
        )
    }

}

//The bottom text box
class Status extends React.Component {

    //Long-ish if chain to display the correct type of output
    render(){
        if (window.playArea.state.playerStatus !== "S" && window.playArea.state.endGame && this.props.winner !== "Z" && this.props.winner !== "D") {
            return (
                <div id="status" class="again" onClick={() => reset()}>{this.props.winner} has won! Click to play again</div>
            )
        } else if (window.playArea.state.playerStatus !== "S" && window.playArea.state.endGame) {
            return (
                <div id="status" class="again" onClick={() => reset()}>Game ends in a Draw! Click to play again</div>
            )
        } else if (this.props.started === false && window.playArea.state.playerStatus !== "S"){
            return (
                <div id="status">Waiting for opponent...</div>
            )
        } else if (this.props.winner === "Z"){
            return (
                <div id="status">{this.props.status}'s turn to play</div>
            )
        } else if (this.props.winner === "D") {
            return (
                <div id="status ">Game ends in a Draw!</div>
            )
        } else {
            return (
                <div id="status">{this.props.winner} has won!</div>
            )
        }
    }

}

//Render the play area
ReactDOM.render(
    <PlayArea />,
    document.getElementById('main')
);
