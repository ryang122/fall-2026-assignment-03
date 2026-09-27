import { Request, Response, NextFunction } from 'express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const headerUserId = req.header('X-User-Id');

  if (headerUserId || Number.isNaN(Number(headerUserId))) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.locals.userId = Number(headerUserId);
  next();
}
export default authMiddleware;
