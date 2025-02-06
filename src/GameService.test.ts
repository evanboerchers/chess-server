import { GamesService } from './GamesService';
import { GameInstance } from './GameInstance';
import { Player } from './types';
import { vi } from 'vitest'; // Import vi from Vitest for mocks

vi.mock('uuid', () => ({
  v4: vi.fn()
}));

vi.mock('./GameInstance', () => {
  return {
    GameInstance: vi.fn().mockImplementation((whitePlayer, blackPlayer) => {
      const uniqueUuid = vi.fn().mockReturnValueOnce('uuid-1')();
      return {
        uuid: uniqueUuid,
        whitePlayer,
        blackPlayer
      };
    })
  };
});

describe('GamesService', () => {
  let gamesService: GamesService;
  let mockWhitePlayer: Player;
  let mockBlackPlayer: Player;

  beforeEach(() => {
    vi.clearAllMocks();

    gamesService = new GamesService();

    mockWhitePlayer = {
      name: 'white-player-id',
      socket: {} as any
    };

    mockBlackPlayer = {
      name: 'black-player-id', 
      socket: {} as any
    };

    vi.mocked(vi.fn().mockReturnValueOnce('uuid-1')).mockReturnValueOnce('uuid-2')
      .mockReturnValueOnce('uuid-3')
      .mockReturnValueOnce('uuid-4')
      .mockReturnValueOnce('uuid-5');
  });

  describe('Constructor', () => {
    it('should initialize with empty waiting queue and active games', () => {
      expect(gamesService.waitingQueue).toHaveLength(0);
      expect(gamesService.activeGames.size).toBe(0);
    });
  });

  describe('addPlayerToQueue', () => {
    it('should add player to waiting queue', () => {
      gamesService.addPlayerToQueue(mockWhitePlayer);
      
      expect(gamesService.waitingQueue).toHaveLength(1);
      expect(gamesService.waitingQueue[0]).toBe(mockWhitePlayer);
    });

    it('should automatically match players when two are in the queue', () => {
      gamesService.addPlayerToQueue(mockWhitePlayer);
      gamesService.addPlayerToQueue(mockBlackPlayer);

      expect(GameInstance).toHaveBeenCalledWith(mockWhitePlayer, mockBlackPlayer);
      expect(gamesService.activeGames.size).toBe(1);
      expect(gamesService.waitingQueue).toHaveLength(0);
    });

    it('should handle multiple player additions', () => {
      const player1: Player = { name: 'player1', socket: {} as any };
      const player2: Player = { name: 'player2', socket: {} as any };
      const player3: Player = { name: 'player3', socket: {} as any };

      gamesService.addPlayerToQueue(player1);
      gamesService.addPlayerToQueue(player2);
      
      expect(gamesService.activeGames.size).toBe(1);
      expect(gamesService.waitingQueue).toHaveLength(0);

      gamesService.addPlayerToQueue(player3);
      
      expect(gamesService.activeGames.size).toBe(1);
      expect(gamesService.waitingQueue).toHaveLength(1);
      expect(gamesService.waitingQueue[0]).toBe(player3);
    });
  });

  describe('getGame', () => {
    it('should return game by UUID', () => {
      gamesService.addPlayerToQueue(mockWhitePlayer);
      gamesService.addPlayerToQueue(mockBlackPlayer);

      const gameUuid = Array.from(gamesService.activeGames.keys())[0];
      const game = gamesService.getGame(gameUuid);
      
      expect(game).toBeDefined();
      expect(game?.uuid).toBe(gameUuid);
    });

    it('should return undefined for non-existent game', () => {
      const game = gamesService.getGame('non-existent-uuid');
      
      expect(game).toBeUndefined();
    });
  });

  describe('getGameByPlayer', () => {
    it('should find game when player is white', () => {
      gamesService.addPlayerToQueue(mockWhitePlayer);
      gamesService.addPlayerToQueue(mockBlackPlayer);

      const game = gamesService.getGameByPlayer('white-player-id');
      
      expect(game).toBeDefined();
      expect(game?.whitePlayer).toBe(mockWhitePlayer);
    });

    it('should find game when player is black', () => {
      gamesService.addPlayerToQueue(mockWhitePlayer);
      gamesService.addPlayerToQueue(mockBlackPlayer);

      const game = gamesService.getGameByPlayer('black-player-id');
      
      expect(game).toBeDefined();
      expect(game?.blackPlayer).toBe(mockBlackPlayer);
    });

    it('should return undefined when player is not in any game', () => {
      const game = gamesService.getGameByPlayer('non-existent-player');
      
      expect(game).toBeUndefined();
    });
  });

  describe('removeGame', () => {
    it('should remove an existing game and return true', () => {
      gamesService.addPlayerToQueue(mockWhitePlayer);
      gamesService.addPlayerToQueue(mockBlackPlayer);

      const gameUuid = Array.from(gamesService.activeGames.keys())[0];
      const removeResult = gamesService.removeGame(gameUuid);
      
      expect(removeResult).toBe(true);
      expect(gamesService.activeGames.size).toBe(0);
    });

    it('should return false when trying to remove non-existent game', () => {
      const removeResult = gamesService.removeGame('non-existent-uuid');
      
      expect(removeResult).toBe(false);
    });
  });

  describe('Multiple Game Handling', () => {
    it('should create multiple unique games when more than two players join', () => {
      const player1: Player = { name: 'player1', socket: {} as any };
      const player2: Player = { name: 'player2', socket: {} as any };
      const player3: Player = { name: 'player3', socket: {} as any };
      const player4: Player = { name: 'player4', socket: {} as any };

      gamesService.addPlayerToQueue(player1);
      gamesService.addPlayerToQueue(player2);

      gamesService.addPlayerToQueue(player3);
      gamesService.addPlayerToQueue(player4);

      expect(gamesService.activeGames.size).toBe(2);

      const gameUuids = Array.from(gamesService.activeGames.keys());
      expect(gameUuids[0]).not.toBe(gameUuids[1]);

      const games = Array.from(gamesService.activeGames.values());
      expect(games[0].whitePlayer).toBe(player1);
      expect(games[0].blackPlayer).toBe(player2);
      expect(games[1].whitePlayer).toBe(player3);
      expect(games[1].blackPlayer).toBe(player4);
    });

    it('should handle many players joining the queue', () => {
      const players = Array.from({ length: 6 }, (_, i) => ({ 
        name: `player-${i}`, 
        socket: {} as any 
      }));

      players.forEach(player => gamesService.addPlayerToQueue(player));

      expect(gamesService.activeGames.size).toBe(3);
      expect(gamesService.waitingQueue).toHaveLength(0);

      const gameUuids = Array.from(gamesService.activeGames.keys());
      const uniqueUuids = new Set(gameUuids);
      expect(uniqueUuids.size).toBe(gameUuids.length);
    });
  });

  describe('createGame', () => {
    it('should create a new GameInstance', () => {
      const game = gamesService.createGame(mockWhitePlayer, mockBlackPlayer);
      
      expect(game).toBeDefined();
      expect(GameInstance).toHaveBeenCalledWith(mockWhitePlayer, mockBlackPlayer);
    });
  });
});
