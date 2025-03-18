// src/services/product.service.ts
import { supabase } from '../config/supabase';
import { Product, ProductResponse, ProductVariant } from '../models/product.model';

export class ProductService {
  async getProductById(id: string): Promise<ProductResponse | null> {
    try {
      console.log(`Attempting to fetch product with ID: ${id}`);
      
      // Get the main product
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Database response:', { data: product, error });

      if (error || !product) {
        console.error('Error fetching product:', error);
        return null;
      }

      // Create the product object without additional parsing
      const parsedProduct: Product = {
        ...product,
        images: product.images,
        size_quantity: product.size_quantity,
        color_variants: product.color_variants
      };

      // If the product has color variants, fetch their details
      let variants: ProductVariant[] | null = null;
      
      if (parsedProduct.color_variants && parsedProduct.color_variants.length > 0) {
        const { data: variantData, error: variantError } = await supabase
          .from('products')
          .select('id, color, images')
          .in('id', parsedProduct.color_variants);

        if (variantError) {
          console.error('Error fetching product variants:', variantError);
        } else if (variantData) {
          // Transform the variant data to include the first image
          variants = variantData.map(variant => ({
            id: variant.id,
            color: variant.color,
            image: variant.images && Array.isArray(variant.images) && variant.images.length > 0 
              ? variant.images[0] 
              : ''
          }));
        }
      }

      return {
        ...parsedProduct,
        color_variants: variants
      };
    } catch (error) {
      console.error('Error in getProductById service:', error);
      return null;
    }
  }
}