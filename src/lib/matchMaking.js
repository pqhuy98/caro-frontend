import io from "socket.io-client";
import _ from "lodash";

export default class MatchMaking {
    constructor({ host, playerId }) {
        this.playerId = playerId;
        this.host = host;
        this.ready = false;
        this.unauthorized = false;

        this.onFound = _.noop;
    }

    _newConnection(onReady = _.noop) {
        let socket = io(this.host+"/match-making", { forceNew: true })
            .on("connect", () => {
                // Authentication
                socket.emit("authentication", this.playerId);
            })
            .on("authenticated", () => {
                console.log("match making connected");
                this.ready = true;
                onReady();
            })
            .on("unauthorized", data => {
                console.log("Error:", data);
                this.unauthorized = true;
            })
            .on("FOUND_MATCH", (matchId) => {
                console.log("found match", matchId);
                console.log(this.onFound);
                this.onFound(matchId);
                socket.disconnect();
            })
            .on("disconnect", () => {
                console.log("match making disconnected");
                this.ready = false;
            })

        this.socket = socket;
    }

    find({ onAck, onFound }) {
        console.log(this.ready);
        let find = () => {
            this.onFound = onFound || _.noop;
            this.socket.emit("FIND_MATCH", "", (data) => {
                console.log("find match", data);
                if (data === "OK") {
                    onAck();
                } else {
                    this.socket.disconnect();
                }
            });
        }
        if (this.ready) {
            find();
        } else {
            this._newConnection(find);
        }
    }

    stop({ onAck }) {
        let stop = () => {
            this.socket.emit("STOP_FINDING", "", (data) => {
                console.log("stop finding", data);
                if (data === "OK") {
                    onAck();
                } else {
                    this.socket.disconnect();
                }
            });
        }
        if (this.ready) {
            stop();
        } else {
            this._newConnection(stop);
        }
    }
}