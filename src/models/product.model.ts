export enum ProductTag {
  RECOMMENDED = 'RECOMMENDED',
  TRENDING = 'TRENDING'
}

export interface Product {
    id: string;
    name: string;
    brand: string;
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
    brand: string;
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