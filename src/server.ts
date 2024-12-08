import { Server, Socket } from 'socket.io';
import express from 'express';


export function createServer(port: number) {

    const app = express();
    const server = app.listen(port, () => {
    console.log(`Game server running on http://localhost:${PORT}`);
    });
    const io = new Server(server, {
        cors: {
            origin: '*', // Allow all origins for simplicity
        },
    });
    
    // Game Queue
    const gameQueue: Player[] = [];
    
    // Event Handlers
    io.on('connection', (socket: Socket) => {
        console.log(`Player connected: ${socket.id}`);
    
        // Add player to the queue
        socket.on('join_queue', (playerName?: string) => {
            const player: Player = { id: socket.id, name: playerName };
            console.log(`${player.name || 'Anonymous'} joined the queue.`);
    
            // Add player to the queue
            gameQueue.push(player);
    
            // Check if we have enough players for a game
            if (gameQueue.length >= 2) {
                const [player1, player2] = gameQueue.splice(0, 2); // Get two players
                const roomId = `room-${player1.id}-${player2.id}`;
    
                // Notify players they are matched
                io.to(player1.id).emit('matched', { opponent: player2, roomId });
                io.to(player2.id).emit('matched', { opponent: player1, roomId });
    
                // Join them to a room
                socket.to(player1.id).socketsJoin(roomId);
                socket.to(player2.id).socketsJoin(roomId);
    
                console.log(`Matched ${player1.id} and ${player2.id} in room ${roomId}`);
            }
        });
    
        // Handle player disconnection
        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);
    
            // Remove player from queue if they're still in it
            const index = gameQueue.findIndex((player) => player.id === socket.id);
            if (index !== -1) {
                gameQueue.splice(index, 1);
                console.log(`Player ${socket.id} removed from the queue.`);
            }
        });
    });
}

