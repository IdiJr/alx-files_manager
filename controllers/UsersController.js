import { createHash } from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
      return;
    }
    const users = dbClient.client.db().collection('users');

    const user = await users.findOne({ email });

    if (user) {
      res.status(400).send({ error: 'Already exist' });
      return;
    }

    const hashPwd = createHash('sha1').update(password).digest('hex');
    const newUser = await users.insertOne({
      email,
      password: hashPwd,
    });
    res.status(201).send({
      id: newUser.insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    const authToken = req.header('X-Token') || null;
    if (!authToken) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }
    const token = `auth_${authToken}`;
    const user = await redisClient.get(token);
    if (!user) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }
    const users = dbClient.client.db().collection('users');
    const userData = await users.findOne({
      _id: ObjectId(user),
    });
    if (userData) {
      res.status(200).send({
        id: user,
        email: userData.email,
      });
    } else {
      res.status(401).send({
        error: 'Unauthorized',
      });
    }
  }
}

module.exports = UsersController;
