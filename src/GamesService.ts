import { GameInstance } from './GameInstance';
import { GameSocket, Player } from './types';


export class GamesService {
    connections: Map<string, GameSocket>
    waitingQueue: Player[]
    activeGames: Map<string, GameInstance>

    constructor() {
        this.connections = new Map();
        this.waitingQueue = []
        this.activeGames = new Map();
    }

    connectPlayer(socket: GameSocket): void {
        console.log(`Player connected: ${socket.id}`);
        this.connections.set(socket.id, socket)
        socket.on('joinQueue', (playerName: string) => {
            this.handleJoinQueue(socket, playerName)
        });
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });
    }
    
    handleJoinQueue(socket: GameSocket, playerName: string) {
        console.log(`${playerName} joined the queue: ${socket.id}`);
        socket.data.playerName = playerName
        const player: Player = {name: playerName, socket: socket}
        gamesService.addPlayerToQueue(player)
        player.socket.emit("queueJoined")
    }
    
    handleDisconnect(socket: GameSocket): void {
        console.log(`Player disconnected: ${socket.id}`);
        this.removePlayerFromQueue(socket.data.playerName)
        this.removePlayerFromGame(socket.data.playerName)
    }

    emitQueueCount(): void {
        this.connections.forEach((socket) => {
            socket.emit("queueCount", this.waitingQueue.length)
        })
    }

    addPlayerToQueue(player: Player): Boolean {
        this.removePlayerFromQueue(player.name);
        this.waitingQueue.push(player);
        this.matchPlayers();
        this.emitQueueCount()
        return true;
    }

    removePlayerFromQueue(playerName: string): Boolean {
        const index = this.waitingQueue.findIndex(player => player.name === playerName)
        if (index !== -1) {
            this.waitingQueue.splice(index, 1)
            this.emitQueueCount()
            return true;
        } else {
            return false;
        }
    }

    matchPlayers() {
        while(this.waitingQueue.length >= 2) {
            const whitePlayer = <Player>this.waitingQueue.shift()            
            const blackPlayer = <Player>this.waitingQueue.shift()           
            const game = this.createGame(whitePlayer, blackPlayer)
            this.activeGames.set(game.uuid, game)
            this.removePlayerFromQueue(whitePlayer.name)
            this.removePlayerFromQueue(blackPlayer.name)
        }
    }

    createGame(whitePlayer: Player, blackPlayer: Player): GameInstance {
        return new GameInstance(whitePlayer, blackPlayer)
    }

    getGame(uuid: string): GameInstance | undefined{
        return this.activeGames.get(uuid)
    }

    getGameByPlayer(playerName: string): GameInstance | undefined {   
        for (const [gameUuid, game] of this.activeGames.entries()) {
            if(game.blackPlayer.name === playerName || game.whitePlayer.name === playerName) {
                return game
            }
        }
    }
    
    removePlayerFromGame(playerName: string): Boolean {
        const game = this.getGameByPlayer(playerName)
        if (game) {
        const colour = game.getPlayerColour(playerName)
            if(colour) {
                game.handleGameAbandoned(colour)
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    }

    removeGame(uuid: string): boolean {
        return this.activeGames.delete(uuid)
    }
}
const gamesService = new GamesService();
export default gamesService