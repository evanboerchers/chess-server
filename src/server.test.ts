import { io, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from './server';
import { GameServerInstance } from './types';
import request from 'supertest';
import { ServerToClientEvents, ClientToServerEvents } from './types';

describe('Game Server', () => {
    let serverInstance: GameServerInstance;
    let clientSocket1: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    let clientSocket2: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
    const PORT = 3001;

    beforeAll((done) => {
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
        serverInstance.httpServer.once('listening', () => {
            done();
        });
    });

    beforeEach((done) => {
        // Connect sockets before each test
        clientSocket1.connect();
        clientSocket2.connect();

        let connectedSockets = 0;
        const onConnect = () => {
            connectedSockets++;
            if (connectedSockets === 2) done();
        };

        clientSocket1.on('connect', onConnect);
        clientSocket2.on('connect', onConnect);
    });

    afterEach((done) => {
        // Disconnect sockets after each test
        if (clientSocket1.connected) {
            clientSocket1.disconnect();
        }
        if (clientSocket2.connected) {
            clientSocket2.disconnect();
        }
        done();
    });

    afterAll((done) => {
        // Cleanup server and connections
        serverInstance.httpServer.close(() => {
            done();
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
        test('should connect successfully', (done) => {
            expect(clientSocket1.connected).toBe(true);
            expect(clientSocket2.connected).toBe(true);
            done();
        });

        test('should handle joinQueue event', (done) => {
            // Listen for queueJoined event
            clientSocket1.on('queueJoined', () => {
                expect(true).toBe(true);
                done();
            });

            // Emit joinQueue event
            clientSocket1.emit('joinQueue', 'TestPlayer');
        });

        test('should handle multiple players joining queue', (done) => {
            let joinedCount = 0;

            const onQueueJoined = () => {
                joinedCount++;
                if (joinedCount === 2) {
                    expect(joinedCount).toBe(2);
                    done();
                }
            };

            clientSocket1.on('queueJoined', onQueueJoined);
            clientSocket2.on('queueJoined', onQueueJoined);

            clientSocket1.emit('joinQueue', 'Player1');
            clientSocket2.emit('joinQueue', 'Player2');
        });

        test('should handle disconnections properly', (done) => {
            // First connect and join queue
            clientSocket1.on('queueJoined', () => {
                // Once joined, disconnect
                clientSocket1.disconnect();
                
                // Verify disconnection
                expect(clientSocket1.connected).toBe(false);
                
                // Verify second client can still join
                clientSocket2.on('queueJoined', () => {
                    expect(clientSocket2.connected).toBe(true);
                    done();
                });
                
                clientSocket2.emit('joinQueue', 'Player2');
            });

            clientSocket1.emit('joinQueue', 'Player1');
        });

        test('should maintain separate connections for different players', (done) => {
            const player1Events: string[] = [];
            const player2Events: string[] = [];

            clientSocket1.on('queueJoined', () => {
                player1Events.push('queueJoined');
            });

            clientSocket2.on('queueJoined', () => {
                player2Events.push('queueJoined');
                // Verify events were received by correct players
                expect(player1Events).toHaveLength(1);
                expect(player2Events).toHaveLength(1);
                done();
            });

            clientSocket1.emit('joinQueue', 'Player1');
            clientSocket2.emit('joinQueue', 'Player2');
        });
    });

    // Test Error Handling
    // describe('Error Handling', () => {
    //     test('should handle invalid events gracefully', (done) => {
    //         // @ts-ignore - Intentionally sending invalid event
    //         clientSocket1.emit('invalidEvent', {}, (error: any) => {
    //             expect(error).toBeDefined();
    //             done(); 
    //         });
    //     });
    // });
});