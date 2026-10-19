import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ExternalLink,
  Palette,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { Product } from '../types/product';
import { fetchProducts, updateProductQuickStatus, deleteProduct } from '../lib/supabase';

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<string>('ALL');
  const [filterVisibility, setFilterVisibility] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const storeUrl = import.meta.env.VITE_STORE_URL || 'https://ultratuning.ve';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPI Calculations
  const totalCount = products.length;
  const enStockCount = products.filter(p => p.stockStatus === 'EN_STOCK' && p.isActive).length;
  const bajoPedidoCount = products.filter(p => p.stockStatus === 'BAJO_PEDIDO' && p.isActive).length;
  const agotadoCount = products.filter(p => p.stockStatus === 'AGOTADO' && p.isActive).length;
  const ocultosCount = products.filter(p => !p.isActive).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Búsqueda
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      // Stock
      const matchStock = filterStock === 'ALL' || p.stockStatus === filterStock;

      // Visibilidad
      const matchVisibility =
        filterVisibility === 'ALL' ||
        (filterVisibility === 'ACTIVE' && p.isActive) ||
        (filterVisibility === 'HIDDEN' && !p.isActive);

      // Zona
      const matchZone = filterZone === 'ALL' || p.zone === filterZone;

      return matchSearch && matchStock && matchVisibility && matchZone;
    });
  }, [products, search, filterStock, filterVisibility, filterZone]);

  // Quick Toggle Stock Status
  const handleQuickStockChange = async (product: Product, newStatus: Product['stockStatus']) => {
    try {
      await updateProductQuickStatus(product.id, {
        stockStatus: newStatus,
        inStock: newStatus === 'EN_STOCK',
      });
      setProducts(prev =>
        prev.map(p =>
          p.id === product.id ? { ...p, stockStatus: newStatus, inStock: newStatus === 'EN_STOCK' } : p
        )
      );
      showToast(`Estado de stock actualizado para "${product.name}"`);
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar stock', 'error');
    }
  };

  // Quick Toggle Visibility
  const handleQuickVisibilityChange = async (product: Product) => {
    const newActive = !product.isActive;
    try {
      await updateProductQuickStatus(product.id, { isActive: newActive });
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, isActive: newActive } : p))
      );
      showToast(newActive ? `"${product.name}" ahora es visible en la tienda` : `"${product.name}" ahora está oculto`);
    } catch (err: any) {
      showToast(err?.message || 'Error al actualizar visibilidad', 'error');
    }
  };

  // Confirm Soft Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingId);
      setProducts(prev => prev.filter(p => p.id !== deletingId));
      showToast('Producto eliminado del catálogo (Soft Delete)', 'success');
      setDeletingId(null);
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar producto', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-800'
              : 'bg-rose-950 text-rose-200 border-rose-800'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase font-heading tracking-wide flex items-center gap-3">
            <span>Catálogo de Productos</span>
            <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-mono font-bold">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Administra visibilidad, disponibilidad y fotos organizadas en bloques por color.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-red-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Producto</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#141418] border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block">Total Items</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141418] border border-emerald-950/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">En Stock</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{enStockCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141418] border border-amber-950/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold block">Bajo Pedido</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5 block">{bajoPedidoCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141418] border border-rose-950/60 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold block">Sin Stock</span>
            <span className="text-2xl font-black text-rose-400 font-mono mt-0.5 block">{agotadoCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141418] border border-purple-950/60 p-4 rounded-2xl flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-purple-400 font-bold block">Ocultos</span>
            <span className="text-2xl font-black text-purple-400 font-mono mt-0.5 block">{ocultosCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
            <EyeOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141418] border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o categoría..."
            className="w-full bg-[#1b1b22] border border-zinc-700/80 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Filter */}
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="bg-[#1b1b22] border border-zinc-700/80 text-xs text-zinc-300 rounded-xl px-3 py-2.5 outline-none focus:border-red-500 font-semibold"
          >
            <option value="ALL">Todo el Stock</option>
            <option value="EN_STOCK">🟢 En Stock</option>
            <option value="BAJO_PEDIDO">🟡 Bajo Pedido</option>
            <option value="AGOTADO">🔴 Sin Stock / Agotado</option>
          </select>

          {/* Visibility Filter */}
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="bg-[#1b1b22] border border-zinc-700/80 text-xs text-zinc-300 rounded-xl px-3 py-2.5 outline-none focus:border-red-500 font-semibold"
          >
            <option value="ALL">Toda Visibilidad</option>
            <option value="ACTIVE">👁️ Activos (En Tienda)</option>
            <option value="HIDDEN">🙈 Ocultos (Desactivados)</option>
          </select>

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-[#1b1b22] border border-zinc-700/80 text-xs text-zinc-300 rounded-xl px-3 py-2.5 outline-none focus:border-red-500 font-semibold"
          >
            <option value="ALL">Todas las Zonas</option>
            <option value="Interior">Interior</option>
            <option value="Exterior">Exterior</option>
            <option value="Iluminación">Iluminación</option>
            <option value="Rendimiento">Rendimiento</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#141418] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold uppercase tracking-wider">Cargando catálogo...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-300">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold text-zinc-300">No se encontraron artículos</p>
            <p className="text-xs text-zinc-500 mt-1">Prueba cambiando los filtros o crea un nuevo producto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#191920] border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Precio (USD)</th>
                  <th className="py-3.5 px-4">Colores / Variantes</th>
                  <th className="py-3.5 px-4">Disponibilidad (Stock)</th>
                  <th className="py-3.5 px-4 text-center">Visibilidad</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {filteredProducts.map((product) => {
                  const colorsCount = product.colors?.length || 0;

                  return (
                    <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Producto: Imagen + Nombre + SKU + Categoría */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || '/images/products/placeholder.png'}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                            }}
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/products/${product.id}`}
                              className="font-bold text-zinc-100 hover:text-red-400 transition-colors block truncate max-w-xs md:max-w-sm"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                              <span className="font-mono text-zinc-400">{product.id}</span>
                              <span>•</span>
                              <span>{product.category}</span>
                              <span>•</span>
                              <span className="text-zinc-400">{product.zone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Precio */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">
                        ${product.priceUSD.toFixed(2)}
                      </td>

                      {/* Colores / Variantes */}
                      <td className="py-3.5 px-4">
                        {colorsCount > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {product.colors?.slice(0, 4).map((c, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border border-zinc-700 shadow-sm flex items-center justify-center text-[9px]"
                                style={{ backgroundColor: c.hex || '#3f3f46' }}
                                title={`${c.name} (${c.images?.length || 0} fotos)`}
                              />
                            ))}
                            {colorsCount > 4 && (
                              <span className="text-[10px] text-zinc-400 font-bold">
                                +{colorsCount - 4}
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-400 ml-1">
                              ({colorsCount} {colorsCount === 1 ? 'color' : 'colores'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic flex items-center gap-1">
                            <Palette className="w-3 h-3 text-zinc-400" />
                            Sin variantes
                          </span>
                        )}
                      </td>

                      {/* Disponibilidad (Stock Dropdown Rápido) */}
                      <td className="py-3.5 px-4">
                        <select
                          value={product.stockStatus}
                          onChange={(e) =>
                            handleQuickStockChange(product, e.target.value as Product['stockStatus'])
                          }
                          className={`text-[11px] font-bold rounded-xl px-2.5 py-1.5 outline-none border transition-colors cursor-pointer ${
                            product.stockStatus === 'EN_STOCK'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-950/60'
                              : product.stockStatus === 'BAJO_PEDIDO'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-950/60'
                              : 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-950/60'
                          }`}
                        >
                          <option value="EN_STOCK" className="bg-[#141418] text-white">🟢 En Stock</option>
                          <option value="BAJO_PEDIDO" className="bg-[#141418] text-white">🟡 Bajo Pedido</option>
                          <option value="AGOTADO" className="bg-[#141418] text-white">🔴 Sin Stock</option>
                        </select>
                      </td>

                      {/* Visibilidad (Toggle Rápido) */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickVisibilityChange(product)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            product.isActive
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/80'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                          }`}
                          title="Hacer clic para activar u ocultar del catálogo"
                        >
                          {product.isActive ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>En Tienda</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Oculto</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver en tienda */}
                          <a
                            href={`${storeUrl}/producto/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 rounded-xl transition-colors"
                            title="Ver en Tienda Pública"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Editar */}
                          <Link
                            to={`/products/${product.id}`}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors"
                            title="Editar Producto y Colores"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Eliminar (Soft Delete) */}
                          <button
                            type="button"
                            onClick={() => setDeletingId(product.id)}
                            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold font-heading text-white">¿Eliminar artículo?</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              El producto será retirado del catálogo público y del panel administrativo mediante <strong>Borrado Suave</strong> (soft delete) para proteger el historial de cotizaciones previas.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? <span>Eliminando...</span> : <span>Confirmar Eliminación</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
