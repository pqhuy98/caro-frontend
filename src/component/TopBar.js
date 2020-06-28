import React from 'react';
import '../App.scss';

export default class TopBar extends React.Component {
	render() {
		return <div className="topbar">
			<button className="button" onClick={this.props.newGame}> New Game </button>
			<button className="button" onClick={this.props.undo}> Undo </button>
		</div>;
	}
}