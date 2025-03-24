
import { supabase } from '../config/supabase';
import { Product, ProductResponse, ProductVariant, ProductTag, Brand, SimplifiedProduct } from '../models/product.model';
import { Seller } from '../models/seller.model';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductService {

  async getProductById(id: string): Promise<ProductResponse | null> {
    try {
      console.log(`Attempting to fetch product with ID: ${id}`);
      
      // Get the main product with seller and brand information using a join
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          sellers(store_name, logo_url),
          brands(name, logo_url)
        `)
        .eq('id', id)
        .single();

      if (error || !productData) {
        console.error('Error fetching product:', error);
        return null;
      }

      // Extract the seller information
      const sellerData: Partial<Seller> = Array.isArray(productData.sellers) 
        ? productData.sellers[0] 
        : productData.sellers;
      
      // Extract the brand information
      const brandData: Partial<Brand> = Array.isArray(productData.brands)
        ? productData.brands[0]
        : productData.brands;
      
      // Create a copy of the product without the nested objects
      const { sellers, brands, ...product } = productData;

      // Create the product object without additional parsing
      const parsedProduct: Product = {
        ...product,
        images: product.images,
        size_quantity: product.size_quantity,
        color_variants: product.color_variants,
        seller_name: sellerData?.store_name || 'Unknown Seller',
        seller_logo: sellerData?.logo_url || '',
        brand_name: brandData?.name || 'Unknown Brand',
        brand_logo: brandData?.logo_url || ''
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
        id: parsedProduct.id,
        name: parsedProduct.name,
        brand_name: parsedProduct.brand_name,
        brand_logo: parsedProduct.brand_logo,
        model_name: parsedProduct.model_name,
        images: parsedProduct.images,
        seller_id: parsedProduct.seller_id,
        seller_name: parsedProduct.seller_name,
        seller_logo: parsedProduct.seller_logo,
        color: parsedProduct.color,
        size_quantity: parsedProduct.size_quantity,
        price: parsedProduct.price,
        color_variants: variants,
        tags: parsedProduct.tags
      };
    } catch (error) {
      console.error('Error in getProductById service:', error);
      return null;
    }
  }

  /**
   * Get top selling products by seller
   */
  async getTopSellingProductsBySeller(
    sellerId: string,
    page: number = 1,
    limit: number = 8
  ): Promise<PaginatedResult<SimplifiedProduct>> {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get total count of active products for this seller
      const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('seller_id', sellerId);
        
      if (countError) {
        console.error('Error counting seller products:', countError);
        throw countError;
      }
      
      // Get paginated data with a join to sellers and brands tables
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand_id,
          price,
          images,
          seller_id,
          sales_till_date,
          created_at,
          sellers(store_name, logo_url),
          brands(name, logo_url)
        `)
        .eq('is_active', true)
        .eq('seller_id', sellerId)
        .range(offset, offset + limit - 1)
        .order('sales_till_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching top selling products by seller:', error);
        throw error;
      }
      
      // Transform the data to the simplified format
      const simplifiedData = data?.map(item => {
        // Handle sellers being returned as an array
        const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
        
        // Handle brands being returned as an array
        const brandData: Partial<Brand> = Array.isArray(item.brands) ? item.brands[0] : item.brands;
        
        return {
          id: item.id,
          name: item.name,
          brand_name: brandData?.name || 'Unknown Brand',
          brand_logo: brandData?.logo_url || '',
          seller_id: item.seller_id,
          seller_name: sellerData?.store_name || 'Unknown Seller',
          seller_logo: sellerData?.logo_url || '',
          image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '',
          price: item.price,
          sales_till_date: item.sales_till_date,
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
      console.error('Error in getTopSellingProductsBySeller service:', error);
      throw error;
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
      
      // Get paginated data with a join to sellers and brands tables
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand_id,
          price,
          images,
          seller_id,
          created_at,
          sellers(store_name, logo_url),
          brands(name, logo_url)
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
        // Handle sellers being returned as an array
        const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
        
        // Handle brands being returned as an array
        const brandData: Partial<Brand> = Array.isArray(item.brands) ? item.brands[0] : item.brands;
        
        return {
          id: item.id,
          name: item.name,
          brand_name: brandData?.name || 'Unknown Brand',
          brand_logo: brandData?.logo_url || '',
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
      
      // Get paginated data with a join to sellers and brands tables
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand_id,
          price,
          images,
          seller_id,
          sellers(store_name, logo_url),
          brands(name, logo_url)
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
        // Handle sellers being returned as an array
        const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
        
        // Handle brands being returned as an array
        const brandData: Partial<Brand> = Array.isArray(item.brands) ? item.brands[0] : item.brands;
        
        return {
          id: item.id,
          name: item.name,
          brand_name: brandData?.name || 'Unknown Brand',
          brand_logo: brandData?.logo_url || '',
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

  // Add this method to your ProductService class

/**
 * Get top selling products with optional brand filtering
 * @param page Page number (starting from 1)
 * @param limit Number of items per page
 * @param brands Optional array of brand IDs or names to filter by
 * @returns PaginatedResult containing top selling products, optionally grouped by brand
 */
async getTopSellingProducts(
  page: number = 1,
  limit: number = 8,
  brands?: string[]
): Promise<{[key: string]: PaginatedResult<SimplifiedProduct>} | PaginatedResult<SimplifiedProduct>> {
  try {
    // If no brands specified, return all top selling products
    if (!brands || brands.length === 0) {
      return this.getOverallTopSellingProducts(page, limit);
    }
    
    // If brands are specified, get top selling products for each brand
    const results: {[key: string]: PaginatedResult<SimplifiedProduct>} = {};
    
    // Process each brand in parallel for better performance
    await Promise.all(
      brands.map(async (brandName) => {
        const brandResult = await this.getTopSellingProductsByBrand(brandName, page, limit);
        // Use the brand name as the key
        results[brandName] = brandResult;
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error in getTopSellingProducts service:', error);
    throw error;
  }
}

/**
 * Get overall top selling products across all brands
 */
private async getOverallTopSellingProducts(
  page: number = 1,
  limit: number = 8
): Promise<PaginatedResult<SimplifiedProduct>> {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get total count of active products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
      
    if (countError) {
      console.error('Error counting products for top selling:', countError);
      throw countError;
    }
    
    // Get paginated data with a join to sellers and brands tables
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand_id,
        price,
        images,
        seller_id,
        sales_till_date,
        sellers(store_name, logo_url),
        brands(name, logo_url)
      `)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('sales_till_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching top selling products:', error);
      throw error;
    }
    
    // Transform the data to the simplified format
    const simplifiedData = data?.map(item => {
      // Handle sellers being returned as an array
      const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
      
      // Handle brands being returned as an array
      const brandData: Partial<Brand> = Array.isArray(item.brands) ? item.brands[0] : item.brands;
      
      return {
        id: item.id,
        name: item.name,
        brand_name: brandData?.name || 'Unknown Brand',
        brand_logo: brandData?.logo_url || '',
        seller_id: item.seller_id,
        seller_name: sellerData?.store_name || 'Unknown Seller',
        seller_logo: sellerData?.logo_url || '',
        image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '',
        price: item.price,
        sales_till_date: item.sales_till_date
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
    console.error('Error in getOverallTopSellingProducts service:', error);
    throw error;
  }
}

/**
 * Get top selling products for a specific brand
 */
private async getTopSellingProductsByBrand(
  brandName: string,
  page: number = 1,
  limit: number = 8
): Promise<PaginatedResult<SimplifiedProduct>> {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // First, find the brand ID from the brand name if needed
    let brandIdToUse: string | null = null;
    
    // Check if the brandName is a UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidPattern.test(brandName);
    
    if (!isUuid) {
      // Need to look up the brand ID by name
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', brandName)
        .single();
        
      if (brandError) {
        console.error(`Error finding brand with name ${brandName}:`, brandError);
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
      
      brandIdToUse = brandData.id;
    } else {
      // The provided brand name is already a UUID
      brandIdToUse = brandName;
    }
    
    // Get count of products matching this brand
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('brand_id', brandIdToUse);
      
    if (countError) {
      console.error(`Error counting products for brand ${brandName}:`, countError);
      throw countError;
    }
    
    // Get paginated data for this brand
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand_id,
        price,
        images,
        seller_id,
        sales_till_date,
        sellers(store_name, logo_url),
        brands(name, logo_url)
      `)
      .eq('is_active', true)
      .eq('brand_id', brandIdToUse)
      .range(offset, offset + limit - 1)
      .order('sales_till_date', { ascending: false });
      
    if (error) {
      console.error(`Error fetching top selling products for brand ${brandName}:`, error);
      throw error;
    }
    
    // Transform the data
    const simplifiedData = data?.map(item => {
      // Handle sellers being returned as an array
      const sellerData: Partial<Seller> = Array.isArray(item.sellers) ? item.sellers[0] : item.sellers;
      
      // Handle brands being returned as an array
      const brandData: Partial<Brand> = Array.isArray(item.brands) ? item.brands[0] : item.brands;
      
      return {
        id: item.id,
        name: item.name,
        brand_name: brandData?.name || 'Unknown Brand',
        brand_logo: brandData?.logo_url || '',
        seller_id: item.seller_id,
        seller_name: sellerData?.store_name || 'Unknown Seller',
        seller_logo: sellerData?.logo_url || '',
        image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '',
        price: item.price,
        sales_till_date: item.sales_till_date
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
    console.error(`Error in getTopSellingProductsByBrand service for brand ${brandName}:`, error);
    throw error;
  }
}
}