import React from 'react';
import '../App.scss';

export default class TopBar extends React.Component {
	render() {
		return <div className="topbar">
			{this.props.game === null && <button className="button"
				onClick={this.props.finding ? this.props.stopFinding: this.props.findMatch}>
				{this.props.finding ? "Stop finding": "Find match"}
			</button>}
			{this.props.game !== null && [
				<button className="button" key="rmk"
					onClick={this.props.newGame}
					disabled={!this.props.game.gameOver}>
					Re-match
				</button>,
				<button className="button" key="undo"
					onClick={this.props.undo}
					disabled={
						!this.props.game.isCurrentPlayer(this.props.playerId) ||
						this.props.game.moves.length === 0}>
					Undo
				</button>,
				<button className="button" key="quit"onClick={this.props.abandon}>
					Quit
				</button>,
			]}
		</div>;
	}
}