import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { uploadToCloudinary, uploadProductImage } from '../services/uploadService';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

router.post(
  '/skin-photo',
  requireAuth(),
  syncUser,
  catchAsync(async (req, res) => {
    const { photo } = req.body;
    if (!photo || typeof photo !== 'string') {
      res.status(400).json({ success: false, type: 'VALIDATION_ERROR', message: 'No photo data provided' });
      return;
    }

    const url = await uploadToCloudinary(photo);
    res.json({ url });
  }),
);

router.post(
  '/product-photo',
  requireAuth(),
  syncUser,
  catchAsync(async (req, res) => {
    const { photo } = req.body;
    if (!photo || typeof photo !== 'string') {
      res.status(400).json({ success: false, type: 'VALIDATION_ERROR', message: 'No photo data provided' });
      return;
    }

    const url = await uploadProductImage(photo);
    res.json({ url });
  }),
);

export default router;
