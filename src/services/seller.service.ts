import { SellerListItem } from '../models/seller.model';
import { supabase } from '../config/supabase';

export class SellerService {
    // Fetch 8 random featured sellers
    async getFeaturedSellers(): Promise<SellerListItem[]> {
        try {
            const { data, error } = await supabase
                .from('sellers')
                .select('id, store_name, logo_url, preview_image, city, state')
                .limit(8);

            if (error) {
                console.error('Supabase Error Details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details
                });
                throw new Error(`Database query failed: ${error.message}`);
            }

            // Validate data
            if (!data || data.length === 0) {
                console.warn('No sellers found in the database');
                return [];
            }

            console.log(`Successfully retrieved ${data.length} featured sellers`);
            return data as SellerListItem[];
        } catch (error) {
            console.error('Complete Error in getFeaturedSellers:', {
                name: error instanceof Error ? error.name : 'Unknown Error',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                stack: error instanceof Error ? error.stack : 'No stack trace available'
            });

            throw error;
        }
    }
}