import redis from 'redis';
import { promisify } from 'util';

// class to define methods for commonly used redis commands
class RedisClient {
  constructor () {
    this.client = redis.createClient();
    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });
  }

  // check connection status and report
  isAlive () {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  // get value for given key from redis server
  async get (key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    await redisGet(key);
    return await redisGet(key);
  }

  // set key value pair to redis server
  async set (key, value, durationInSeconds) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await this.client.expire(key, durationInSeconds);
  }

  // del key vale pair from redis server
  async del (key) {
    const redisdel = promisify(this.client.del).bind(this.client);
    await redisdel(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
