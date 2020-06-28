import React from 'react';
import _ from "lodash";
import '../App.scss';
import Grid from "./Grid"

export default class Board extends React.Component {

	render() {
		let moves = this.props.game.moves || [];
		let set = {};
		let mxX = 30;
		let mxY = 15;
		let lastPlayer = "X";
		let lastMove = "";
		moves.forEach((m) => {
			let args = m.split(":");
			let x = parseInt(args[1], 10);
			let y = parseInt(args[2], 10);
			let pos = x+":"+y;
			set[pos] = args[0];
			lastPlayer = set[pos];
			lastMove = pos;
		});
		let currentPlayer = (lastPlayer === "X") ? "O" : "X";
		return (
			<div>
				<table className="board"><tbody>
					{
						_.range(-mxY, mxY+1).map((y) =>
							<tr key={y}>{
								_.range(-mxX, mxX+1).map((x) => {
									let pos = x+":"+y;
									let classLastMove = (pos === lastMove) ? " lastMove" : "";
									return <Grid key={x}
										x={x}
										y={y}
										symbol={set[pos]}
										classLastMove={classLastMove}
										currentPlayer={currentPlayer}
										gameOver={this.props.gameOver}
										play={() => this.props.play(currentPlayer, x, y)}
										red={(x===0 && y===0) || this.props.reds.includes(set[pos]+":"+pos)}
									/>
								})
							}</tr>
						)
					}
				</tbody></table>
			</div>
		);
	}

}