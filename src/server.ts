import { Server, Socket } from 'socket.io';
import express from 'express';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from './socket.types';
import gamesService from './GamesService';
import { Player } from './types';


export function createServer(port: number): express.Express {
    const app = express();
    const server = app.listen(port, () => {
    console.log(`Game server running on http://localhost:${port}`);
    });
    const io = new Server<ClientToServerEvents, ServerToClientEvents, SocketData>(server, {
        cors: {
            origin: '*',
        },
    });
    io.on('connection', (socket: Socket) => {
        console.log(`Player connected: ${socket.id}`);
        socket.on('joinQueue', (playerName: string) => {
            console.log(`${playerName} joined the queue: ${socket.id}`);
            const player: Player = {name: playerName, socket: socket}
            gamesService.addPlayerToQueue(player)
        });
        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);
        });
    });
    return app
}

