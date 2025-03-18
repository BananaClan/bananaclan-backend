import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();


router.get('/:productId', (req, res, next) => {
  ProductController.getProductById(req, res).catch(next);
});

export default router;