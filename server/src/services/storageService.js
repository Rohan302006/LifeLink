import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config/env.js';

// Ensure private upload directory exists
const privateUploadDir = path.resolve(config.uploadDir);
if (!fs.existsSync(privateUploadDir)) {
  fs.mkdirSync(privateUploadDir, { recursive: true });
}

// Storage abstraction class
class LocalStorageProvider {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  getFilePath(fileName) {
    // Prevent path traversal
    const safeName = path.basename(fileName);
    return path.join(this.baseDir, safeName);
  }

  async getFileStream(fileName) {
    const filePath = this.getFilePath(fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found on storage');
    }
    return fs.createReadStream(filePath);
  }

  async deleteFile(fileName) {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  fileExists(fileName) {
    const filePath = this.getFilePath(fileName);
    return fs.existsSync(filePath);
  }
}

export const storageProvider = new LocalStorageProvider(privateUploadDir);

// Multer disk storage engine
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, privateUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random UUID filename
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${crypto.randomUUID()}${ext}`;
    cb(null, randomName);
  },
});

// File filter: jpg, png, pdf only
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

// 5 MB limit
export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
});

