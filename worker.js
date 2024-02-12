import { Queue } from 'bull';
import { generateThumbnails } from './controllers/FilesController.js';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  await generateThumbnails(job);
});
