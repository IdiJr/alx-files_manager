import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const UsersController = {
  async postNew (req, res) {
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
      id: uuidv4()
    };

    const savedUser = await dbClient.createUser(newUser);
    return res.status(201).json({ id: savedUser.id, email: savedUser.email });
  },

  async getMe (req, res) {
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
  }
};

export default UsersController;
