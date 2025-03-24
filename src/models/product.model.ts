export enum ProductTag {
  RECOMMENDED = 'RECOMMENDED',
  TRENDING = 'TRENDING'
}

export interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  created_at: string;
}

export interface Product {
    id: string;
    name: string;
    brand_id: string;  // Changed from brand string to brand_id
    brand_name?: string; // Added to store the name from brands table
    brand_logo?: string; // Added to store the logo from brands table
    model_name: string;
    images: string[];
    seller_id: string;
    seller_name: string;
    seller_logo: string;
    color: string;
    size_quantity: Record<string, number>;
    price: number;
    color_variants: string[] | null;
    tags: ProductTag[] | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    sales_till_date: number;
  }
  
  export interface ProductResponse {
    id: string;
    name: string;
    brand_name?: string;  // Changed from brand to brand_name
    brand_logo?: string; // Added brand logo
    model_name: string;
    images: string[];
    seller_id: string;
    seller_name: string;
    seller_logo: string;
    color: string;
    size_quantity: Record<string, number>;
    price: number;
    color_variants: ProductVariant[] | null;
    tags: ProductTag[] | null;
  }
  
  export interface ProductVariant {
    id: string;
    color: string;
    image: string; 
  }

export interface SimplifiedProduct {
  id: string;
  name: string;
  brand_name: string;   // Changed from brand to brand_name
  brand_logo?: string;  // Added brand logo
  seller_id: string;
  seller_name: string;
  seller_logo: string;
  image: string;
  price: number;
  created_at?: string;
  sales_till_date?: number; 
}