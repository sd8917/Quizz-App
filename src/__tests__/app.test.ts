import request from 'supertest';
import app from '../app';

describe('GET /', () => {
  it('should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Welcome to the Blog API');
  });
});