import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
  }
};

export default FilesController;
