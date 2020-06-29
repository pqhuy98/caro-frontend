import React from 'react';
import './App.scss';
import Game from "caro-core/dist"
import TopBar from "./component/TopBar";
import Board from "./component/Board";
import socketIOClient from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

toastr.options.timeOut = 10000;


const playerId = uuidv4();
console.log(playerId+"");

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            game: null,
            playerId: playerId,
            mmSocket: null,
            gameSocket: null,
            matchId: null,
        }
    }

    componentDidMount() {
        // this.findMatch();
    }

    // Match making

    findMatch() {
        console.log("find match");
        // Socket
        const socket = socketIOClient("http://192.168.26.120:8080", {path:"/match_making"});
        socket.on("connect", () => {
            this.setState({
                mmSocket: socket,
            }, () => {
                // Authentication
                socket.emit("AUTH", playerId);
                // Find match
                socket.emit("FIND_MATCH", playerId, (data) => {
                    console.log(data);
                    if (data !== "OK") {
                        socket.disconnect();
                    }
                });
                // Found
                socket.on("FOUND_MATCH", (matchId) => {
                    console.log("found", matchId);                            
                    this.setState({
                        matchId: matchId,
                    }, () => {
                        this.connectMatch(() => {
                            socket.disconnect();
                        });
                    });
                });
            })
        });
        socket.on("disconnect", () => {
            console.log("MM disconnect");
            this.setState({
                mmSocket: null,
            });
        });
    }

    stopFinding() {
        console.log("stop finding");
        this.state.mmSocket.emit("STOP_FINDING", "", (data) => {
            console.log(data);
            this.state.mmSocket.disconnect();

        })
    }

    connectMatch(callback) {
        console.log("connect match");
        let matchId = this.state.matchId;
        // Socket
        const socket = socketIOClient("http://192.168.26.120:8080", {path:"/on_match"});
        socket.on("connect", () => {
            console.log(socket);
            // Authentication
            this.setState({
                gameSocket: socket,
            }, () => {
                socket.emit("AUTH", playerId+":"+matchId);
                socket.on("JOIN", (data) => {
                    console.log("join", data);
                });
                socket.on("LATEST", (data) => {
                    let game = new Game();
                    Object.assign(game, JSON.parse(data));
                    this.setState({
                        game: game,
                    }, callback);
                })
                socket.on("ACTION", (data) => {
                    let action = JSON.parse(data);
                    this.performAction(action);
                });
                let quitters = {};
                socket.on("DISCONNECT", (playerId) => {
                    console.log("disconnect");
                    console.log(quitters);
                    if (!quitters[playerId]) {
                        toastr.warning('Your opponent is having a network problem.');
                    }
                });
                socket.on("ABANDON", (playerId) => {
                    console.log("abandon");
                    toastr.warning('Your opponent has abandoned the game.');
                    quitters[playerId] = true;
                });
            });
        });
        socket.on("disconnect", () => {
            console.log("game disconnect");
            this.setState({
                gameSocket: null,
            });
        });    
    }

    abandonMatch() {
        console.log("disconnect match");
        if (this.state.gameSocket) {
            this.state.gameSocket.emit("ABANDON", "");
            this.state.gameSocket.disconnect();
            this.setState({
                gameSocket: null,
                game: null,
            });
        }
        toastr.clear();
    }

    // Send actions to server
    inputPlay(color, x, y) {
        if (!this.state.gameSocket) return;
        console.log(color, x, y);
        let action = {
            type: "PLAY",
            x, y,
        }
        this.state.gameSocket.emit("ACTION", JSON.stringify(action));
    }
    inputUndo() {
        if (!this.state.gameSocket) return;
        let action = {
            type: "UNDO",
            playerId: this.state.playerId,
        }
        this.state.gameSocket.emit("ACTION", JSON.stringify(action));
    }
    inputNewGame() {
        if (!this.state.gameSocket) return;
        let action = {
            type: "NEW_GAME",
            playerId: this.state.playerId,
        }
        this.state.gameSocket.emit("ACTION", JSON.stringify(action));
    }

    // Apply actions to client version of the game
    setLatest(game) {
        this.setState({
            game: game,
        })
    }
    performAction(action) {
        let next = this.state.game.act(action);
        if (next !== null) {
            this.setState({
                game: next,
            });
        }        
    }

    // Render
    render() {
        let reds = [];
        if (this.state.game) {
            if (this.state.game.gameOver === true) {
                reds = this.state.game.findFive();
            }            
        }
        return (<div>
            <TopBar
                game={this.state.game}
                findMatch={this.findMatch.bind(this)}
                stopFinding={this.stopFinding.bind(this)}
                finding={this.state.mmSocket}
                newGame={this.inputNewGame.bind(this)}
                undo={this.inputUndo.bind(this)}
                abandon={this.abandonMatch.bind(this)}
                playerId={playerId}
            />
            {this.state.game && <Board
                ref={(el) => {this.board = el}}
                game={this.state.game}
                reds={reds}
                gameOver={this.state.game.gameOver}
                play={this.inputPlay.bind(this)}
                playerId={playerId}
            />}
        </div>);
    }
}