// src/services/product.service.ts
import { supabase } from '../config/supabase';
import { Product, ProductResponse, ProductVariant, ProductTag } from '../models/product.model';
import { Seller } from '../models/seller.model';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SimplifiedProduct {
  id: string;
  name: string;
  brand: string;
  seller_id: string;
  seller_name: string;
  seller_logo: string;
  image: string;
  price: number;
  created_at?: string;
}

export class ProductService {

  async getProductById(id: string): Promise<ProductResponse | null> {
    try {
      console.log(`Attempting to fetch product with ID: ${id}`);
      
      // Get the main product with seller information using a join
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          sellers(store_name, logo_url)
        `)
        .eq('id', id)
        .single();

      if (error || !productData) {
        console.error('Error fetching product:', error);
        return null;
      }

      // Extract the seller information and convert to Seller type for better type safety
      const sellerData: Partial<Seller> = Array.isArray(productData.sellers) 
        ? productData.sellers[0] 
        : productData.sellers;
      
      // Create a copy of the product without the sellers property
      const { sellers, ...product } = productData;

      // Create the product object without additional parsing
      const parsedProduct: Product = {
        ...product,
        images: product.images,
        size_quantity: product.size_quantity,
        color_variants: product.color_variants,
        seller_name: sellerData?.store_name || 'Unknown Seller',
        seller_logo: sellerData?.logo_url || ''
      };

      // If the product has color variants, fetch their details
      let variants: ProductVariant[] | null = null;
      
      if (parsedProduct.color_variants && parsedProduct.color_variants.length > 0) {
        const { data: variantData, error: variantError } = await supabase
          .from('products')
          .select('id, color, images')
          .in('id', parsedProduct.color_variants);

        if (!variantError && variantData) {
          // Transform the variant data to include the first image
          variants = variantData.map(variant => ({
            id: variant.id,
            color: variant.color,
            image: Array.isArray(variant.images) && variant.images.length > 0 
              ? variant.images[0] 
              : ''
          }));
        } else {
          console.error('Error fetching product variants:', variantError);
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

  /**
 * Get latest products sorted by creation date
 */
async getLatestProducts(page: number = 1, limit: number = 12): Promise<PaginatedResult<SimplifiedProduct>> {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get total count of active products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
      
    if (countError) {
      console.error('Error counting latest products:', countError);
      throw countError;
    }
    
    // Get paginated data with a join to sellers table
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        price,
        images,
        seller_id,
        created_at,
        sellers(store_name, logo_url)
      `)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching latest products:', error);
      throw error;
    }
    
    // Transform the data to the simplified format
    const simplifiedData = data?.map(item => {
      // Handle sellers being returned as an array and use Seller model for type safety
      const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
      
      return {
        id: item.id,
        name: item.name,
        brand: item.brand,
        seller_id: item.seller_id,
        seller_name: sellerData?.store_name || 'Unknown Seller',
        seller_logo: sellerData?.logo_url || '',
        image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '',
        price: item.price,
        created_at: item.created_at
      };
    }) || [];
    
    // Return paginated result
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: simplifiedData,
      total: totalCount,
      page,
      limit,
      totalPages
    };
  } catch (error) {
    console.error('Error in getLatestProducts service:', error);
    throw error;
  }
}

  /**
   * Fetch products with a specific tag
   */
  private async getProductsByTag(
    tag: ProductTag, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<SimplifiedProduct>> {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get total count
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .not('tags', 'is', null)
        .contains('tags', [tag]);
        
      if (countError) {
        console.error(`Error counting ${tag} products:`, countError);
        throw countError;
      }
      
      // Get paginated data with a join to sellers table
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          price,
          images,
          seller_id,
          sellers(store_name, logo_url)
        `)
        .not('tags', 'is', null)
        .contains('tags', [tag])
        .range(offset, offset + limit - 1)
        .order('name', { ascending: true });
        
      if (error) {
        console.error(`Error fetching ${tag} products:`, error);
        throw error;
      }
      
      // Transform the data to the simplified format
      const simplifiedData = data?.map(item => {
        // Handle sellers being returned as an array and use Seller model for type safety
        const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
        
        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          seller_id: item.seller_id,
          seller_name: sellerData?.store_name || 'Unknown Seller',
          seller_logo: sellerData?.logo_url || '',
          image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '',
          price: item.price
        };
      }) || [];
      
      // Return paginated result
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: simplifiedData,
        total: totalCount,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error(`Error in getProductsByTag service with tag ${tag}:`, error);
      throw error;
    }
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(page: number = 1, limit: number = 10): Promise<PaginatedResult<SimplifiedProduct>> {
    return this.getProductsByTag(ProductTag.TRENDING, page, limit);
  }
  
  /**
   * Get recommended products
   */
  async getRecommendedProducts(page: number = 1, limit: number = 10): Promise<PaginatedResult<SimplifiedProduct>> {
    return this.getProductsByTag(ProductTag.RECOMMENDED, page, limit);
  }
}