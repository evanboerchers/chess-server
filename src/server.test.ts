import { io, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from './server';
import { GameServerInstance } from './types';
import request from 'supertest';
import { ServerToClientEvents, ClientToServerEvents } from './types';
import { vi, expect } from 'vitest'; // Import vi from Vitest for mocks and lifecycle methods

describe('Game Server', () => {
    let serverInstance: GameServerInstance;
    let clientSocket1: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let clientSocket2: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    const PORT = 3001;

    beforeAll(async () => {
        // Create server instance
        serverInstance = createServer(PORT);

        // Create socket clients
        clientSocket1 = io(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            autoConnect: false
        });

        clientSocket2 = io(`http://localhost:${PORT}`, {
            transports: ['websocket'],
            autoConnect: false
        });

        // Wait for server to be ready
        await new Promise<void>((resolve) => {
            serverInstance.httpServer.once('listening', () => {
                resolve();
            });
        });
    });

    beforeEach(async () => {
        // Connect sockets before each test
        clientSocket1.connect();
        clientSocket2.connect();

        await new Promise<void>((resolve) => {
            let connectedSockets = 0;
            const onConnect = () => {
                connectedSockets++;
                if (connectedSockets === 2) resolve();
            };

            clientSocket1.on('connect', onConnect);
            clientSocket2.on('connect', onConnect);
        });
    });

    afterEach(async () => {
        // Disconnect sockets after each test
        if (clientSocket1.connected) {
            clientSocket1.disconnect();
        }
        if (clientSocket2.connected) {
            clientSocket2.disconnect();
        }
    });

    afterAll(async () => {
        // Cleanup server and connections
        await new Promise<void>((resolve) => {
            serverInstance.httpServer.close(() => {
                resolve();
            });
        });
    });

    // Test HTTP Server
    describe('HTTP Server', () => {
        test('server should be running', async () => {
            const response = await request(serverInstance.app).get('/');
            expect(response.status).toBe(404); // Default response with no routes
        });
    });

    // Test Socket.IO Server
    describe('Socket.IO Server', () => {
        test('should connect successfully', async () => {
            expect(clientSocket1.connected).toBe(true);
            expect(clientSocket2.connected).toBe(true);
        });

        test('should handle joinQueue event', async () => {
            // Listen for queueJoined event
            await new Promise<void>((resolve) => {
                clientSocket1.on('queueJoined', () => {
                    expect(true).toBe(true);
                    resolve();
                });

                // Emit joinQueue event
                clientSocket1.emit('joinQueue', 'TestPlayer');
            });
        });

        test('should handle multiple players joining queue', async () => {
            let joinedCount = 0;

            await new Promise<void>((resolve) => {
                const onQueueJoined = () => {
                    joinedCount++;
                    if (joinedCount === 2) {
                        expect(joinedCount).toBe(2);
                        resolve();
                    }
                };

                clientSocket1.on('queueJoined', onQueueJoined);
                clientSocket2.on('queueJoined', onQueueJoined);

                clientSocket1.emit('joinQueue', 'Player1');
                clientSocket2.emit('joinQueue', 'Player2');
            });
        });

        test('should handle disconnections properly', async () => {
            // First connect and join queue
            await new Promise<void>((resolve) => {
                clientSocket1.on('queueJoined', () => {
                    // Once joined, disconnect
                    clientSocket1.disconnect();

                    // Verify disconnection
                    expect(clientSocket1.connected).toBe(false);

                    // Verify second client can still join
                    clientSocket2.on('queueJoined', () => {
                        expect(clientSocket2.connected).toBe(true);
                        resolve();
                    });

                    clientSocket2.emit('joinQueue', 'Player2');
                });

                clientSocket1.emit('joinQueue', 'Player1');
            });
        });

        test('should maintain separate connections for different players', async () => {
            const player1Events: string[] = [];
            const player2Events: string[] = [];

            await new Promise<void>((resolve) => {
                clientSocket1.on('queueJoined', () => {
                    player1Events.push('queueJoined');
                });

                clientSocket2.on('queueJoined', () => {
                    player2Events.push('queueJoined');
                    // Verify events were received by correct players
                    expect(player1Events).toHaveLength(1);
                    expect(player2Events).toHaveLength(1);
                    resolve();
                });

                clientSocket1.emit('joinQueue', 'Player1');
                clientSocket2.emit('joinQueue', 'Player2');
            });
        });
    });

    // Test Error Handling
    describe('Error Handling', () => {
        test('should handle invalid events gracefully', async () => {
            // @ts-ignore - Intentionally sending invalid event
            clientSocket1.emit('invalidEvent', {}, (error: any) => {
                expect(error).toBeDefined();
            });
        });
    });
});
