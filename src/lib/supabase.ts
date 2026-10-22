import { createClient } from '@supabase/supabase-js';
import type { Product, ProductColor } from '../types/product';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (import.meta.env as any).PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  (import.meta.env as any).PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const STORE_URL =
  import.meta.env.VITE_STORE_URL ||
  import.meta.env.STORE_URL ||
  (import.meta.env as any).PUBLIC_STORE_URL ||
  'https://ultratuning.ve';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://mock-supabase.local', 'mock-key');

/**
 * Sube una imagen al bucket product-images de Supabase Storage.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!isSupabaseConfigured) {
    // Si no está configurado Supabase aún en .env, creamos una URL de objeto local temporal para preview
    return URL.createObjectURL(file);
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const fileName = `${Date.now()}-${cleanName}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Obtiene todos los productos (incluyendo variantes de color e imágenes vinculadas).
 */
export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) {
    const local = localStorage.getItem('mock_products');
    if (local) {
      const parsed: Product[] = JSON.parse(local);
      return parsed.filter(p => !p.isDeleted);
    }
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_colors (
        id,
        product_id,
        name,
        hex,
        sort_order,
        product_color_images (
          id,
          color_id,
          image_url,
          sort_order
        )
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapRowToProduct);
}

/**
 * Obtiene un producto por su SKU / ID.
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) {
    const products = await fetchProducts();
    return products.find(p => p.id === id) || null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_colors (
        id,
        product_id,
        name,
        hex,
        sort_order,
        product_color_images (
          id,
          color_id,
          image_url,
          sort_order
        )
      )
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error) {
    return null;
  }

  return mapRowToProduct(data);
}

/**
 * Guarda o actualiza un producto junto con sus variantes de color y fotos.
 */
export async function saveProduct(product: Product, isEdit: boolean): Promise<Product> {
  if (!isSupabaseConfigured) {
    const products = await fetchProducts();
    let updated: Product[];
    if (isEdit) {
      updated = products.map(p => (p.id === product.id ? product : p));
    } else {
      updated = [product, ...products];
    }
    localStorage.setItem('mock_products', JSON.stringify(updated));
    return product;
  }

  // 1. Guardar tabla products
  const productRow = {
    id: product.id,
    name: product.name,
    category: product.category,
    price_usd: product.priceUSD,
    image: product.image,
    images: product.images,
    description: product.description,
    featured: product.featured,
    in_stock: product.inStock,
    stock_status: product.stockStatus,
    is_active: product.isActive,
    lead_time: product.leadTime || null,
    zone: product.zone,
    tags: product.tags || [],
    meta_title: product.metaTitle || null,
    meta_description: product.metaDescription || null,
    specifications: product.specifications || {},
    compatibility: product.compatibility || [],
    faqs: product.faqs || [],
    is_deleted: false,
  };

  const { data: savedProduct, error: productError } = await supabase
    .from('products')
    .upsert(productRow, { onConflict: 'id' })
    .select()
    .single();

  if (productError) {
    throw new Error(`Error guardando producto: ${productError.message}`);
  }

  // 2. Gestionar variantes de color y sus fotos
  if (product.colors && Array.isArray(product.colors)) {
    // Si estamos editando, eliminamos variantes antiguas para reemplazarlas de forma limpia
    if (isEdit) {
      await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', product.id);
    }

    for (let i = 0; i < product.colors.length; i++) {
      const color = product.colors[i];
      if (!color.name.trim()) continue;

      const { data: savedColor, error: colorError } = await supabase
        .from('product_colors')
        .insert({
          product_id: product.id,
          name: color.name.trim(),
          hex: color.hex || null,
          sort_order: i + 1,
        })
        .select()
        .single();

      if (colorError || !savedColor) {
        console.error('Error insertando color:', colorError);
        continue;
      }

      // Insertar imágenes vinculadas a este color
      if (color.images && color.images.length > 0) {
        const imageRows = color.images.map((imgUrl, imgIndex) => ({
          color_id: savedColor.id,
          image_url: imgUrl,
          sort_order: imgIndex + 1,
        }));

        const { error: imagesError } = await supabase
          .from('product_color_images')
          .insert(imageRows);

        if (imagesError) {
          console.error('Error insertando fotos del color:', imagesError);
        }
      }
    }
  }

  return mapRowToProduct(savedProduct);
}

/**
 * Actualiza rápidamente el estado de stock o visibilidad desde la tabla.
 */
export async function updateProductQuickStatus(
  id: string,
  updates: {
    stockStatus?: Product['stockStatus'];
    inStock?: boolean;
    isActive?: boolean;
  }
): Promise<void> {
  if (!isSupabaseConfigured) {
    const products = await fetchProducts();
    const updated = products.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          inStock: updates.stockStatus ? updates.stockStatus === 'EN_STOCK' : p.inStock,
        };
      }
      return p;
    });
    localStorage.setItem('mock_products', JSON.stringify(updated));
    return;
  }

  const rowUpdates: Record<string, any> = {};
  if (updates.stockStatus !== undefined) {
    rowUpdates.stock_status = updates.stockStatus;
    rowUpdates.in_stock = updates.stockStatus === 'EN_STOCK';
  }
  if (updates.inStock !== undefined) rowUpdates.in_stock = updates.inStock;
  if (updates.isActive !== undefined) rowUpdates.is_active = updates.isActive;

  const { error } = await supabase
    .from('products')
    .update(rowUpdates)
    .eq('id', id);

  if (error) {
    throw error;
  }
}

/**
 * Borrado suave de un producto.
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const products = await fetchProducts();
    const updated = products.map(p => (p.id === id ? { ...p, isDeleted: true, isActive: false } : p));
    localStorage.setItem('mock_products', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase
    .from('products')
    .update({ is_deleted: true, is_active: false })
    .eq('id', id);

  if (error) {
    throw error;
  }
}

function mapRowToProduct(row: any): Product {
  const colors: ProductColor[] = Array.isArray(row.product_colors)
    ? row.product_colors
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((c: any) => ({
          id: c.id,
          productId: c.product_id,
          name: c.name,
          hex: c.hex ?? undefined,
          sortOrder: c.sort_order ?? 0,
          images: Array.isArray(c.product_color_images)
            ? c.product_color_images
                .sort((imgA: any, imgB: any) => (imgA.sort_order ?? 0) - (imgB.sort_order ?? 0))
                .map((img: any) => img.image_url)
            : [],
        }))
    : [];

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    priceUSD: Number(row.price_usd ?? row.priceUSD ?? 0),
    image: row.image,
    images: Array.isArray(row.images) ? row.images : [row.image].filter(Boolean),
    colors: colors.length > 0 ? colors : undefined,
    description: row.description ?? '',
    featured: Boolean(row.featured),
    inStock: Boolean(row.in_stock),
    stockStatus: row.stock_status ?? (row.in_stock ? 'EN_STOCK' : 'AGOTADO'),
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    isDeleted: Boolean(row.is_deleted),
    leadTime: row.lead_time ?? undefined,
    zone: row.zone ?? 'Interior',
    tags: Array.isArray(row.tags) ? row.tags : [],
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    specifications: typeof row.specifications === 'object' && row.specifications !== null ? row.specifications : {},
    compatibility: Array.isArray(row.compatibility) ? row.compatibility : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
