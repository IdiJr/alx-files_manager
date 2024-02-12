import { hash } from 'bcrypt';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const userQueue = new Queue('userQueue');

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingUser = await dbClient.getUser({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = await hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      id: uuidv4(),
    };

    const savedUser = await dbClient.createUser(newUser);
    return res.status(201).json({ id: savedUser.id, email: savedUser.email });
  },

  async getMe(req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  },

  async postUser(req, res) {
    try {
      const userData = req.body;

      const newUser = await dbClient.createUser(userData);

      userQueue.add({ userId: newUser.id });

      return res.status(201).json(newUser);
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
