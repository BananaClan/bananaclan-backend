import { Router } from 'express';
import productRoutes from './product.routes';

const router = Router();

router.use('/product', productRoutes);

export default router;