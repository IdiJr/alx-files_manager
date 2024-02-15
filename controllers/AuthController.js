import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authToken = req.header('Authorization') || null;
    if (!authToken) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }

    const tokenDecoded = Buffer.from(authToken.split(' ')[1], 'base64').toString('utf8');
    const [email, password] = tokenDecoded.split(':');
    if (!email || !password) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }

    const hashPwd = createHash('sha1').update(password).digest('hex');
    const allUsers = dbClient.client.db().collection('users');
    const user = await allUsers.findOne({
      email,
      password: hashPwd,
    });

    if (user) {
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);
      res.status(200).send({
        token,
      });
    } else {
      res.status(401).send({
        error: 'Unauthorized',
      });
    }
  }

  static async getDisconnect(req, res) {
    let authToken = req.header('X-Token') || null;
    if (!authToken) {
      res.status(401).send({
        error: 'Unauthorized',
      });
      return;
    }
    authToken = `auth_${authToken}`;
    const user = await redisClient.get(authToken);
    if (user) {
      await redisClient.del(authToken);
      res.status(204).send();
    } else {
      res.status(401).send({
        error: 'Unauthorized',
      });
    }
  }
}

module.exports = AuthController;
