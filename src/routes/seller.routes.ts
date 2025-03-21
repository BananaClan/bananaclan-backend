import express from 'express';
import { SellerController } from '../controllers/seller.controller';

const router = express.Router();
const sellerController = new SellerController();

// GET featured sellers
router.get('/featured', sellerController.getFeaturedSellers);

export default router;