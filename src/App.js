import React from 'react';
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import './App.scss';
import Game from "caro-core/dist"
import TopBar from "./component/TopBar";
import Board from "./component/Board";
import MatchMaking from "./lib/matchMaking";
import MatchConnection from "./lib/matchConnection";

const HOST = "http://localhost:8080";
const playerId = prompt("Player ID:", uuidv4());
console.log(playerId+"");

toastr.options.timeOut = 10000;

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            playerId: playerId,


            matchMaking: new MatchMaking({
                host: HOST,
                playerId
            }),

            matchConnection: new MatchConnection({
                host: HOST,
                playerId
            }),

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
        this.state.matchConnection.connect();
        this.state.matchConnection
            .onConnected(_.noop)
            .onUnauthorized((data) => {
                toastr.error("Cannot connect to match: " + data);
            })
            .onPlayerConnect((data) => {
                toastr.info("Player " + data.playerId + " has joined the game.");
            })
            .onPlayerDisconnect((data) => {
                toastr.warning("Player " + data.playerId + " has disconnected from the game.");
            })
            .onPlayerQuit((data) => {
                toastr.warning("Player " + data.playerId + " has quit the game.");
            })
            .onLatest((obj) => {
                let game = new Game();
                Object.assign(game, obj);
                this.setState({ game: game });
            })
            .onAction((action) => {
                let next = this.state.game.act(action);
                if (next) {
                    this.setState({ game: next });
                }
            })
            .onDisconnect((action) => {
                toastr.clear();
                this.setState(
                    { game: null },
                    () => this.getPlayerStatus()
                );
            })
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
        this.state.matchConnection.connect(matchId);  
    }

    quitMatch() {
        this.state.matchConnection.quit();
    }

    // Send actions to server
    play(color, x, y) {
        this.state.matchConnection.sendAction({
            type: "PLAY",
            x, y,
        });
    }
    undo() {
        this.state.matchConnection.sendAction({
            type: "UNDO",
            playerId: this.state.playerId,
        });
    }
    newGame() {
        this.state.matchConnection.sendAction({
            type: "NEW_GAME",
            playerId: this.state.playerId,
        })
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