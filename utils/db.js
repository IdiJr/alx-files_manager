import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}/${database}`;

    // this.client = MongoClient(uri);
    // this.client.connect();
    this.client = MongoClient(uri, {
      useUnifiedTopology: true,
    });
    this.client.connect();
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
module.exports = dbClient;
