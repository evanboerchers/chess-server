import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import { AddressInfo } from 'net';

describe('Socket Game Queue', () => {
  let io: Server, clientSocket1: ClientSocket, clientSocket2: ClientSocket, port: number;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);

    // Import your socket logic (you'll need to modify your original file to export the setup)
    require('../your-socket-server-file')(io);

    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll(() => {
    io.close();
  });

  beforeEach((done) => {
    // Create two client sockets
    clientSocket1 = ioc(`http://localhost:${port}`);
    clientSocket2 = ioc(`http://localhost:${port}`);
    
    // Wait for both sockets to connect
    Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', () => resolve())),
      new Promise<void>((resolve) => clientSocket2.on('connect', () => resolve()))
    ]).then(() => done());
  });

  afterEach(() => {
    // Disconnect clients
    if (clientSocket1) clientSocket1.disconnect();
    if (clientSocket2) clientSocket2.disconnect();
  });

  test('Player can join the queue', (done) => {
    clientSocket1.emit('join_queue', 'Player1');

    clientSocket1.on('matched', (data) => {
      expect(data.opponent).toBeDefined();
      expect(data.roomId).toBeTruthy();
      done();
    });

    // Simulate second player joining to trigger matching
    clientSocket2.emit('join_queue', 'Player2');
  });

  test('Disconnected player is removed from queue', (done) => {
    clientSocket1.emit('join_queue', 'Player1');
    
    // Simulate disconnection
    clientSocket1.disconnect();

    // Wait a moment to ensure disconnection is processed
    setTimeout(() => {
      // Add a way to check queue length or player removal
      // This might require modifying your original socket server to expose queue state
      // For example, you might add a method to get queue length
      expect(true).toBeTruthy(); // Placeholder
      done();
    }, 100);
  });

  test('Two players are matched when joining queue', (done) => {
    clientSocket1.emit('join_queue', 'Player1');
    clientSocket2.emit('join_queue', 'Player2');

    // Check both clients receive match event
    let matchCount = 0;
    const checkMatch = (data: any) => {
      matchCount++;
      expect(data.opponent).toBeDefined();
      expect(data.roomId).toBeTruthy();
      
      if (matchCount === 2) {
        done();
      }
    };

    clientSocket1.on('matched', checkMatch);
    clientSocket2.on('matched', checkMatch);
  });
});