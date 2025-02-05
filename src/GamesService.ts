import { GameInstance } from './GameInstance';
import { Player } from './types';


export class GamesService {
    waitingQueue: Player[]
    activeGames: Map<string, GameInstance>

    constructor() {
        this.waitingQueue = []
        this.activeGames = new Map();
    }

    addPlayerToQueue(player: Player): Boolean {
        this.removePlayerFromQueue(player.name);
        this.waitingQueue.push(player);
        this.matchPlayers();
        return true;
    }

    removePlayerFromQueue(playerName: string): Boolean {
        const index = this.waitingQueue.findIndex(player => player.name === playerName)
        if (index !== -1) {
            this.waitingQueue.splice(index, 1)
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