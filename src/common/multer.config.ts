import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: '/www/wwwroot/Civil_Resolve_backend/uploads',
    filename: (_, file, cb) => {
      const unique =
        Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
