import{v4 as uuid} from 'uuid'


class GamesService {
    waitingQueue: string[]
    activeGames: Map<string, GameInstance>

    constructor() {
        this.waitingQueue = []
        this.activeGames = new Map();
    }

    startGame(whitePlayer: string, blackPlayer: string) {
        const game: GameInfo = {
            whitePlayer,
            blackPlayer,
            gameState: {}
        } 
        this.activeGames.set(uuid(), game)
        return game
    }

    getGame(uuid: string): GameInfo | undefined{
        return this.activeGames.get(uuid)
    }

    getGameByPlayer(playerUuid: string): GameInstance | undefined {   
        for (const [gameUuid, game] of this.activeGames.entries()) {
            if(game.blackPlayer === playerUuid || game.whitePlayer === playerUuid) {
                return game
            }
        }
    }
}
const gamesService = new GamesService();
export default gamesService