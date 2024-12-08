import { Socket } from "socket.io";
import { GameOutcome, GameOutcomeReason, Player } from "./types";
import { ChessGame } from "@evanboerchers/chess-core"
import { Move, PieceColour } from "@evanboerchers/chess-core/dist/chess.types";

export class GameInstance {
    blackPlayer: Player
    whitePlayer: Player
    game: ChessGame
    constructor(blackPlayer: Player, whitePlayer: Player) {
        this.whitePlayer = whitePlayer
        this.blackPlayer = blackPlayer
        this.game = new ChessGame()
        this.initSocketHandlers(PieceColour.WHITE, whitePlayer.socket)
        this.initSocketHandlers(PieceColour.BLACK, whitePlayer.socket)
        this.handleStart()
    }

    handleStart() {
        this.whitePlayer.socket.emit("gameStarted")
        this.blackPlayer.socket.emit("gameStarted")
        this.blackPlayer.socket.emit("waiting")
        this.whitePlayer.socket.emit("makeMove")
    }

    initSocketHandlers(colour: PieceColour, socket: Socket) {
        socket.on("makeMove",  (move: Move) => this.handleMove(colour, move))
        socket.on("makeMove",  (move: Move) => this.handleMove(colour, move))
        socket.on("resign",  () => {})
        socket.on("offerDraw",  () => {})
    }

    handleMove(colour: PieceColour, move: Move) {
        const socket = this.getPlayer(colour).socket
        const oppSocket = this.getOpponent(colour).socket
        this.game.makeMove(move)
        this.emitMoveMade(socket, move)
        this.emitMoveMade(oppSocket, move)
    }

    handleResign(colour: PieceColour) {
        const outcome: GameOutcome = {
            winner: colour === PieceColour.WHITE ? PieceColour.BLACK : PieceColour.WHITE,
            reason: GameOutcomeReason.RESIGN
        }
        this.emitGameOver(this.whitePlayer.socket, outcome);
        this.emitGameOver(this.blackPlayer.socket, outcome);
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
        })
        oppSocket.on("drawDeclined", () => {
            oppSocket.removeAllListeners("drawAccepted")
            oppSocket.removeAllListeners("drawDeclined")
            this.emitDrawDeclined(socket)
        })
    }

    emitGameStarted(socket: Socket) {
        socket.emit("gameStarted")
    }

    emitMakeMove(socket: Socket) {
        socket.emit("makeMove")
    }
    
    emitMoveMade(socket: Socket, move: Move) {
        socket.emit("moveMade", move, this.game.gameState)
    }

    emitDrawOffered(socket: Socket) {
        socket.emit("drawOffered")
    }

    emitGameOver(socket: Socket, result: GameOutcome) {
        socket.emit("gameOver", result)
    }

    emitDrawDeclined(socket: Socket) {
        socket.emit("drawRejected")
    }

    getPlayer(colour: PieceColour) {
        return colour === PieceColour.WHITE ? this.whitePlayer : this.blackPlayer
    }

    getOpponent(colour: PieceColour) {
        return colour === PieceColour.BLACK ? this.whitePlayer : this.blackPlayer
    }
}
