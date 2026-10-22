import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Trash2,
  X,
  Palette,
  ExternalLink,
  Layers,
  Info,
  Clock,
  Sliders,
  AlertCircle
} from 'lucide-react';
import type { Product, ProductColor } from '../types/product';
import { fetchProductById, saveProduct, uploadProductImage, STORE_URL } from '../lib/supabase';

const CATEGORIES = [
  'Estética Exterior',
  'Estética Interior',
  'Iluminación LED',
  'Rendimiento',
  'Audio & Confort',
  'Seguridad & Accesorios',
];

const ZONES = ['Interior', 'Exterior', 'Iluminación', 'Rendimiento'] as const;

const QUICK_TUNING_PALETTE = [
  { name: 'Rojo Racing', hex: '#DC2626' },
  { name: 'Azul Anodizado', hex: '#2563EB' },
  { name: 'Negro Mate', hex: '#18181B' },
  { name: 'Plata / Cromo', hex: '#E4E4E7' },
  { name: 'Púrpura Tuning', hex: '#9333EA' },
  { name: 'Dorado Metálico', hex: '#EAB308' },
  { name: 'Verde Lima', hex: '#84CC16' },
  { name: 'Blanco', hex: '#FFFFFF' },
];

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priceUSD, setPriceUSD] = useState<number>(0);
  const [zone, setZone] = useState<typeof ZONES[number]>('Exterior');
  const [leadTime, setLeadTime] = useState('Despachamos en 24-48h en Venezuela (MRW, Zoom y Tealca).');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [stockStatus, setStockStatus] = useState<Product['stockStatus']>('EN_STOCK');
  const [tags, setTags] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [generalImages, setGeneralImages] = useState<string[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [specs, setSpecs] = useState<Array<{ key: string; val: string }>>([]);

  // Uploading states
  const [isUploadingGeneral, setIsUploadingGeneral] = useState(false);
  const [uploadingColorIdx, setUploadingColorIdx] = useState<number | null>(null);

  const generalFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchProductById(id)
        .then((prod) => {
          if (!prod) {
            setError(`No se encontró el producto con SKU "${id}"`);
            return;
          }
          setSku(prod.id);
          setName(prod.name);
          setCategory(prod.category);
          setPriceUSD(prod.priceUSD);
          setZone(prod.zone);
          setLeadTime(prod.leadTime || '');
          setDescription(prod.description);
          setFeatured(prod.featured);
          setIsActive(prod.isActive);
          setStockStatus(prod.stockStatus);
          setTags(prod.tags?.join(', ') || '');
          setMainImageUrl(prod.image);
          setGeneralImages(prod.images || [prod.image]);
          setColors(prod.colors || []);

          const specEntries = Object.entries(prod.specifications || {}).map(([key, val]) => ({
            key,
            val,
          }));
          setSpecs(specEntries.length > 0 ? specEntries : [{ key: 'Material', val: '' }]);
        })
        .catch((err) => {
          setError(err?.message || 'Error cargando datos del producto');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Default specs template
      setSpecs([
        { key: 'Material', val: '' },
        { key: 'Instalación', val: 'Plug & play' },
        { key: 'Compatibilidad', val: 'Universal' },
      ]);
    }
  }, [id, isEdit]);

  // General Image Upload
  const handleUploadGeneral = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingGeneral(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadProductImage(files[i]);
        uploadedUrls.push(url);
      }
      setGeneralImages((prev) => [...prev, ...uploadedUrls]);
      if (!mainImageUrl && uploadedUrls.length > 0) {
        setMainImageUrl(uploadedUrls[0]);
      }
      showToast(`${uploadedUrls.length} imagen(es) subida(s)`);
    } catch (err: any) {
      alert(err?.message || 'Error al subir imagen');
    } finally {
      setIsUploadingGeneral(false);
    }
  };

  // Color Image Upload
  const handleUploadColorImage = async (colorIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingColorIdx(colorIdx);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadProductImage(files[i]);
        uploadedUrls.push(url);
      }
      setColors((prev) => {
        const copy = [...prev];
        const target = copy[colorIdx];
        if (target) {
          target.images = [...(target.images || []), ...uploadedUrls];
        }
        return copy;
      });
      showToast(`${uploadedUrls.length} foto(s) asignadas al color`);
    } catch (err: any) {
      alert(err?.message || 'Error al subir fotos para el color');
    } finally {
      setUploadingColorIdx(null);
    }
  };

  // Add Color Block
  const addColorBlock = () => {
    setColors((prev) => [
      ...prev,
      {
        name: '',
        hex: '#DC2626',
        images: [],
      },
    ]);
  };

  // Remove Color Block
  const removeColorBlock = (colorIdx: number) => {
    setColors((prev) => prev.filter((_, idx) => idx !== colorIdx));
  };

  // Update Color Field
  const updateColorField = (colorIdx: number, field: 'name' | 'hex', value: string) => {
    setColors((prev) => {
      const copy = [...prev];
      if (copy[colorIdx]) {
        copy[colorIdx] = { ...copy[colorIdx], [field]: value };
      }
      return copy;
    });
  };

  // Remove Photo from Color
  const removePhotoFromColor = (colorIdx: number, photoUrl: string) => {
    setColors((prev) => {
      const copy = [...prev];
      if (copy[colorIdx]) {
        copy[colorIdx].images = copy[colorIdx].images.filter((img) => img !== photoUrl);
      }
      return copy;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      alert('El SKU / ID es obligatorio');
      return;
    }
    if (!name.trim()) {
      alert('El nombre del producto es obligatorio');
      return;
    }
    if (priceUSD < 0) {
      alert('El precio no puede ser negativo');
      return;
    }

    // Determinar imagen principal
    let primaryImg = mainImageUrl;
    if (!primaryImg && generalImages.length > 0) {
      primaryImg = generalImages[0];
    }
    if (!primaryImg && colors.length > 0 && colors[0].images.length > 0) {
      primaryImg = colors[0].images[0];
    }
    if (!primaryImg) {
      alert('Debes agregar al menos una imagen general o en las variantes de color');
      return;
    }

    // Consolidar especificaciones
    const specRecord: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        specRecord[s.key.trim()] = s.val.trim();
      }
    });

    const productPayload: Product = {
      id: sku.trim(),
      name: name.trim(),
      category,
      priceUSD: Number(priceUSD),
      image: primaryImg,
      images: generalImages.length > 0 ? generalImages : [primaryImg],
      colors: colors.filter((c) => c.name.trim().length > 0),
      description: description.trim(),
      featured,
      inStock: stockStatus === 'EN_STOCK',
      stockStatus,
      isActive,
      leadTime: leadTime.trim() || undefined,
      zone,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      specifications: specRecord,
      compatibility: [{ make: 'Universal', model: 'Todos', years: 'Todos' }],
    };

    setSaving(true);
    setError(null);
    try {
      await saveProduct(productPayload, isEdit);
      showToast(isEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      setTimeout(() => {
        navigate('/products');
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Error guardando producto');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider">Cargando ficha del producto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-950 text-emerald-200 border border-emerald-800 text-xs font-bold shadow-2xl flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors"
            title="Volver al catálogo"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white uppercase font-heading tracking-wide">
              {isEdit ? `Editar: ${name}` : 'Crear Nuevo Artículo'}
            </h1>
            <p className="text-xs text-zinc-400">
              {isEdit
                ? `SKU: ${sku} — Configura visibilidad, disponibilidad y fotos por color.`
                : 'Completa los datos técnicos y variantes para publicar en UltraTuning.'}
            </p>
          </div>
        </div>

        {isEdit && (
          <a
            href={`${STORE_URL}/producto/${sku}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Ver en Tienda</span>
          </a>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BLOQUE 1: VISIBILIDAD, STOCK Y DISPONIBILIDAD */}
        <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-500" />
              <span>1. Estado, Visibilidad y Disponibilidad</span>
            </h2>
            <span className="text-[11px] text-zinc-500 font-semibold">* Requerido</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Visibilidad Pública */}
            <div className="p-4 rounded-2xl bg-[#1b1b22] border border-zinc-700/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-zinc-300 block mb-1">Visibilidad en Tienda</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                  Activa o desactiva este artículo del catálogo público sin borrarlo.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-zinc-200">
                  {isActive ? '🟢 Visible en Tienda' : '🙈 Oculto de Tienda'}
                </span>
              </label>
            </div>

            {/* Estado de Stock / Disponibilidad */}
            <div className="p-4 rounded-2xl bg-[#1b1b22] border border-zinc-700/80 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-300 block mb-1">
                  Disponibilidad de Inventario
                </label>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                  Define si está disponible para despacho inmediato, bajo pedido o agotado.
                </p>
              </div>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as Product['stockStatus'])}
                className="w-full bg-[#141418] border border-zinc-700 text-xs font-bold rounded-xl px-3 py-2.5 text-zinc-100 outline-none focus:border-red-500"
              >
                <option value="EN_STOCK">🟢 En Stock (Inmediato)</option>
                <option value="BAJO_PEDIDO">🟡 Bajo Pedido (Por encargo)</option>
                <option value="AGOTADO">🔴 Sin Stock (Agotado)</option>
              </select>
            </div>

            {/* Destacado */}
            <div className="p-4 rounded-2xl bg-[#1b1b22] border border-zinc-700/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-zinc-300 block mb-1">Producto Destacado</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                  Muestra este producto en la sección principal "Destacados" de la portada.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-3 text-xs font-bold text-zinc-200">
                  {featured ? '⭐ Destacado' : 'Estándar'}
                </span>
              </label>
            </div>
          </div>

          {/* Tiempo de entrega / Despacho */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Tiempo de Entrega / Despacho</span>
            </label>
            <input
              type="text"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              placeholder="Ej: Despachamos en 24-48h en Venezuela (MRW, Zoom y Tealca) o Bajo encargo 10-15 días."
              className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* BLOQUE 2: INFORMACIÓN GENERAL Y PRECIO */}
        <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-red-500" />
              <span>2. Información General y Precios</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* SKU / ID */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Código SKU / ID Único *
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: prod-020 o UT-POMO-01"
                className={`w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-zinc-500 outline-none focus:border-red-500 ${
                  isEdit ? 'opacity-60 cursor-not-allowed bg-zinc-900' : ''
                }`}
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Nombre del Artículo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Pomo de Palanca Tuning Corto — Aleación CNC"
                className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
              />
            </div>

            {/* Precio en USD */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Precio en Dólares (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={priceUSD}
                  onChange={(e) => setPriceUSD(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl pl-8 pr-4 py-2.5 text-xs text-white font-mono placeholder-zinc-500 outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Categoría *
              </label>
              <input
                type="text"
                required
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Selecciona o escribe una categoría"
                className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
              />
              <datalist id="category-suggestions">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Zona */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Zona del Vehículo *
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as typeof ZONES[number])}
                className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-zinc-200 outline-none focus:border-red-500"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                Etiquetas / Tags (separados por coma)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tuning, deportivo, universal, aluminio, jdm"
                className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
              Descripción del Producto *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica los materiales, compatibilidad, acabado visual y beneficios de este accesorio..."
              className="w-full bg-[#1b1b22] border border-zinc-700/80 rounded-2xl p-4 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* BLOQUE 3: FOTOS GENERALES DEL PRODUCTO */}
        <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-red-500" />
              <span>3. Fotos Generales del Artículo</span>
            </h2>
            <span className="text-[11px] text-zinc-500">JPG, PNG, WEBP (Hasta 5MB)</span>
          </div>

          {/* Drag & Drop General */}
          <div
            onClick={() => generalFileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleUploadGeneral(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-zinc-700/80 hover:border-red-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-[#191920]/40 hover:bg-zinc-900/60 flex flex-col items-center justify-center gap-3"
          >
            <input
              ref={generalFileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadGeneral(e.target.files)}
            />
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-200 block">
                {isUploadingGeneral ? 'Subiendo imágenes a Supabase Storage...' : 'Haz clic o arrastra fotos generales aquí'}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                Fotos del producto completo, empaque o vistas generales.
              </span>
            </div>
          </div>

          {/* Grid de Fotos Generales */}
          {generalImages.length > 0 && (
            <div>
              <span className="block text-xs font-bold uppercase text-zinc-400 mb-3">
                Fotos Cargadas ({generalImages.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {generalImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`relative group rounded-2xl overflow-hidden border aspect-square bg-zinc-900 ${
                      mainImageUrl === imgUrl ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-800'
                    }`}
                  >
                    <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                      <button
                        type="button"
                        onClick={() => setMainImageUrl(imgUrl)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold ${
                          mainImageUrl === imgUrl
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-zinc-200 hover:text-amber-400'
                        }`}
                        title="Establecer como foto principal"
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = generalImages.filter((_, i) => i !== idx);
                          setGeneralImages(updated);
                          if (mainImageUrl === imgUrl) {
                            setMainImageUrl(updated[0] || '');
                          }
                        }}
                        className="p-1.5 bg-rose-950 text-rose-300 hover:text-white rounded-lg text-[10px]"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BLOQUE 4: FOTOS VINCULADAS POR BLOQUES DE COLOR */}
        <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Palette className="w-4 h-4 text-red-500" />
                <span>4. Variantes de Color y Fotos Vinculadas</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Crea cada color disponible y sube las fotos correspondientes a esa variante.
              </p>
            </div>

            <button
              type="button"
              onClick={addColorBlock}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Agregar Color</span>
            </button>
          </div>

          {colors.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-800 bg-[#191920]/30 text-zinc-500">
              <Palette className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
              <p className="text-xs font-bold text-zinc-300">Este producto aún no tiene variantes de color</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                Si este accesorio se ofrece en varios acabados (ej. Pomos en Rojo, Azul, Negro), haz clic en <strong>"Agregar Color"</strong> para subir fotos dedicadas a cada uno.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {colors.map((color, colorIdx) => (
                <div
                  key={colorIdx}
                  className="bg-[#191920]/80 border border-zinc-700/80 rounded-3xl p-5 md:p-6 space-y-4 relative"
                >
                  {/* Top Bar del Color: Nombre, Selector Hex y Borrar Color */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Color Picker HTML5 */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hex || '#DC2626'}
                          onChange={(e) => updateColorField(colorIdx, 'hex', e.target.value)}
                          className="w-9 h-9 rounded-xl border border-zinc-700 bg-transparent cursor-pointer p-0.5"
                          title="Elegir muestra de color"
                        />
                        <span className="text-[11px] font-mono text-zinc-400">
                          {color.hex || '#------'}
                        </span>
                      </div>

                      {/* Nombre del Color */}
                      <input
                        type="text"
                        required
                        value={color.name}
                        onChange={(e) => updateColorField(colorIdx, 'name', e.target.value)}
                        placeholder="Nombre del color (Ej: Rojo Racing, Negro Mate)"
                        className="bg-[#141418] border border-zinc-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 font-bold min-w-[220px]"
                      />

                      {/* Paleta rápida tuning */}
                      <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-zinc-800">
                        {QUICK_TUNING_PALETTE.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              updateColorField(colorIdx, 'name', p.name);
                              updateColorField(colorIdx, 'hex', p.hex);
                            }}
                            className="w-5 h-5 rounded-full border border-zinc-700 hover:scale-125 transition-transform"
                            style={{ backgroundColor: p.hex }}
                            title={`Seleccionar ${p.name}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Eliminar Color Block */}
                    <button
                      type="button"
                      onClick={() => removeColorBlock(colorIdx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-800/60 hover:bg-rose-950/40 rounded-xl transition-colors self-end sm:self-auto cursor-pointer"
                      title="Eliminar este color"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dropzone de fotos para este color */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleUploadColorImage(colorIdx, e.dataTransfer.files);
                    }}
                    className="border-2 border-dashed border-zinc-700/60 hover:border-red-500/80 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-[#141418]/60 hover:bg-[#141418] flex flex-col items-center justify-center gap-2"
                  >
                    <label className="cursor-pointer w-full flex flex-col items-center justify-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUploadColorImage(colorIdx, e.target.files)}
                      />
                      <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                      <span className="text-xs font-bold text-zinc-300">
                        {uploadingColorIdx === colorIdx
                          ? 'Subiendo fotos para este color...'
                          : `Subir o arrastrar fotos del color "${color.name || 'sin nombre'}"`}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        Estas fotos se mostrarán en la tienda cuando el cliente elija este color.
                      </span>
                    </label>
                  </div>

                  {/* Grid de Fotos de este Color */}
                  {color.images && color.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-2">
                      {color.images.map((imgUrl, photoIdx) => (
                        <div
                          key={photoIdx}
                          className="relative group rounded-xl overflow-hidden border border-zinc-800 aspect-square bg-zinc-950"
                        >
                          <img src={imgUrl} alt={`Foto ${photoIdx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                            <button
                              type="button"
                              onClick={() => removePhotoFromColor(colorIdx, imgUrl)}
                              className="p-1 bg-rose-950 text-rose-300 hover:text-white rounded-lg text-[10px]"
                              title="Quitar foto de este color"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BLOQUE 5: ESPECIFICACIONES TÉCNICAS (FICHA) */}
        <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <span>5. Ficha de Especificaciones Técnicas</span>
            </h2>
            <button
              type="button"
              onClick={() => setSpecs((prev) => [...prev, { key: '', val: '' }])}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Fila</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {specs.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ej: Material"
                  value={item.key}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].key = e.target.value;
                    setSpecs(copy);
                  }}
                  className="w-1/3 bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="Ej: Aleación de aluminio mecanizado CNC"
                  value={item.val}
                  onChange={(e) => {
                    const copy = [...specs];
                    copy[idx].val = e.target.value;
                    setSpecs(copy);
                  }}
                  className="flex-1 bg-[#1b1b22] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2 text-zinc-500 hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <Link
            to="/products"
            className="px-5 py-3 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-red-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : isEdit ? 'Actualizar Producto' : 'Publicar Producto'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
