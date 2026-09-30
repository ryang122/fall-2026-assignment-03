import { db, TimeLog } from '../db/database.js';

export async function insertTimeLog(
  ticketId: number,
  userId: number,
  hours: number,
): Promise<TimeLog> {
  return await db
    .insertInto('time_logs')
    .values({ ticket_id: ticketId, user_id: userId, hours })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getTotalHoursForTicket(
  ticketId: number,
): Promise<number> {
  const result = await db
    .selectFrom('time_logs')
    .select((eb) => eb.fn.sum<string | number | null>('hours').as('total'))
    .where('ticket_id', '=', ticketId)
    .executeTakeFirstOrThrow();

  // pg returns SUM(integer) as a bigint string, and NULL when no rows match
  return Number(result.total ?? 0);
}
