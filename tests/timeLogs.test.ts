import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

const AUTH = { 'X-User-Id': '1' };

function logHours(ticketId: number, hours: unknown) {
  return request(app).post(`/tickets/${ticketId}/time`).set(AUTH).send({ hours });
}

describe('Part 2: Time Logs', () => {
  beforeEach(async () => {
    await request(app).post('/users').set(AUTH).send({ name: 'Alice', email: 'alice@test.com' });
    await request(app).post('/tickets').set(AUTH).send({ title: 'Ticket 1' });
    await request(app).post('/tickets').set(AUTH).send({ title: 'Ticket 2' });
  });

  it('logs hours and returns 201', async () => {
    const res = await logHours(1, 3);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ticket_id: 1, user_id: 1, hours: 3 });
  });

  it('sums all logged hours for a ticket', async () => {
    await logHours(1, 2);
    await logHours(1, 3);
    await logHours(1, 5);

    const res = await request(app).get('/tickets/1/time');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ticket_id: 1, total_hours: 10 });
  });

  it('only counts hours logged against that ticket', async () => {
    await logHours(1, 4);
    await logHours(2, 7);

    const res = await request(app).get('/tickets/1/time');

    expect(res.body).toEqual({ ticket_id: 1, total_hours: 4 });
  });

  it('returns 0 total hours when nothing has been logged', async () => {
    const res = await request(app).get('/tickets/1/time');

    expect(res.body).toEqual({ ticket_id: 1, total_hours: 0 });
  });

  it('returns 400 for invalid hours', async () => {
    expect((await logHours(1, -2)).status).toBe(400);
    expect((await logHours(1, 'three')).status).toBe(400);
  });

  it('returns 401 without X-User-Id', async () => {
    const res = await request(app).post('/tickets/1/time').send({ hours: 2 });
    expect(res.status).toBe(401);
  });

  it('returns 404 for a ticket that does not exist', async () => {
    expect((await logHours(999, 2)).status).toBe(404);
    expect((await request(app).get('/tickets/999/time')).status).toBe(404);
  });
});
