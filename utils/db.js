// utils/db.js
import { MongoClient } from 'mongodb';

class DBClient {
  constructor () {
    const HOST = process.env.DB_HOST || 'localhost';
    const PORT = process.env.DB_PORT || 27017;
    const DATABASE = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${HOST}:${PORT}/${DATABASE}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.client.db(`${DATABASE}`);
    }).catch((err) => {
      console.log(err);
    });
  }

  isAlive () {
    return this.client.isConnected();
  }

  async nbUsers () {
    try {
      const db = this.client.db();
      const usersCollection = db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting users:', error);
      return -1; // or throw an error
    }
  }

  async nbFiles () {
    try {
      const db = this.client.db();
      const filesCollection = db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (error) {
      console.error('Error counting files:', error);
      return -1; // or throw an error
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
