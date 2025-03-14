import { Socket } from "socket.io";
import{v4 as uuid} from 'uuid'
import { GameOutcome, GameOutcomeReason, GameSocket, Player } from "./types";
import { ChessGame, Piece } from "@evanboerchers/chess-core"
import { Move, PieceColour } from "@evanboerchers/chess-core";
import gamesService from "./GamesService";

export class GameInstance {
    
    uuid: string
    whitePlayer: Player
    blackPlayer: Player
    ready: Record<PieceColour, boolean>
    game: ChessGame
    private isGameComplete: boolean = false

    constructor(whitePlayer: Player, blackPlayer: Player) {
        this.uuid = uuid();
        this.whitePlayer = whitePlayer
        this.blackPlayer = blackPlayer
        this.ready = {
            [PieceColour.WHITE]: false,
            [PieceColour.BLACK]: false,
        }
        this.game = new ChessGame()
        this.initSocketHandlers(PieceColour.WHITE, whitePlayer.socket)
        this.initSocketHandlers(PieceColour.BLACK, blackPlayer.socket)
        this.sendFoundEvents()
    }

    sendFoundEvents() {
        this.emitGameFound(this.whitePlayer.socket, PieceColour.WHITE, this.blackPlayer.data);
        this.emitGameFound(this.blackPlayer.socket, PieceColour.BLACK,this.whitePlayer.data);
    }

    sendStartEvents() {
        this.emitWaiting(this.blackPlayer.socket);
        this.emitMakeMove(this.whitePlayer.socket);
    }
    
    initSocketHandlers(colour: PieceColour, socket: Socket) {
        socket.on("gameReady",  () => this.handleGameReady(colour))
        socket.on("makeMove",  (move: Move) => this.handleMove(colour, move))
        socket.on("resign",  () => this.handleResign(colour))
        socket.on("offerDraw",  () => this.handleDrawOffered(colour))
    }

    handleGameReady(colour: PieceColour) {
        this.ready[colour] = true;
        if (this.ready[PieceColour.WHITE] && this.ready[PieceColour.BLACK]) {
            this.sendStartEvents()
        }
    }
    
    handleMove(colour: PieceColour, move: Move) {
        const socket = this.getPlayer(colour).socket
        const oppSocket = this.getOpponent(colour).socket
        this.game.makeMove(move)
        this.emitMoveMade(socket, move)
        this.emitMoveMade(oppSocket, move)
        this.emitMakeMove(oppSocket)
        this.emitWaiting(socket)
    }

    handleResign(colour: PieceColour) {
        const outcome: GameOutcome = {
            winner: colour === PieceColour.WHITE ? PieceColour.BLACK : PieceColour.WHITE,
            reason: GameOutcomeReason.RESIGN
        }
        this.emitGameOver(this.whitePlayer.socket, outcome);
        this.emitGameOver(this.blackPlayer.socket, outcome);
        this.handleGameComplete();
    }

    handleDrawOffered(colour: PieceColour) {
        const socket = this.getPlayer(colour).socket
        const oppSocket = this.getOpponent(colour).socket
        this.emitDrawOffered(oppSocket)
        oppSocket.on("drawAccepted", () => {
            oppSocket.removeAllListeners("drawAccepted")
            oppSocket.removeAllListeners("drawDeclined")
            const outcome: GameOutcome = {
                winner: null,
            reason: GameOutcomeReason.DRAW
            }
            this.emitGameOver(socket, outcome)
            this.handleGameComplete()
        })
        oppSocket.on("drawDeclined", () => {
            oppSocket.removeAllListeners("drawAccepted")
            oppSocket.removeAllListeners("drawDeclined")
            this.emitDrawDeclined(socket)
        })
    }

    handleGameAbandoned(colour: PieceColour) {
        const socket = this.getPlayer(colour).socket
        const oppSocket = this.getOpponent(colour).socket
        const outcome: GameOutcome = {
            winner: colour === PieceColour.WHITE ? PieceColour.BLACK : PieceColour.WHITE,
            reason: GameOutcomeReason.ABANDONED
        }
        this.emitGameOver(socket, outcome)
        this.emitGameOver(oppSocket, outcome)
        this.handleGameComplete();
    }

    handleGameComplete() {
        gamesService.removeGame(this.uuid)
        if (this.isGameComplete) return
        this.isGameComplete = true
        this.cleanup()
        gamesService.removeGame(this.uuid)
    }

    emitGameFound(socket: GameSocket, playerColour: PieceColour, oppData: {name: string, icon: string}) {
        socket.emit("gameFound", playerColour, oppData, this.game.gameState)
    }

    emitMakeMove(socket: GameSocket) {
        socket.emit("makeMove")
    }

    emitWaiting(socket: GameSocket) {
        socket.emit("waiting")
    }
    
    emitMoveMade(socket: GameSocket, move: Move) {
        socket.emit("moveMade", move, this.game.gameState)
    }

    emitDrawOffered(socket: GameSocket) {
        socket.emit("drawOffered")
    }

    emitGameOver(socket: GameSocket, result: GameOutcome) {
        socket.emit("gameOver", result)
    }

    emitDrawDeclined(socket: GameSocket) {
        socket.emit("drawDeclined")
    }

    getPlayer(colour: PieceColour) {
        return colour === PieceColour.WHITE ? this.whitePlayer : this.blackPlayer
    }

    getOpponent(colour: PieceColour) {
        return colour === PieceColour.BLACK ? this.whitePlayer : this.blackPlayer
    }

    getPlayerColour(playerName: string): PieceColour | null {
        if(playerName === this.whitePlayer.name) {
            return PieceColour.WHITE;
        } else if(playerName === this.blackPlayer.name) {
            return PieceColour.BLACK;
        } else {
            return null;
        }
    }
    private cleanup() {
        this.whitePlayer.socket.removeAllListeners("makeMove")
        this.whitePlayer.socket.removeAllListeners("resign")
        this.whitePlayer.socket.removeAllListeners("offerDraw")
        this.blackPlayer.socket.removeAllListeners("makeMove")
        this.blackPlayer.socket.removeAllListeners("resign")
        this.blackPlayer.socket.removeAllListeners("offerDraw")
        this.game = null as any
        this.whitePlayer = null as any
        this.blackPlayer = null as any
    }
}
