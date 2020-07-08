import io from "socket.io-client";

export default class MatchConnection {
    constructor({ host, playerId }) {
        this.host = host;
        this.playerId = playerId;
        this.socket = null;
        this.connected = false;
    }

    connect(matchId) {
        if (this.socket !== null) {
            this.socket.disconnect();
        }

        let quitters = new Set();

        let socket = io(this.host+"/playing", { forceNew: true })
        .on("connect", () => {
            // Authentication
            socket.emit("authentication", this.playerId);
        })
        .on("authenticated", () => {
            // Connect to match Id
            socket.emit("CONNECT", matchId, (data) => {
                console.log(data);
                if (data === "OK") {
                    console.log("Connected to match", matchId);
                    this.connected = true;
                    this.onConnectedFn(data);
                } else {
                    socket.disconnect();
                }
            });
        })
        .on("unauthorized", data => {
            console.log("Unauthorized when to connect", data);
            this.onUnauthorizedFn(data);
        })
        .on("CONNECT", (data) => {
            console.log("Player connected to match", data);
            this.onPlayerConnectFn(data);
        })
        .on("QUIT", (data) => {
            console.log("Player quit game", data);
            this.onPlayerQuitFn(data);
            quitters.add(data.playerId);
        })
        .on("DISCONNECT", (data) => {
            // Disconnected, not quit yet.
            if (!quitters.has(data.playerId)) {
                console.log("Player disconnected", data);
                this.onPlayerDisconnectFn(data);
            }
        })
        .on("LATEST", (data) => {
            console.log("Latest state", data);
            this.onLatestFn(data);
        })
        .on("ACTION", (action) => {
            console.log("action", action);
            this.onActionFn(action);
        })
        .on("disconnect", () => {
            console.log("Disconnected from match", matchId);
            this.connected = false;
            this.socket = null;
            this.onDisconnectFn();
        });
        this.socket = socket;
    }

    quit() {
        if (this.socket && this.connected) {
            this.socket.emit("QUIT", "");
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendAction(action) {
        if (this.connected) {
            this.socket.emit("ACTION", JSON.stringify(action));
        }
    }

    // Listeners

    onConnected(fn) {
        this.onConnectedFn = fn;
        return this;
    }

    onUnauthorized(fn) {
        this.onUnauthorizedFn = fn;
        return this;
    }

    onPlayerConnect(fn) {
        this.onPlayerConnectFn = fn;
        return this;
    }

    onPlayerQuit(fn) {
        this.onPlayerQuitFn = fn;
        return this;
    }

    onPlayerDisconnect(fn) {
        this.onPlayerDisconnectFn = fn;
        return this;
    }

    onLatest(fn) {
        this.onLatestFn = fn;
        return this;
    }

    onAction(fn) {
        this.onActionFn = fn;
        return this;
    }

    onDisconnect(fn) {
        this.onDisconnectFn = fn;
        return this;
    }
}