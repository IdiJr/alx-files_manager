import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the email already exists in the Redis cache
    const emailExistsInCache = await redisClient.get(email);
    if (emailExistsInCache) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Check if the email already exists in the MongoDB database
    const existingUser = await dbClient.client.db().collection('users').findOne({ email });
    if (existingUser) {
      // Cache the email to Redis to avoid duplicate registrations
      await redisClient.set(email, 'true', 60); // 60 seconds cache
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using SHA1
    const hashedPassword = sha1(password);

    // Create a new user object
    const newUser = {
      email,
      password: hashedPassword,
    };

    // Insert the new user into the users collection
    const result = await dbClient.client.db().collection('users').insertOne(newUser);

    // Return the new user with only the email and the id
    const responseUser = {
      id: result.insertedId,
      email: newUser.email,
    };

    return res.status(201).json(responseUser);
  },
};

export default UsersController;
