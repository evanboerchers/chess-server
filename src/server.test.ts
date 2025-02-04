import { io as Client } from 'socket.io-client';
import { Server } from 'socket.io';
import request from 'supertest';
import { createServer } from './server';
import { AddressInfo } from 'net';
import { Express } from 'express';

let app: Express;
let server: any;
let io: Server;
let testPort: number;
let testUrl: string;

beforeAll((done) => {
    app = createServer(0); // Start on a random port
    server = app.listen(() => {
        testPort = (server.address() as AddressInfo).port;
        testUrl = `http://localhost:${testPort}`;
        io = new Server(server);
        done();
    });
});

afterAll((done) => {
    io.close();
    server.close();
    done();
});

describe('Chess Game Server', () => {

    test('HTTP: Server should be running', async () => {
        const response = await request(testUrl).get('/');
        expect(response.status).toBe(404); // Adjust based on actual API behavior
    });

    test('WebSocket: Player should connect and join queue', (done) => {
        const socket = Client(testUrl);

        socket.on('connect', () => {
            expect(socket.connected).toBeTruthy();
            socket.emit('joinQueue', 'Player1');
        });

        socket.on('queueJoined', (data) => {
            expect(data.name).toBe('Player1');
            socket.disconnect();
            done();
        });

        socket.on('error', (err) => {
            done.fail(`Unexpected error: ${err}`);
        });
    });

    test('WebSocket: Player should disconnect properly', (done) => {
        const socket = Client(testUrl);

        socket.on('connect', () => {
            socket.disconnect();
        });

        socket.on('disconnect', () => {
            expect(socket.connected).toBeFalsy();
            done();
        });
    });
});
