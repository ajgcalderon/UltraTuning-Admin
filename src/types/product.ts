export interface ProductColorImage {
  id?: string;
  colorId?: string;
  imageUrl: string;
  sortOrder?: number;
}

export interface ProductColor {
  id?: string;
  productId?: string;
  name: string;
  hex?: string;
  sortOrder?: number;
  images: string[];
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  priceUSD: number;
  image: string;
  images: string[];
  colors?: ProductColor[];
  description: string;
  featured: boolean;
  inStock: boolean;
  stockStatus: 'EN_STOCK' | 'BAJO_PEDIDO' | 'AGOTADO';
  isActive: boolean;
  isDeleted?: boolean;
  leadTime?: string;
  zone: 'Interior' | 'Exterior' | 'Iluminación' | 'Rendimiento';
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  specifications: Record<string, string>;
  compatibility: Array<{ make: string; model: string; years: string }>;
  faqs?: ProductFaq[];
  createdAt?: string;
  updatedAt?: string;
}
