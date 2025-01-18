import { Server, Socket } from 'socket.io';
import express from 'express';
import { Player } from './types';


export function createServer(port: number) {

    const app = express();
    const server = app.listen(port, () => {
    console.log(`Game server running on http://localhost:${port}`);
    });
    const io = new Server(server, {
        cors: {
            origin: '*', // Allow all origins for simplicity
        },
    });
    
    
    // Event Handlers
    io.on('connection', (socket: Socket) => {
        console.log(`Player connected: ${socket.id}`);
    
        // Add player to the queue
        socket.on('join_queue', (playerName: string) => {
            console.log(`${playerName || 'Anonymous'} joined the queue.`);
        });
    
        // Handle player disconnection
        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);
        });
    });
}

