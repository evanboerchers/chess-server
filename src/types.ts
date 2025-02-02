import { PieceColour, Move } from "@evanboerchers/chess-core"
import { Socket } from "socket.io"

export interface ServerToClientEvents {
    gameUpdate: (state: any) => void;
}
export interface ClientToServerEvents {
    makeMove: (move: Move) => void;
}

export interface Player {
    name: string
    socket: Socket
}

export interface GameInfo {
    
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
