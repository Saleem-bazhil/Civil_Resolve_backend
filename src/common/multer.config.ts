import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: '/www/wwwroot/Civil_Resolve_backend/uploads',
    filename: (req, file, cb) => {
      const uniqueName =
        Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueName + extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      cb(new Error('Only image files allowed'), false);
    }
    cb(null, true);
  },
};
