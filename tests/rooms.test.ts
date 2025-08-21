import request from 'supertest';
import { app } from '../src/app';
import { setupTestDatabase, teardownTestDatabase } from './setup';

describe('Rooms', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create and login user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'roomtest',
        email: 'room@example.com',
        password: 'password123'
      });
    
    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should create a new room', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Room',
        description: 'A test room',
        is_private: false
      });

    expect(response.status).toBe(201);
    expect(response.body.room).toHaveProperty('name', 'Test Room');
  });

  it('should not create room without authentication', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({
        name: 'Unauthorized Room'
      });

    expect(response.status).toBe(401);
  });
});
