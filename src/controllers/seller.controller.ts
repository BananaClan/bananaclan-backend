import { Request, Response } from 'express';
import { SellerService } from '../services/seller.service';

export class SellerController {
    private sellerService: SellerService;

    constructor() {
        this.sellerService = new SellerService();
    }

    // Get featured sellers
    getFeaturedSellers = async (req: Request, res: Response) => {
        try {
            const featuredSellers = await this.sellerService.getFeaturedSellers();
            res.json({
                success: true,
                count: featuredSellers.length,
                data: featuredSellers
            });
        } catch (error) {
            console.error('Error in getFeaturedSellers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve featured sellers'
            });
        }
    }
}