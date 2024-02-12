import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import fs from 'fs';
import mime from 'mime-types';
import { Queue } from 'bull';
import { generate } from 'image-thumbnail';

import { v4 as uuidv4 } from 'uuid';

const fileQueue = new Queue('fileQueue');

const FilesController = {
  async postUpload (req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, data, parentId = '0', isPublic = false } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (['file', 'image'].includes(type) && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const parentFile = await dbClient.getFile(parentId);
      if (!parentFile || parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent not found or is not a folder' });
      }
    }

    let localPath = null;
    if (['file', 'image'].includes(type)) {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      localPath = `${folderPath}/${uuidv4()}`;
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    }

    const newFile = await dbClient.createFile({
      userId,
      name,
      type,
      parentId,
      isPublic,
      localPath
    });

    return res.status(201).json(newFile);
  },

  async getShow (req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.getFile(id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.json(file);
  },

  async getIndex (req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = '0', page = 0 } = req.query;
    const files = await dbClient.getFilesByParentId(userId, parentId, page);
    return res.json(files);
  },

  async putPublish (req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.getFile(id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updatedFile = await dbClient.updateFile(id, { isPublic: true });
    return res.status(200).json(updatedFile);
  },

  async putUnpublish (req, res) {
    const { 'x-token': token } = req.headers;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.getFile(id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updatedFile = await dbClient.updateFile(id, { isPublic: false });
    return res.status(200).json(updatedFile);
  },

  async getFile (req, res) {
    const { 'x-token': token } = req.headers;
    const { id } = req.params;

    const file = await dbClient.getFile(id);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic) {
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || userId !== file.userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const contentType = mime.lookup(file.name) || 'application/octet-stream';
    const fileContent = fs.readFileSync(file.localPath, 'utf-8');

    res.setHeader('Content-Type', contentType);
    res.send(fileContent);
  },

  async postUpload (req, res) {
    // Existing implementation...

    // Start background processing for generating thumbnails
    if (type === 'image') {
      fileQueue.add({ userId, fileId });
    }

    return res.status(201).json(newFile);
  },

  // New method to handle thumbnail generation
  async generateThumbnails (job) {
    const { fileId, userId } = job.data;

    if (!fileId) {
      throw new Error('Missing fileId');
    }

    if (!userId) {
      throw new Error('Missing userId');
    }

    const file = await dbClient.getFile(fileId);
    if (!file || file.userId !== userId) {
      throw new Error('File not found');
    }

    const localPath = file.localPath;
    if (!fs.existsSync(localPath)) {
      throw new Error('File not found');
    }

    try {
      await generate({
        source: localPath,
        destination: localPath,
        width: 500
      });
      await generate({
        source: localPath,
        destination: localPath,
        width: 250
      });
      await generate({
        source: localPath,
        destination: localPath,
        width: 100
      });
    } catch (error) {
      console.error('Thumbnail generation error:', error);
    }
  },

  async getFile (req, res) {
    // Existing implementation...

    const { size } = req.query;
    const localFilePath = `${file.localPath}_${size}`;

    if (!fs.existsSync(localFilePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const contentType = mime.lookup(localFilePath) || 'application/octet-stream';
    const fileContent = fs.readFileSync(localFilePath, 'utf-8');

    res.setHeader('Content-Type', contentType);
    res.send(fileContent);
  }
};

export default FilesController;
