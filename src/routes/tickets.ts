import { Router } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
} from '../dal/tickets.js';
import { getUserById } from '../dal/users.js';
import { insertTimeLog, getTotalHoursForTicket } from '../dal/timeLogs.js';

const router = Router();

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

function parseNonNegativeInt(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

router.get('/', async (req, res) => {
  const { limit, offset, status } = req.query;

  const parsedLimit = limit === undefined ? undefined : parseNonNegativeInt(limit);
  const parsedOffset = offset === undefined ? undefined : parseNonNegativeInt(offset);
  if (
    (limit !== undefined && parsedLimit === undefined) ||
    (offset !== undefined && parsedOffset === undefined)
  ) {
    res.status(400).json({ error: 'limit and offset must be non-negative integers' });
    return;
  }

  if (status !== undefined && (typeof status !== 'string' || !STATUSES.includes(status))) {
    res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    return;
  }

  const tickets = await getAllTickets({
    limit: parsedLimit,
    offset: parsedOffset,
    status,
  });
  res.json(tickets);
});

router.get('/:id', async (req, res) => {
  const id = parseNonNegativeInt(req.params.id);
  if (id === undefined) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const ticket = await getTicketById(id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(ticket);
});

router.post('/', async (req, res) => {
  const { title, description } = req.body ?? {};
  if (typeof title !== 'string' || !title) {
    res.status(400).json({ error: 'title is required and must be a string' });
    return;
  }
  if (description !== undefined && typeof description !== 'string') {
    res.status(400).json({ error: 'description must be a string' });
    return;
  }

  const creatorId: number = res.locals.userId;
  if (!(await getUserById(creatorId))) {
    res.status(400).json({ error: 'X-User-Id does not match an existing user' });
    return;
  }

  const ticket = await createTicket({ title, description, creator_id: creatorId });
  res.status(201).json(ticket);
});

router.patch('/:id/status', async (req, res) => {
  const id = parseNonNegativeInt(req.params.id);
  if (id === undefined) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const { status } = req.body ?? {};
  if (typeof status !== 'string' || !STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
    return;
  }

  const ticket = await updateTicketStatus(id, status);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  res.json(ticket);
});

router.post('/:id/time', async (req, res) => {
  const id = parseNonNegativeInt(req.params.id);
  if (id === undefined) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  const { hours } = req.body ?? {};
  if (!Number.isInteger(hours) || hours <= 0) {
    res.status(400).json({ error: 'hours must be a positive integer' });
    return;
  }

  if (!(await getTicketById(id))) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const userId: number = res.locals.userId;
  if (!(await getUserById(userId))) {
    res.status(400).json({ error: 'X-User-Id does not match an existing user' });
    return;
  }

  const timeLog = await insertTimeLog(id, userId, hours);
  res.status(201).json(timeLog);
});

router.get('/:id/time', async (req, res) => {
  const id = parseNonNegativeInt(req.params.id);
  if (id === undefined) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  if (!(await getTicketById(id))) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const totalHours = await getTotalHoursForTicket(id);
  res.json({ ticket_id: id, total_hours: totalHours });
});

export default router;
