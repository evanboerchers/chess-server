import { Server, Socket } from "socket.io";
import express from "express";
import { createServer as createHttpServer } from "http";
import {
  ClientToServerEvents,
  GameServerInstance,
  GameSocket,
  ServerToClientEvents,
  SocketData,
} from "./types";
import gamesService from "./services/GamesService";
import { GameServer } from "./types";
import routes from './routes'
import cors from 'cors'

export interface ServerOptions {
  port: number,
  version: string,
  corsOrigin?: string
}

export function createServer(serverOptions: ServerOptions): GameServerInstance {
  const {
    port,
    version,
    corsOrigin
  } = serverOptions

  const app = express();
  app.use(cors({
    origin: corsOrigin || false
  }))
  app.use('/api', routes);
  app.get('/', (_req, res) => {
    res.json({message: 'this is chess server', version})
  })
  const httpServer = createHttpServer(app);
  const io: GameServer = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: corsOrigin || false,
    },
  });
  io.on("connection", (socket: GameSocket) => {
    gamesService.connectPlayer(socket);
  });

  httpServer.listen(port, () => {
    console.log(`Game server running on http://localhost:${port}`);
  });
  return {
    app,
    httpServer,
    io,
  };
}

export function shutdownServer(server: GameServerInstance) {
  return new Promise<void>((resolve, reject) => {
    try {
      server.io.close(() => {
        server.httpServer.close(() => {
          console.log("Server shut down successfully");
          resolve();
        });
      });
    } catch (error) {
      console.error("Error during server shutdown:", error);
      reject(error);
    }
  });
}
