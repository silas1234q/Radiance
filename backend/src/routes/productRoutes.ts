import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getProducts, getProductById, getProductByBarcodeHandler, getProductAnalysis, searchProductsHandler, createProduct, extractIngredients } from '../controllers/productController';

const router = Router();
router.use(requireAuth(), syncUser);
router.post('/', createProduct);
router.post('/extract-ingredients', extractIngredients);
router.get('/search', searchProductsHandler);
router.get('/barcode/:code', getProductByBarcodeHandler);
router.get('/', getProducts);
router.get('/:id/analysis', getProductAnalysis);
router.get('/:id', getProductById);
export default router;
