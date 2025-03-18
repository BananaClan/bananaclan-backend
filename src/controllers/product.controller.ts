import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';

const productService = new ProductService();

export class ProductController {
  static async getProductById(req: Request, res: Response) {
    try {
      const productId = req.params.productId;
      
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const product = await productService.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json({
        status: 'success',
        data: product
      });
    } catch (error) {
      console.error('Error in getProductById controller:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'An error occurred while fetching the product' 
      });
    }
  }
}