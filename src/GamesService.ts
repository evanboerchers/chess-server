import { GameInstance } from './GameInstance';
import { Player } from './types';


export class GamesService {
    waitingQueue: Player[]
    activeGames: Map<string, GameInstance>

    constructor() {
        this.waitingQueue = []
        this.activeGames = new Map();
    }

    addPlayerToQueue(player: Player) {
        this.waitingQueue.push(player);
        this.matchPlayers();
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

    getGameByPlayer(playerUuid: string): GameInstance | undefined {   
        for (const [gameUuid, game] of this.activeGames.entries()) {
            if(game.blackPlayer.name === playerUuid || game.whitePlayer.name === playerUuid) {
                return game
            }
        }
    }

    removeGame(uuid: string): boolean {
        return this.activeGames.delete(uuid)
    }
}
const gamesService = new GamesService();
export default gamesService