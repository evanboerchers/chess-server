import { Socket } from "socket.io";
import{v4 as uuid} from 'uuid'
import { GameOutcome, GameOutcomeReason, Player } from "./types";
import { ChessGame } from "@evanboerchers/chess-core"
import { Move, PieceColour } from "@evanboerchers/chess-core";

export class GameInstance {
    
    uuid: string
    whitePlayer: Player
    blackPlayer: Player
    game: ChessGame

    constructor(whitePlayer: Player, blackPlayer: Player) {
        this.uuid = uuid();
        this.whitePlayer = whitePlayer
        this.blackPlayer = blackPlayer
        this.game = new ChessGame()
        this.initSocketHandlers(PieceColour.WHITE, whitePlayer.socket)
        this.initSocketHandlers(PieceColour.BLACK, whitePlayer.socket)
        this.handleStart()
    }

    handleStart() {
        this.emitGameStarted(this.whitePlayer.socket);
        this.emitGameStarted(this.blackPlayer.socket);
        this.emitWaiting(this.blackPlayer.socket);
        this.emitMakeMove(this.whitePlayer.socket);
    }
    
    initSocketHandlers(colour: PieceColour, socket: Socket) {
        socket.on("makeMove",  (move: Move) => this.handleMove(colour, move))
        socket.on("resign",  () => this.handleResign(colour))
        socket.on("offerDraw",  () => this.handleDrawOffered(colour))
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

    emitWaiting(socket: Socket) {
        socket.emit("waiting")
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
        socket.emit("drawDeclined")
    }

    getPlayer(colour: PieceColour) {
        return colour === PieceColour.WHITE ? this.whitePlayer : this.blackPlayer
    }

    getOpponent(colour: PieceColour) {
        return colour === PieceColour.BLACK ? this.whitePlayer : this.blackPlayer
    }
}
