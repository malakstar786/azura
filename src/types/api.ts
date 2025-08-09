// Common API response structure
export interface ApiResponse<T> {
    success: number;
    error: string[];
    data: T;
  }
  
  // Home Service Block
  export interface ServiceBlockItem {
    title: string;
    description: string;
    icon?: string;
  }
  
  // Product
  export interface Product {
    product_id: string;
    name: string;
    description: string;
    price: string;
    special: string | false;
    image: string;
    images: string[];
    category_id: string;
    category_name: string;
  } 