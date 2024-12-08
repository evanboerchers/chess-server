import { PieceColour } from "@evanboerchers/chess-core/dist/chess.types"
import { Socket } from "socket.io"

export interface Player {
    name: string
    socket: Socket
}

export enum GameOutcomeReason {
    CHECKMATE = "checkmate",
    RESIGN = "resign",
    TIME = "time",
    DRAW = "draw",
    INSUFFICIENT_MATERIAL = "insufficientMaterial"
}

export interface GameOutcome {
    winner: PieceColour | null,
    reason: GameOutcomeReason
}
