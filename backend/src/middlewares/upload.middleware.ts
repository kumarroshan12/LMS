import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ENV } from '../config/env';

const uploadDirectory = path.resolve(process.cwd(), ENV.UPLOAD_DIR);
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const borrowerId = (_req as Request & { user?: { id: string } }).user?.id || 'unassociated';
    cb(null, `salary-slip-${borrowerId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  const matchingMime =
    (ext === '.pdf' && file.mimetype === 'application/pdf') ||
    ((ext === '.jpg' || ext === '.jpeg') && file.mimetype === 'image/jpeg') ||
    (ext === '.png' && file.mimetype === 'image/png');

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype) && matchingMime) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only matching PDF, JPG, and PNG files are allowed.') as Error & { statusCode: number };
    error.statusCode = 400;
    cb(error);
  }
};

export const salarySlipUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max limit
  },
  fileFilter,
});
