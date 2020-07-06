import React from 'react';
import '../App.scss';

export default class TopBar extends React.Component {
	render() {
		return <div className="topbar">
			{this.props.playerId+"\t"}
			{this.props.status === "none" && this.props.readyToFind && <button className="button"
				onClick={this.props.findMatch}>
				Find match
			</button>}

			{this.props.status === "finding" && <button className="button"
				onClick={this.props.stopFinding}>
				Stop finding
			</button>}

			{
				this.props.status === "inMatch" && this.props.game === null &&
				// <button className="button"
				// 	onClick={this.props.connect}>
				// 	Reconnect
				// </button>
				"Connecting to game..."
			}


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
				<button className="button" key="quit"onClick={this.props.quit}>
					Quit
				</button>,
			]}
		</div>;
	}
}