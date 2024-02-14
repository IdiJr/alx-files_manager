/**
 * handle DB connections using mongodb
 */
import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri, {
      useUnifiedTopology: true,
    });

    // Connect to the database in the constructor
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const myDb = this.client.db();
    return myDb.collection('users').countDocuments();
  }

  async nbFiles() {
    const myDb = this.client.db();
    return myDb.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
