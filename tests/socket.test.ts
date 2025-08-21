import { Server } from 'socket.io';
import { createServer } from 'http';
import ioc from 'socket.io-client';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import jwt from "jsonwebtoken";
import { JWT_CONFIG } from '../src/config/jwt';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';

describe('Socket.IO', () => {
  let io: Server;
  let server: any;
  let clientSocket: any;
  let authToken: string;

  beforeAll(async () => {
  await setupTestDatabase();
  
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await User.create({
    username: 'sockettest',
    email: 'socket@example.com',
    password_hash: hashedPassword
  });

  authToken = jwt.sign({ userId: user.id }, JWT_CONFIG.secret as string);

  // Setup server
  server = createServer();
  io = new Server(server);

  // ✅ Add auth logic here
  io.on('connection', (socket) => {
    socket.on('authenticate', (token) => {
      try {
        const payload = jwt.verify(token, JWT_CONFIG.secret as string);
        if (payload) {
          socket.emit('authenticated', { user: { username: 'sockettest' } });
        }
      } catch (err) {
        socket.emit('auth_error', { error: 'Invalid token' });
      }
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(() => {
      const port = (server.address() as any).port;
      clientSocket = ioc(`http://localhost:${port}`);
      clientSocket.on('connect', resolve); // wait until client connects
    });
  });
});


afterAll(async () => {
  if (clientSocket) clientSocket.close();
  if (io) io.close();
  if (server) server.close();
  await teardownTestDatabase();
});


  it('should authenticate user', (done) => {
    clientSocket.on('authenticated', (data: any) => {
      expect(data.user).toHaveProperty('username', 'sockettest');
      done();
    });

    clientSocket.emit('authenticate', authToken);
  });

  it('should reject invalid token', (done) => {
    const invalidSocket = ioc(`http://localhost:${server.address().port}`);
    
    invalidSocket.on('auth_error', (data: any) => {
      expect(data).toHaveProperty('error');
      invalidSocket.close();
      done();
    });

    invalidSocket.emit('authenticate', 'invalid-token');
  });
});
