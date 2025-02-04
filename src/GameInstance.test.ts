import { GameInstance } from './GameInstance';
import { Socket } from 'socket.io';
import { ChessGame } from '@evanboerchers/chess-core';
import { Move, PieceColour, PieceType } from '@evanboerchers/chess-core';
import { Player } from './types';
import { GameOutcome, GameOutcomeReason } from './types';

describe('GameInstance', () => {
  let whiteSocket: jest.Mocked<Socket>;
  let blackSocket: jest.Mocked<Socket>;
  let whitePlayer: Player;
  let blackPlayer: Player;
  let gameInstance: GameInstance;
  let chessGame: ChessGame;

  beforeEach(() => {
    whiteSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn()
    } as unknown as jest.Mocked<Socket>;

    blackSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn()
    } as unknown as jest.Mocked<Socket>;

    whitePlayer = { 
      socket: whiteSocket,
      name: 'WhitePlayer'
    };

    blackPlayer = { 
      socket: blackSocket,
      name: 'BlackPlayer'
    };

    jest.spyOn(ChessGame.prototype, 'makeMove').mockImplementation(jest.fn());
    chessGame = new ChessGame();
    gameInstance = new GameInstance(whitePlayer, blackPlayer);
  });

  afterEach(() => {
    jest.clearAllMocks(); 
  });

  describe('Constructor', () => {
    test('should initialize game with correct players', () => {
      expect(gameInstance.whitePlayer).toBe(whitePlayer);
      expect(gameInstance.blackPlayer).toBe(blackPlayer);
    });

    test('should emit game start events', () => {
      expect(whiteSocket.emit).toHaveBeenCalledWith('gameStarted');
      expect(blackSocket.emit).toHaveBeenCalledWith('gameStarted');
      expect(blackSocket.emit).toHaveBeenCalledWith('waiting');
      expect(whiteSocket.emit).toHaveBeenCalledWith('makeMove');
    });
  });

  describe('Move Handlers', () => {
    test('should handle move correctly', () => {
      const mockMove: Move = { 
        from: {row: 1, col:1}, 
        to: {row: 3, col: 1}, 
        piece: {colour: PieceColour.BLACK, type: PieceType.PAWN}
      };
      const whiteMoveHandler = (whiteSocket.on as jest.Mock).mock.calls
        .find(call => call[0] === 'makeMove')[1];
      whiteMoveHandler(mockMove);
      expect(chessGame.makeMove).toHaveBeenCalledWith(mockMove);
      expect(whiteSocket.emit).toHaveBeenCalledWith('moveMade', mockMove, chessGame.gameState);
      expect(blackSocket.emit).toHaveBeenCalledWith('moveMade', mockMove, chessGame.gameState);
    });
  });

  describe('Game Outcome Handling', () => {
    test('should handle resignation correctly', () => {
      const expectedOutcome: GameOutcome = {
        winner: PieceColour.BLACK,
        reason: GameOutcomeReason.RESIGN
      };

      gameInstance.handleResign(PieceColour.WHITE);

      expect(whiteSocket.emit).toHaveBeenCalledWith('gameOver', expectedOutcome);
      expect(blackSocket.emit).toHaveBeenCalledWith('gameOver', expectedOutcome);
    });

    test('should handle draw offer workflow', () => {
      const blackSocketOnMock = blackSocket.on as jest.Mock;

      gameInstance.handleDrawOffered(PieceColour.WHITE);

      expect(blackSocket.emit).toHaveBeenCalledWith('drawOffered');

      const drawAcceptedHandler = blackSocketOnMock.mock.calls
        .find(call => call[0] === 'drawAccepted')[1];

      const expectedOutcome: GameOutcome = {
        winner: null,
        reason: GameOutcomeReason.DRAW
      };

      drawAcceptedHandler();

      expect(whiteSocket.emit).toHaveBeenCalledWith('gameOver', expectedOutcome);

      expect(blackSocket.removeAllListeners).toHaveBeenCalledWith('drawAccepted');
      expect(blackSocket.removeAllListeners).toHaveBeenCalledWith('drawDeclined');
    });

    test('should handle draw decline', () => {
      const blackSocketOnMock = blackSocket.on as jest.Mock;

      gameInstance.handleDrawOffered(PieceColour.WHITE);

      const drawDeclinedHandler = blackSocketOnMock.mock.calls
        .find(call => call[0] === 'drawDeclined')[1];

      drawDeclinedHandler();

      expect(whiteSocket.emit).toHaveBeenCalledWith('drawRejected');

      expect(blackSocket.removeAllListeners).toHaveBeenCalledWith('drawAccepted');
      expect(blackSocket.removeAllListeners).toHaveBeenCalledWith('drawDeclined');
    });
  });

  describe('Utility Methods', () => {
    test('getPlayer should return correct player for color', () => {
      expect(gameInstance.getPlayer(PieceColour.WHITE)).toBe(whitePlayer);
      expect(gameInstance.getPlayer(PieceColour.BLACK)).toBe(blackPlayer);
    });

    test('getOpponent should return correct opponent', () => {
      expect(gameInstance.getOpponent(PieceColour.WHITE)).toBe(blackPlayer);
      expect(gameInstance.getOpponent(PieceColour.BLACK)).toBe(whitePlayer);
    });
  });

  describe('Emit Methods', () => {
    test('emitGameStarted should emit correct event', () => {
      gameInstance.emitGameStarted(whiteSocket);
      expect(whiteSocket.emit).toHaveBeenCalledWith('gameStarted');
    });

    test('emitMakeMove should emit correct event', () => {
      gameInstance.emitMakeMove(whiteSocket);
      expect(whiteSocket.emit).toHaveBeenCalledWith('makeMove');
    });

    test('emitMoveMade should emit move and game state', () => {
      const mockMove: Move = { 
        from: {row: 6, col: 4}, 
        to: {row: 6, col: 4}, 
        piece: {colour: PieceColour.WHITE, type: PieceType.PAWN}
      };
      gameInstance.emitMoveMade(whiteSocket, mockMove);
      expect(whiteSocket.emit).toHaveBeenCalledWith('moveMade', mockMove, gameInstance.game.gameState);
    });
  });
});