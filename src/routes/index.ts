import { Router } from 'express';
import productRoutes from './product.routes';
import sellerRoutes from './seller.routes';


const router = Router();

router.use('/product', productRoutes);
router.use('/sellers', sellerRoutes);

export default router;