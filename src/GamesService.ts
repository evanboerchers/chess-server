import { GameInstance } from "./GameInstance";
import { GameSocket, Player, PlayerData } from "./types";
import { v4 as uuidv4 } from "uuid";

export class GamesService {
  connections: Map<string, GameSocket>; // playerId -> socket
  waitingQueue: Player[];
  activeGames: Map<string, GameInstance>;

  constructor() {
    this.connections = new Map();
    this.waitingQueue = [];
    this.activeGames = new Map();
  }

  connectPlayer(socket: GameSocket): void {
    let playerId = socket.handshake.auth.playerId;
    socket.data.playerId = playerId;

    if (!playerId) {
      console.log(
        `❌ Connection rejected: Missing playerId (Socket ID: ${socket.id})`,
      );
      socket.disconnect(true);
      return;
    }

    console.log(`Player connected: ${playerId} (Socket ID: ${socket.id})`);
    this.connections.set(playerId, socket);
    this.emitQueueCount();
    this.registerConnectionEvents(socket);
    this.setupLogging(socket);
  }

  registerConnectionEvents(socket: GameSocket) {
    socket.on("joinQueue", (playerData: PlayerData) => {
      this.handleJoinQueue(socket, playerData);
    });
    socket.on("leaveQueue", () => {
      this.handleLeaveQueue(socket);
    });
    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  setupLogging(socket: GameSocket): void {
    socket.onAny((event, ...args) => {
      console.log(
        `⬅️ Received event "${event}" from ${socket.data.playerId} (${socket.id})`,
        args,
      );
    });
    socket.onAnyOutgoing((event, ...args) => {
      console.log(
        `➡️ Emitted event "${event}" to ${socket.data.playerId} (${socket.id})`,
        args,
      );
    });
  }

  handleJoinQueue(socket: GameSocket, playerData: PlayerData) {
    const playerId = socket.data.playerId;
    socket.data.playerData = playerData;
    console.log(`${playerData.name} (ID: ${playerId}) joined the queue.`);
    const player: Player = { id: playerId, data: playerData, socket };
    this.addPlayerToQueue(player);
    socket.emit("queueJoined");
  }

  handleLeaveQueue(socket: GameSocket) {
    const playerId = socket.data.playerId;
    console.log(
      `${socket.data.playerData?.name} (ID: ${playerId}) left the queue`,
    );
    this.removePlayerFromQueue(playerId);
    socket.emit("leftQueue");
  }

  handleDisconnect(socket: GameSocket): void {
    const playerId = socket.data.playerId;
    console.log(
      `Player disconnected: ${socket.data.playerData?.name} (ID: ${playerId})`,
    );

    this.removePlayerFromQueue(playerId);
    this.removePlayerFromGame(playerId);
    this.connections.delete(playerId);
  }

  emitQueueCount(): void {
    this.connections.forEach((socket) => {
      socket.emit("queueCount", this.waitingQueue.length);
    });
  }

  addPlayerToQueue(player: Player): boolean {
    this.removePlayerFromQueue(player.id);
    this.waitingQueue.push(player);
    this.matchPlayers();
    this.emitQueueCount();
    return true;
  }

  removePlayerFromQueue(playerId: string): boolean {
    const index = this.waitingQueue.findIndex(
      (player) => player.id === playerId,
    );
    if (index !== -1) {
      this.waitingQueue.splice(index, 1);
      this.emitQueueCount();
      return true;
    }
    return false;
  }

  matchPlayers() {
    while (this.waitingQueue.length >= 2) {
      const whitePlayer = <Player>this.waitingQueue.shift();
      const blackPlayer = <Player>this.waitingQueue.shift();

      const game = this.createGame(whitePlayer, blackPlayer);
      this.activeGames.set(game.uuid, game);

      this.removePlayerFromQueue(whitePlayer.id);
      this.removePlayerFromQueue(blackPlayer.id);
    }
  }

  createGame(whitePlayer: Player, blackPlayer: Player): GameInstance {
    return new GameInstance(whitePlayer, blackPlayer);
  }

  getGame(uuid: string): GameInstance | undefined {
    return this.activeGames.get(uuid);
  }

  getGameByPlayer(playerId: string): GameInstance | undefined {
    for (const game of this.activeGames.values()) {
      if (
        game.whitePlayer.id === playerId ||
        game.blackPlayer.id === playerId
      ) {
        return game;
      }
    }
  }

  removePlayerFromGame(playerId: string): boolean {
    const game = this.getGameByPlayer(playerId);
    if (game) {
      const color = game.getPlayerColour(playerId);
      if (color) {
        game.handleGameAbandoned(color);
        return true;
      }
    }
    return false;
  }

  removeGame(uuid: string): boolean {
    return this.activeGames.delete(uuid);
  }
}

const gamesService = new GamesService();
export default gamesService;
