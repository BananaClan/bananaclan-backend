export interface Product {
    id: string;
    name: string;
    brand: string;
    model_name: string;
    images: string[];
    seller_id: string;
    color: string;
    size_quantity: Record<string, number>;
    price: number;
    color_variants: string[] | null;
  }
  
  export interface ProductResponse {
    id: string;
    name: string;
    brand: string;
    model_name: string;
    images: string[];
    seller_id: string;
    color: string;
    size_quantity: Record<string, number>;
    price: number;
    color_variants: ProductVariant[] | null;
  }
  
  export interface ProductVariant {
    id: string;
    color: string;
    image: string; 
  }