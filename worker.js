import { Queue } from 'bull';
import dbClient from './utils/db.js';

const fileQueue = new Queue('fileQueue');

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }
  const user = await dbClient.getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${user.email}!`);
});
