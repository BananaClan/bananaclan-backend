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

  static async getTrendingProducts(req: Request, res: Response) {
    try {
      // Get pagination parameters from query string
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 50.'
        });
      }
      
      const result = await productService.getTrendingProducts(page, limit);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Error in getTrendingProducts controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching trending products'
      });
    }
  }
  
  static async getRecommendedProducts(req: Request, res: Response) {
    try {
      // Get pagination parameters from query string
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 50.'
        });
      }
      
      const result = await productService.getRecommendedProducts(page, limit);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Error in getRecommendedProducts controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching recommended products'
      });
    }
  }

}