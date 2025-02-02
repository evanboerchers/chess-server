import gamesService, { GamesService } from './GamesService';
import { GameInstance } from './GameInstance';
import { Player } from './types';
import { Socket } from 'socket.io';

// Mock the GameInstance class
jest.mock('./GameInstance');

describe('GamesService', () => {
  let service: GamesService;
  let mockSocket1: jest.Mocked<Socket>;
  let mockSocket2: jest.Mocked<Socket>;
  let mockPlayer1: Player;
  let mockPlayer2: Player;
  let mockGameInstance: GameInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket1 = {
      id: 'socket1',
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
    mockSocket2 = {
      id: 'socket2',
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
    mockPlayer1 = {
      name: 'player1',
      socket: mockSocket1
    };
    mockPlayer2 = {
      name: 'player2',
      socket: mockSocket2
    };
    mockGameInstance = {
      uuid: 'game-uuid',
      whitePlayer: mockPlayer1,
      blackPlayer: mockPlayer2
    } as GameInstance;
    service = new GamesService();
    (GameInstance as jest.Mock).mockImplementation(() => mockGameInstance);
  });

  describe('addPlayerToQueue', () => {
    it('should add a player to the waiting queue', () => {
      service.addPlayerToQueue(mockPlayer1);
      expect(service.waitingQueue).toContain(mockPlayer1);
    });

    it('should match players when there are enough players in queue', () => {
      const spy = jest.spyOn(service, 'matchPlayers');
      
      service.addPlayerToQueue(mockPlayer1);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('matchPlayers', () => {
    it('should create a game when there are two players in queue', () => {
      service.addPlayerToQueue(mockPlayer1);
      service.addPlayerToQueue(mockPlayer2);

      expect(service.waitingQueue).toHaveLength(0);
      expect(service.activeGames.size).toBe(1);
      expect(GameInstance).toHaveBeenCalledWith(mockPlayer1, mockPlayer2);
    });

    it('should not create a game when there is only one player in queue', () => {
      service.addPlayerToQueue(mockPlayer1);

      expect(service.waitingQueue).toHaveLength(1);
      expect(service.activeGames.size).toBe(0);
    });

    it('should handle multiple pairs of players', () => {
      const mockSocket3 = {
        id: 'socket3',
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as jest.Mocked<Socket>;

      const mockSocket4 = {
        id: 'socket4',
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as jest.Mocked<Socket>;

      const mockPlayer3: Player = {
        name: 'player3',
        socket: mockSocket3
      };

      const mockPlayer4: Player = {
        name: 'player4',
        socket: mockSocket4
      };

      service.addPlayerToQueue(mockPlayer1);
      service.addPlayerToQueue(mockPlayer2);
      service.addPlayerToQueue(mockPlayer3);
      service.addPlayerToQueue(mockPlayer4);

      expect(service.waitingQueue).toHaveLength(0);
      expect(service.activeGames.size).toBe(2);
    });
  });

  describe('createGame', () => {
    it('should create a new game instance with the provided players', () => {
      const game = service.createGame(mockPlayer1, mockPlayer2);
      
      expect(GameInstance).toHaveBeenCalledWith(mockPlayer1, mockPlayer2);
      expect(game).toBe(mockGameInstance);
    });
  });

  describe('getGame', () => {
    it('should return the game with the specified UUID', () => {
      service.addPlayerToQueue(mockPlayer1);
      service.addPlayerToQueue(mockPlayer2);

      const game = service.getGame(mockGameInstance.uuid);
      expect(game).toBe(mockGameInstance);
    });

    it('should return undefined for non-existent game UUID', () => {
      const game = service.getGame('non-existent-uuid');
      expect(game).toBeUndefined();
    });
  });

  describe('getGameByPlayer', () => {
    beforeEach(() => {
      service.addPlayerToQueue(mockPlayer1);
      service.addPlayerToQueue(mockPlayer2);
    });

    it('should return game for white player UUID', () => {
      const game = service.getGameByPlayer(mockPlayer1.name);
      expect(game).toBe(mockGameInstance);
    });

    it('should return game for black player UUID', () => {
      const game = service.getGameByPlayer(mockPlayer2.name);
      expect(game).toBe(mockGameInstance);
    });

    it('should return undefined for non-existent player UUID', () => {
      const game = service.getGameByPlayer('non-existent-uuid');
      expect(game).toBeUndefined();
    });
  });

  describe('removeGame', () => {
    beforeEach(() => {
      service.addPlayerToQueue(mockPlayer1);
      service.addPlayerToQueue(mockPlayer2);
    });

    it('should remove the game with the specified UUID', () => {
      const result = service.removeGame(mockGameInstance.uuid);
      
      expect(result).toBe(true);
      expect(service.activeGames.size).toBe(0);
    });

    it('should return false when trying to remove non-existent game', () => {
      const result = service.removeGame('non-existent-uuid');
      
      expect(result).toBe(false);
      expect(service.activeGames.size).toBe(1);
    });
  });
});