import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

const AUTH = { 'X-User-Id': '1' };

async function createUser(name = 'Alice', email = 'alice@test.com') {
  return request(app).post('/users').set(AUTH).send({ name, email });
}

async function createTicket(title: string) {
  return request(app)
    .post('/tickets')
    .set(AUTH)
    .send({ title, description: `${title} description` });
}

describe('Users', () => {
  it('creates a user and returns 201', async () => {
    const res = await createUser();

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, name: 'Alice', email: 'alice@test.com' });
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/users').set(AUTH).send({ name: 'Alice' });
    expect(res.status).toBe(400);
  });

  it('fetches a user by id', async () => {
    await createUser();

    const res = await request(app).get('/users/1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alice');
  });

  it('returns 404 for a non-existent user', async () => {
    const res = await request(app).get('/users/999');
    expect(res.status).toBe(404);
  });
});

describe('Auth middleware', () => {
  it('returns 401 when X-User-Id is missing on POST', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@test.com' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when X-User-Id is not a number', async () => {
    const res = await request(app)
      .post('/users')
      .set('X-User-Id', 'abc')
      .send({ name: 'Alice', email: 'alice@test.com' });
    expect(res.status).toBe(401);
  });

  it('does not require X-User-Id on GET', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
  });
});

describe('Tickets', () => {
  it('creates a ticket and returns 201', async () => {
    await createUser();

    const res = await createTicket('Fix login');

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Fix login', status: 'TODO', creator_id: 1 });
  });

  it('returns 404 for a non-existent ticket', async () => {
    const res = await request(app).get('/tickets/999');
    expect(res.status).toBe(404);
  });

  it('paginates GET /tickets with limit and offset', async () => {
    await createUser();
    for (let i = 1; i <= 5; i++) {
      await createTicket(`Ticket ${i}`);
    }

    const res = await request(app).get('/tickets?limit=2&offset=2');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((t: { title: string }) => t.title)).toEqual(['Ticket 3', 'Ticket 4']);
  });
});
