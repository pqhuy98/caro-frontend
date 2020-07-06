import React from 'react';
import './App.scss';
import Game from "caro-core/dist"
import TopBar from "./component/TopBar";
import Board from "./component/Board";
import MatchMaking from "./lib/matchMaking";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

toastr.options.timeOut = 10000;

const HOST = "http://localhost:8080";

const playerId = prompt("Player ID:", uuidv4());
console.log(playerId+"");

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            playerId: playerId,


            matchMaking: new MatchMaking({
                host: HOST,
                playerId
            }),

            gameSocket: null,
            matchId: null,
            game: null,
        }
    }

    getPlayerStatus(callback) {
        fetch(HOST+"/status/"+playerId)
            .then(res => res.json())
            .then((result) => {
                console.log(result);
                this.setState(result, () => {
                    if (this.state.status === "inMatch" && !this.state.gameSocket) {
                        // Reconnect
                        this.connectMatch();
                    }
                });
            });
    }


    componentDidMount() {
        this.state.matchMaking._newConnection(
            () => this.getPlayerStatus(),
        );
    }

    // Match making

    findMatch(find) {
        this.state.matchMaking.find({
            onAck: () => this.getPlayerStatus(),
            onFound: () => this.getPlayerStatus(),
        })
    }

    stopFinding() {
        this.state.matchMaking.stop({
            onAck: () => this.getPlayerStatus(),
        });
    }

    connectMatch(matchId = null) {
        console.log(matchId);
        matchId = matchId || this.state.matchId;
        console.log("connect match", matchId);
        let socket = io(HOST+"/playing", { forceNew: true });
        socket.on("connect", () => {
            // Authentication
            socket.emit("authentication", playerId);
        })
        .on("authenticated", () => {
            // Connect to match Id
            socket.emit("CONNECT", matchId, (data) => {
                console.log(data);
                if (data === "OK") {
                    console.log("connected to match", matchId);
                    this.setState({
                        gameSocket: socket,
                    });
                } else {
                    socket.disconnect();
                }
            });
        })
        .on("unauthorized", data => {
            console.log("Error:", data);
        })
        .on("CONNECT", (data) => {
            console.log("player connected to match, playerId:", data);
        })
        .on("LATEST", (data) => {
            console.log("latest state", data);
            let game = new Game();
            Object.assign(game, JSON.parse(data));
            this.setState({
                game: game,
            });
        })
        .on("ACTION", (data) => {
            let action = JSON.parse(data);
            console.log("action", action);
            this.performAction(action);
        })

        let quitters = {};
        socket.on("QUIT", (data) => {
            let playerId = JSON.parse(data).playerId;
            console.log("quit", playerId);
            toastr.warning('Your opponent has quitted the game.');
            quitters[playerId] = true;
        })
        .on("DISCONNECT", (data) => {
            let playerId = JSON.parse(data).playerId;
            console.log("disconnect");
            console.log(quitters);
            if (!quitters[playerId]) {
                toastr.warning("Player " + playerId + " is having a network problem.");
            }
        })
        .on("disconnect", () => {
            toastr.clear();
            console.log("game disconnect");
            this.setState({
                game: null,
                gameSocket: null,
            }, () => this.getPlayerStatus());
        });    
    }

    quitMatch() {
        console.log("disconnect match");
        if (this.state.gameSocket) {
            this.state.gameSocket.emit("QUIT", "");
            this.state.gameSocket.disconnect();
            this.setState({
                gameSocket: null,
                game: null,
            });
        }
    }

    // Send actions to server
    play(color, x, y) {
        if (!this.state.gameSocket) return;
        console.log(color, x, y);
        let action = {
            type: "PLAY",
            x, y,
        }
        this.state.gameSocket.emit("ACTION", JSON.stringify(action));
    }
    undo() {
        if (!this.state.gameSocket) return;
        let action = {
            type: "UNDO",
            playerId: this.state.playerId,
        }
        this.state.gameSocket.emit("ACTION", JSON.stringify(action));
    }
    newGame() {
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
        console.log(this.state.matchMaking);
        return (<div>
            <TopBar
                status={this.state.status}
                readyToFind={this.state.matchMaking.ready}
                game={this.state.game}
                findMatch={this.findMatch.bind(this)}
                stopFinding={this.stopFinding.bind(this)}
                connect={() => this.connectMatch(null)}
                newGame={this.newGame.bind(this)}
                undo={this.undo.bind(this)}
                quit={this.quitMatch.bind(this)}
                playerId={playerId}
            />
            {this.state.game && <Board
                ref={(el) => {this.board = el}}
                game={this.state.game}
                reds={reds}
                gameOver={this.state.game.gameOver}
                play={this.play.bind(this)}
                playerId={playerId}
            />}
        </div>);
    }
}