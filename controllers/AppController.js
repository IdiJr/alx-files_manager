import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AppController {
  static async getStats() {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    return ({ users, files });
  }

  static getStatus() {
    const redis = redisClient.isAlive();
    const db = dbClient.isAlive();
    return ({ redis, db });
  }
}
