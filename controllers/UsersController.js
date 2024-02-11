import dbClient from '../utils/db.js';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

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
};

export default UsersController;
