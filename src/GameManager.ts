import { v4 as uuid} from "uuid"

interface GameInfo {
    whitePlayer: string
    blackPlayer: string
    gameState: object
}
export default class GameManager {
    waitingQueue: string[]
    activeGames: Map<string, GameInfo>

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

    getGameByPlayer(playerUuid: string): GameInfo | undefined {   
        for (const [gameUuid, gameInfo] of this.activeGames.entries()) {
            if(gameInfo.blackPlayer === playerUuid || gameInfo.whitePlayer === playerUuid) {
                return gameInfo
            }
        }
    }
}