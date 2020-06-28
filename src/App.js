import React from 'react';
import './App.scss';
import Game from "caro-core/dist"
import TopBar from "./component/TopBar";
import Board from "./component/Board";

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            game: new Game(),
            reds: [],
        }
    }

    componentDidMount() {
        // let H = this.board.offsetHeight;
        // let W = this.board.offsetWidth;
        // let {w, h} = viewport();
        // console.log(this.board.getBoundingClientRect());
        // console.log(H, W);
        // console.log(h, w);
    }

    play(player, x, y) {
        let next = this.state.game.play(player, x, y);
        if (next !== null) {
            this.setState({
                game: next,
            });
        }
    }
    undo() {
        let next = this.state.game.undo();
        if (next !== null) {
            this.setState({
                game: next,
            });
        }
    }
    newGame() {
        this.setState({
            game: new Game(),
        });
    }


    render() {
        let reds = [];
        let over = this.state.game.gameOver;
        if (over === true) {
            reds = this.state.game.findFive();
        }
        return (<div>
            <TopBar
                newGame={this.newGame.bind(this)}
                undo={this.undo.bind(this)}
            />
            <Board
                ref={(el) => {this.board = el}}
                game={this.state.game}
                reds={reds}
                gameOver={this.state.game.gameOver}
                play={this.play.bind(this)}
            />
        </div>);
    }
}

function viewport() {
    var e = window, a = 'inner';
    if (!( 'innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { w : e[ a+'Width' ] , h : e[ a+'Height' ] }
}