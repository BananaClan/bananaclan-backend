import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/trending', (req, res, next) => {
  ProductController.getTrendingProducts(req, res).catch(next);
});

router.get('/recommended', (req, res, next) => {
  ProductController.getRecommendedProducts(req, res).catch(next);
});

router.get('/latest', (req, res, next) => {
  ProductController.getLatestProducts(req, res).catch(next);
});

router.get('/:productId', (req, res, next) => {
  ProductController.getProductById(req, res).catch(next);
});

// Add this route to product.routes.ts
router.get('/:sellerId/top-selling', (req, res, next) => {
  ProductController.getTopSellingProductsBySeller(req, res).catch(next);
});


export default router;