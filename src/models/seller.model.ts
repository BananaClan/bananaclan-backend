export interface Seller {
    id: string;
    store_name: string;
    bio: string;
    gallery_images: string[];
    instagram_url: string;
    twitter_url: string;
    website_url: string;
    address: string;
    city: string;
    state: string;
    mobile: string;
    email: string;
    logo_url: string;
    banner_url: string | null;
    verified: boolean;
    created_at: string;
    updated_at: string;
    preview_image: string | null;
  }

  // DTO (Data Transfer Object) for simplified seller list
export interface SellerListItem {
  id: string;
  store_name: string;
  logo_url: string;
  preview_image: string | null;
  city: string;
  state: string;
}