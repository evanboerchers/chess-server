import{v4 as uuid} from 'uuid'
import { GameInstance } from './GameInstance';


class GamesService {
    waitingQueue: string[]
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