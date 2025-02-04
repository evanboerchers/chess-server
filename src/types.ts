import { PieceColour, Move } from "@evanboerchers/chess-core"
import { Socket } from "socket.io"
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "./socket.types";

export interface Player {
    name: string
    socket: Socket<ClientToServerEvents,ServerToClientEvents, SocketData>
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
