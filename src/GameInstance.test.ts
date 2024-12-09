import { GameInstance } from './GameInstance';
import { Socket } from 'socket.io';
import { ChessGame } from '@evanboerchers/chess-core';
import { Move, PieceColour } from '@evanboerchers/chess-core/dist/chess.types';
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
    // Create mock sockets
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

    // Create mock players
    whitePlayer = { 
      socket: whiteSocket,
      name: 'WhitePlayer'
    };

    blackPlayer = { 
      socket: blackSocket,
      name: 'BlackPlayer'
    };

    // Mock ChessGame
    chessGame = new ChessGame();
    // Create GameInstance
    gameInstance = new GameInstance(blackPlayer, whitePlayer);
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

  describe('Socket Handlers', () => {
    test('should register move handlers for both players', () => {
      expect(whiteSocket.on).toHaveBeenCalledWith('makeMove', expect.any(Function));
      expect(blackSocket.on).toHaveBeenCalledWith('makeMove', expect.any(Function));
    });

    test('should handle move correctly', () => {
      // Simulate a move
      const mockMove: Move = { 
        from: 'e2', 
        to: 'e4', 
        promotion: undefined 
      };

      // Find the move handler for white player
      const whiteMoveHandler = (whiteSocket.on as jest.Mock).mock.calls
        .find(call => call[0] === 'makeMove')[1];

      // Call the move handler
      whiteMoveHandler(mockMove);

      // Verify move was made on chess game
      expect(chessGame.makeMove).toHaveBeenCalledWith(mockMove);

      // Verify move was emitted to both players
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

      // Verify game over event emitted to both players
      expect(whiteSocket.emit).toHaveBeenCalledWith('gameOver', expectedOutcome);
      expect(blackSocket.emit).toHaveBeenCalledWith('gameOver', expectedOutcome);
    });

    test('should handle draw offer workflow', () => {
      // Simulate draw offer from white player
      const blackSocketOnMock = blackSocket.on as jest.Mock;

      gameInstance.handleDrawOffered(PieceColour.WHITE);

      // Verify draw offer sent to black player
      expect(blackSocket.emit).toHaveBeenCalledWith('drawOffered');

      // Simulate draw acceptance
      const drawAcceptedHandler = blackSocketOnMock.mock.calls
        .find(call => call[0] === 'drawAccepted')[1];

      const expectedOutcome: GameOutcome = {
        winner: null,
        reason: GameOutcomeReason.DRAW
      };

      drawAcceptedHandler();

      // Verify game over event emitted
      expect(whiteSocket.emit).toHaveBeenCalledWith('gameOver', expectedOutcome);

      // Verify listeners removed
      expect(blackSocket.removeAllListeners).toHaveBeenCalledWith('drawAccepted');
      expect(blackSocket.removeAllListeners).toHaveBeenCalledWith('drawDeclined');
    });

    test('should handle draw decline', () => {
      const blackSocketOnMock = blackSocket.on as jest.Mock;

      gameInstance.handleDrawOffered(PieceColour.WHITE);

      // Simulate draw decline
      const drawDeclinedHandler = blackSocketOnMock.mock.calls
        .find(call => call[0] === 'drawDeclined')[1];

      drawDeclinedHandler();

      // Verify draw rejected event sent to white player
      expect(whiteSocket.emit).toHaveBeenCalledWith('drawRejected');

      // Verify listeners removed
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
        
      };

      gameInstance.emitMoveMade(whiteSocket, mockMove);
      expect(whiteSocket.emit).toHaveBeenCalledWith('moveMade', mockMove, gameInstance.game.gameState);
    });
  });
});