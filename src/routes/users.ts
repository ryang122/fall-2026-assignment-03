import { Router } from 'express';
import { getAllUsers, getUserById, createUser } from '../dal/users.js';


const router = Router();

// TODO: Student implementation - Part 1: User Routes
// GET /users
// GET /users/:id
// POST /users

router.get('/', async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)){
        res.status(400).json({error: 'Invalid ID'})
        return;
    }
    const user = await getUserById(id)
    if(!user) {
        res.status(400).json({error: 'User not found'})
        return;
    }
    res.json(user);
});

router.post('/', async (req,res) => {
    const user = await createUser(req.body);
    res.status(201).json(user);
});

export default router;
