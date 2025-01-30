import{v4 as uuid} from 'uuid'
import { GameInstance } from './GameInstance';
import { Player } from './types';


class GamesService {
    waitingQueue: Player[]
    activeGames: Map<string, GameInstance>

    constructor() {
        this.waitingQueue = []
        this.activeGames = new Map();
    }

    // startGame(whitePlayer: string, blackPlayer: string) {
    //     const game: GameInstance = new GameInstance()
    //     this.activeGames.set(uuid(), game)
    //     return game
    // }

    addPlayerToQueue(player: Player) {
        this.waitingQueue.push(player);
        this.matchPlayers();
    }

    matchPlayers() {
        while(this.waitingQueue.length >= 2) {
            const whitePlayer = <Player>this.waitingQueue.shift()            
            const blackPlayer = <Player>this.waitingQueue.shift()           
            this.createGame(whitePlayer, blackPlayer)
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
}
const gamesService = new GamesService();
export default gamesService