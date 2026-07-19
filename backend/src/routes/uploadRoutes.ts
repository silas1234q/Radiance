import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { uploadToCloudinary, uploadProductImage } from '../services/uploadService';
import { catchAsync } from '../utils/catchAsync';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.post(
  '/skin-photo',
  requireAuth(),
  syncUser,
  upload.single('photo'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, type: 'VALIDATION_ERROR', message: 'No photo file provided' });
      return;
    }

    const url = await uploadToCloudinary(req.file.path);
    res.json({ url });
  }),
);

router.post(
  '/product-photo',
  requireAuth(),
  syncUser,
  upload.single('photo'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ success: false, type: 'VALIDATION_ERROR', message: 'No photo file provided' });
      return;
    }

    const url = await uploadProductImage(req.file.path);
    res.json({ url });
  }),
);

export default router;
