import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import authMiddleware from './middleware/auth.js';
import usersRouter from './routes/users.js';
import ticketsRouter from './routes/tickets.js';

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PATCH') {
    authMiddleware(req, res, next);
    return;
  }

  next();
});

app.use('/users', usersRouter);
app.use('/tickets', ticketsRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
