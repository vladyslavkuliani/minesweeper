import React, { Component } from 'react';
import Helmet from 'react-helmet';
import classnames from 'classnames';
import {Cell, GameMenu} from '../../components';
import {buildPlayground, expandArea, getGameAttributesByDifficulty} from 'utils/game';

export default class Playground extends Component {
  constructor(props) {
    super(props);

    this.state = this.initialState(getGameAttributesByDifficulty('expert'));

    this.gameAttributes = getGameAttributesByDifficulty('expert');
  }

  onPlayerClick(row, col, hasMine) {
    const {playground, revealedCellsLookup, markedCellsLookup, timer} = this.state;
    let updatedRevealedCells;

    if (hasMine) {
      this.gameOver(false, row, col);
    } else {
      updatedRevealedCells = expandArea(row, col, playground, revealedCellsLookup, markedCellsLookup);

      if (this.checkIfWinningCombination(updatedRevealedCells, markedCellsLookup)) {
        this.gameOver(true);
      } else {
        this.setState({revealedCellsLookup: updatedRevealedCells});
      }
    }

    if (timer === 0) {
      this.setState({intervalId: this.startTimer(), timer: 1});
    }
  }

  generateMines(gameAttributes) {
    const {height, width, mines} = gameAttributes;
    const minesLookup = {};
    let row;
    let col;

    while (Object.keys(minesLookup).length < mines) {
      row = Math.floor(Math.random() * (height));
      col = Math.floor(Math.random() * (width));
      minesLookup[`${row}_${col}`] = `${row}_${col}`;
    }

    return minesLookup;
  }

  initialState(gameAttributes) {
    const {height, width, mines} = gameAttributes;
    const minesLookup = this.generateMines(gameAttributes);
    return {
      playground: buildPlayground(height, width, minesLookup), // two dimensional array representing the board
      minesCellsLookup: minesLookup,
      revealedCellsLookup: {},
      markedCellsLookup: {},
      isGameOver: false,
      pressedMineCoords: {row: null, col: null},
      minesCount: mines,
      timer: 0,
      intervalId: null,
      showGameMenu: false,
    };
  }

  resetGame = () => {
    clearInterval(this.state.intervalId);
    this.setState(this.initialState(this.gameAttributes));
  }

  checkIfWinningCombination = (revealedCellsLookup, markedCellsLookup) => {
    const {height, width, mines} = this.gameAttributes;
    return Object.keys(revealedCellsLookup).length === width * height - mines && Object.keys(markedCellsLookup).length === mines;
  }

  startTimer() {
    return setInterval(this.countUp, 1000);
  }

  countUp = () => {
    const {timer, isGameOver, intervalId} = this.state;
    if (timer < 1000 && !isGameOver) {
      this.setState({timer: timer + 1});
    } else {
      clearInterval(intervalId);
    }
  }

  markCell(event, row, col) {
    event.preventDefault();
    const {revealedCellsLookup, markedCellsLookup} = this.state;
    let {minesCount} = this.state;

    if (!revealedCellsLookup[`${row}_${col}`]) {
      if (markedCellsLookup[`${row}_${col}`]) {
        markedCellsLookup[`${row}_${col}`] = null;
        minesCount++;
      } else {
        markedCellsLookup[`${row}_${col}`] = `${row}_${col}`;
        minesCount--;
      }

      if (this.checkIfWinningCombination(revealedCellsLookup, markedCellsLookup)) {
        this.gameOver(true);
      } else {
        this.setState({minesCount, markedCellsLookup});
      }
    }
  }

  gameOver(isVictory = false, row = null, col = null) {
    this.setState({isGameOver: true, pressedMineCoords: {row: row, col: col}});
  }

  openGameMenu = () => {
    this.setState({showGameMenu: true});
  }

  closeGameMenu = () => {
    this.setState({showGameMenu: false});
  }

  handleApplySettings(gameAttributes) {
    this.gameAttributes = gameAttributes;
    this.resetGame();
  }

  render() {
    const {minesCellsLookup, revealedCellsLookup, markedCellsLookup, playground, isGameOver, minesCount, timer, showGameMenu, pressedMineCoords} = this.state;

    const rows = [];
    for (let row = 0; row < this.gameAttributes.height; row++) {
      for (let col = 0; col < this.gameAttributes.width; col++) {
        rows.push(<Cell
                  key={`${row}_${col}`}
                  row={row}
                  col={col}
                  onPlayerClick={this.onPlayerClick.bind(this)}
                  onPlayerMarkCell={this.markCell.bind(this)}
                  hasMine={minesCellsLookup[`${row}_${col}`]}
                  minesAround={playground && playground[row][col] > 0 && playground[row][col] - 1}
                  hasMineAndPressed={pressedMineCoords.row === row && pressedMineCoords.col === col}
                  shouldRevealCell={revealedCellsLookup[`${row}_${col}`]}
                  shouldMarkCell={markedCellsLookup[`${row}_${col}`]}
                  isGameOver={isGameOver}
                  />);
      }
    }

    // 15px is the width of each cell
    const gridWidth = this.gameAttributes.width * 15;
    const mainGrid = (
        <div className="main-grid" style={{width: `${gridWidth}px`}}>
          {rows}
          {showGameMenu && <GameMenu handleApplySettings={this.handleApplySettings.bind(this)} handleExitMenu={this.closeGameMenu.bind(this)} gameAttributes={this.gameAttributes}/>}
        </div>);

    const resetButtonCl = classnames('reset-button', 'pointer', {
      'reset-button-ok': !isGameOver,
      'reset-button-lost': isGameOver && pressedMineCoords.row !== null,
      'reset-button-won': isGameOver && pressedMineCoords.row === null
    });

    return (
        <div className="minesweeper-body">
          <Helmet title="Minesweeper Online" />
          <div className="row">
            <h1 className="col-xs-6">Mines: {minesCount}</h1>
            <h1 className="col-xs-6">Timer: {timer}</h1>
          </div>
          <div><a className="pointer" onClick={this.openGameMenu}>Game</a></div>
          <hr />
          <div className={resetButtonCl} onClick={this.resetGame}></div>
          {mainGrid}
        </div>);
  }
}
