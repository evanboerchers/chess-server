import { GameOutcome, Move, PieceColour } from "@evanboerchers/chess-core";

export interface ServerToClientEvents {
    gameStarted: () => void;
    makeMove: () => void;
    waiting: () => void;
    moveMade: (move: Move, gameState: any) => void; // Replace 'any' with actual game state type if available
    drawOffered: () => void;
    gameOver: (result: GameOutcome) => void;
    drawDeclined: () => void;
  }
  
  export interface ClientToServerEvents {
    makeMove: (move: Move) => void;
    resign: () => void;
    offerDraw: () => void;
    drawAccepted: () => void;
    drawDeclined: () => void;
  }
  
  export interface SocketData {
    name: string;
  }