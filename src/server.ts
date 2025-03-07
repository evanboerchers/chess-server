import { Server, Socket } from 'socket.io';
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { ClientToServerEvents, GameServerInstance, GameSocket, ServerToClientEvents, SocketData } from './types';
import gamesService from './GamesService';
import { GameServer, Player } from './types';


export function createServer(port: number): GameServerInstance {
    const app = express();
    const httpServer = createHttpServer(app)
    const io: GameServer = new Server<ClientToServerEvents, ServerToClientEvents, SocketData>(httpServer, {
        cors: {
            origin: '*',
        },
    });

    io.on('connection', (socket: GameSocket) => {
        gamesService.connectPlayer(socket);
    });

    httpServer.listen(port, () => {
        console.log(`Game server running on http://localhost:${port}`);
    });
    return {
        app,
        httpServer,
        io,
    }
}

export function shutdownServer(server: GameServerInstance) {
    return new Promise<void>((resolve, reject) => {
        try {
            server.io.close(() => {
                server.httpServer.close(() => {
                    console.log('Server shut down successfully');
                    resolve();
                });
            });
        } catch (error) {
            console.error('Error during server shutdown:', error);
            reject(error);
        }
    });
}

