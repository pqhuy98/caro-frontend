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
			let x = parseInt(m.split(":")[1], 10);
			let y = parseInt(m.split(":")[2], 10);
			set[x+":"+y] = m.split(":")[0];
			lastPlayer = set[x+":"+y];
			lastMove = x+":"+y;
		});
		let currentPlayer = (lastPlayer === "X") ? "O" : "X";
		return (
			<div>
				<table className="board"><tbody>
					{
						_.range(-mxY, mxY+1).map((y) =>
							<tr key={y}>{
								_.range(-mxX, mxX+1).map((x) => {
									let classLastMove = (x+":"+y === lastMove) ? " lastMove" : "";
									return <Grid key={x}
										symbol={set[x+":"+y]}
										classLastMove={classLastMove}
										currentPlayer={currentPlayer}
										gameOver={this.props.gameOver}
										play={() => this.props.play(currentPlayer, x, y)}
										red={(x===0 && y===0) || this.props.reds.includes(set[x+":"+y]+":"+x+":"+y)}
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