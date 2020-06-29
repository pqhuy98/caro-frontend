import React from 'react';
import '../App.scss';
import { ReactComponent as XMark } from '../resource/x-mark.svg';
import { ReactComponent as OMark } from '../resource/o-mark.svg';
import { ReactComponent as EmptyMark } from '../resource/empty-mark.svg';

export default class Grid extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hovered: false,
        }
    }

    onMouseEnter(e) {
        if (this.state.hovered === false) {
            this.setState({ hovered: true });
        }
    }
    onMouseLeave(e) {
        if (this.state.hovered === true) {
            this.setState({ hovered: false });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.symbol !== nextProps.symbol) {
            return true;
        }
        if (this.props.classLastMove !== nextProps.classLastMove) {
            return true;
        }
        if (this.props.red !== nextProps.red) {
            return true;
        }
        if (this.state.hovered !== nextState.hovered) {
            return true;
        }
        return false;
    }

    render() {
        let symbol = this.props.symbol || null;
        let classLastMove = this.props.classLastMove;
        let occupied = (symbol !== null) ? " occupied" : " unoccupied";
        let pointer = (this.props.myTurn && !this.props.gameOver && symbol === null) ? " pointer" : "";
        let onClick = (symbol === null) ? this.props.play : null;
        let red = (this.props.red ? " red" : "");
        // console.log(onClick);
        let internal = null;
        if (symbol !== null) {
            if (symbol === "X") {
                internal = <XMark className="symbol"/>
            } else {
                internal = <OMark className="symbol"/>
            }
        } else {
            if (this.props.myTurn && this.state.hovered && !this.props.gameOver) {
                if (this.props.currentPlayer === "X") {
                    internal = <XMark className="symbol"/>;
                } else {
                    internal = <OMark className="symbol"/>;
                }
            } else {
                internal = <EmptyMark className="symbol"  />;
            }
        }
        return <td className={"grid" + occupied + pointer + classLastMove + red}
                    onMouseEnter={this.onMouseEnter.bind(this)}
                    onMouseLeave={this.onMouseLeave.bind(this)}
                    onClick={onClick}>
            { internal }
        </td>;
    }

}