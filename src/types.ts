import { GameState, Move, PieceColour } from "@evanboerchers/chess-core";
import { Server, Socket } from "socket.io";
import express from "express";
import { createServer as createHttpServer } from "http";

export interface ServerToClientEvents {
  queueJoined: () => void;
  leftQueue: () => void;
  queueCount: (count: number) => void;
  gameFound: (
    playerColour: PieceColour,
    opponentData: PlayerData,
    state: GameState,
  ) => void;
  makeMove: () => void;
  waiting: () => void;
  moveMade: (move: Move, state: GameState) => void;
  drawOffered: () => void;
  gameOver: (result: GameOutcome) => void;
  drawDeclined: () => void;
}

export interface ClientToServerEvents {
  joinQueue: (playerData: PlayerData) => void;
  leaveQueue: () => void;
  gameReady: () => void;
  moveMade: (move: Move) => void;
  resign: () => void;
  offerDraw: () => void;
  drawAccepted: () => void;
  drawDeclined: () => void;
}

export interface SocketData {
  name: string;
}

export interface GameServerInstance {
  app: express.Express;
  httpServer: ReturnType<typeof createHttpServer>;
  io: Server<ClientToServerEvents, ServerToClientEvents, SocketData>;
}

export type GameSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>;
export type GameServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
>;

export interface Player {
  id: string;
  data: PlayerData;
  socket: GameSocket;
}

export interface PlayerData {
  name: string;
  icon: string;
}

export interface GameInfo {}

export enum GameOutcomeReason {
  CHECKMATE = "checkmate",
  RESIGN = "resign",
  TIME = "time",
  DRAW = "draw",
  INSUFFICIENT_MATERIAL = "insufficientMaterial",
  ABANDONED = "abandoned",
}

export interface GameOutcome {
  winner: PieceColour | null;
  reason: GameOutcomeReason;
}
