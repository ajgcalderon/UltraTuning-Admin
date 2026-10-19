# UltraTuning Admin — Panel de Control y Gestión de Inventario

Dashboard administrativo independiente para el dueño de **UltraTuning.ve**, diseñado como una Single Page Application (SPA) moderna, rápida y reactiva, desplegable en el subdominio **`admin.ultratuning.ve`** y conectada directamente a la infraestructura de **Supabase** (PostgreSQL, Storage y Auth).

---

## 🚀 Tecnologías

- **Framework Core:** [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) con TypeScript.
- **Estilos y UI:** [Tailwind CSS v3](https://tailwindcss.com/) configurado con el tema visual oscuro oficial de UltraTuning (negro grafito, acentos rojo y ámbar).
- **Iconografía:** [Lucide React](https://lucide.dev/).
- **Enrutamiento:** [React Router v6](https://reactrouter.com/) con sistema de rutas protegidas (`<ProtectedRoute>`).
- **Base de Datos & Storage:** SDK oficial [@supabase/supabase-js](https://supabase.com/docs/reference/javascript).

---

## 🛠️ Funcionalidades Principales

### 1. Autenticación Segura (Supabase Auth)
- Pantalla de inicio de sesión (`/login`) con correo electrónico y contraseña.
- Gestión de sesión persistente con JWT y tokens de refresco en `localStorage`.
- Protección automática de rutas: redirección a `/login` si no hay sesión activa.
- Cierre de sesión seguro con un clic.
- **Modo Demostración / Fallback:** Si las variables de Supabase aún no están configuradas, permite el acceso en modo demo para pruebas visuales locales.

### 2. Gestión de Catálogo y Disponibilidad en Tiempo Real
- **Métricas KPI:** Conteo en vivo de *Total Items*, *En Stock*, *Bajo Pedido*, *Sin Stock (Agotados)* y *Ocultos*.
- **Búsqueda Instantánea:** Filtrado en tiempo real sin recarga por Nombre del producto, código SKU o Categoría.
- **Filtros Avanzados:** Por estado de inventario, visibilidad y zona del vehículo (*Interior*, *Exterior*, *Iluminación*, *Rendimiento*).
- **Acciones Rápidas en Fila:**
  - **Selector de Stock:** Cambia al instante entre `🟢 En Stock` (despacho 24-48h), `🟡 Bajo Pedido` (por encargo con tiempo de entrega estimado) y `🔴 Sin Stock` (agotado temporalmente).
  - **Interruptor de Visibilidad:** Muestra u oculta el artículo del catálogo público con un solo clic.
  - **Enlace directo a Tienda:** Abre la ficha pública del producto en una nueva pestaña.
  - **Borrado Suave (Soft Delete):** Marca el producto como `is_deleted = true`, retirándolo de la tienda pública y del panel sin destruir el histórico de cotizaciones pasadas.

### 3. Formulario Avanzado con Bloques por Color
- **Visibilidad y Disponibilidad:** Control de publicación, tiempo de entrega estimado (`lead_time`) y badge de producto destacado.
- **Datos Técnicos:** SKU único, Nombre, Precio en USD, Categoría, Zona, Etiquetas y Especificaciones clave-valor dinámicas.
- **Fotos Generales:** Zona Drag & Drop para subir fotografías generales del producto directamente al bucket `product-images` de Supabase Storage.
- **Bloques por Color (Variantes Visuales):**
  - Botón **"+ Agregar Color"** para añadir tantas variantes como ofrezca la pieza (ej. *Rojo Racing*, *Azul Anodizado*, *Negro Mate*, *Púrpura Tuning*).
  - Selector de color visual integrado (picker HTML5 + paleta rápida tuning).
  - **Dropzone dedicada por color:** Al soltar fotos en el bloque de un color específico, se suben a Supabase Storage y se vinculan exclusivamente a esa variante.
  - Gestión visual de miniaturas con botón de eliminación individual por foto.

---

## 📁 Estructura del Proyecto

```
UltraTuning-Admin/
├── public/
│   └── logo.svg                # Isotipo oficial UltraTuning
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Estructura principal, barra superior y navegación
│   │   └── ProtectedRoute.tsx  # Guardia de autenticación para rutas privadas
│   ├── context/
│   │   └── AuthContext.tsx     # Proveedor de sesión y métodos de login/logout
│   ├── lib/
│   │   └── supabase.ts         # Cliente Supabase, subida a Storage y métodos CRUD
│   ├── pages/
│   │   ├── LoginPage.tsx       # Pantalla de acceso para el dueño
│   │   ├── ProductsListPage.tsx# Listado con KPIs, filtros y toggles rápidos
│   │   └── ProductFormPage.tsx # Formulario con Bloques por Color y drag & drop
│   ├── types/
│   │   └── product.ts          # Interfaces TypeScript (Product, ProductColor, etc.)
│   ├── App.tsx                 # Enrutamiento React Router
│   ├── index.css               # Directivas Tailwind y estilos globales
│   ├── main.tsx                # Punto de entrada ReactDOM
│   └── vite-env.d.ts           # Tipos de variables de entorno
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## ⚙️ Configuración y Variables de Entorno

Copia el archivo `.env.example` como `.env`:

```bash
cp .env.example .env
```

Define los valores correspondientes a tu proyecto de Supabase y dominio de la tienda:

```env
# URL de la API de tu proyecto Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Llave pública anónima de Supabase (Anon Key)
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# URL de la tienda pública (para enlaces "Ver en Tienda")
VITE_STORE_URL=https://ultratuning.ve
```

---

## 💻 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local (puerto 5174)
npm run dev

# Compilar para producción (typecheck + bundle optimizado)
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## 🌐 Despliegue en Subdominio (`admin.ultratuning.ve`)

### Despliegue en Vercel
1. Conecta el repositorio `UltraTuning-Admin` en el panel de Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. En la sección **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STORE_URL`
6. En la pestaña **Domains**, añade el subdominio: `admin.ultratuning.ve`.
7. Configura en tu proveedor DNS un registro `CNAME` apuntando `admin` hacia `cname.vercel-dns.com`.

---

## 🔒 Seguridad & Políticas RLS

Todas las operaciones del dashboard respetan las políticas **Row Level Security (RLS)** de PostgreSQL en Supabase:
- Solo usuarios con sesión autenticada (`TO authenticated`) pueden ejecutar `INSERT`, `UPDATE` o `DELETE` sobre las tablas `products`, `product_colors` y `product_color_images`, y sobre los objetos en el bucket `product-images`.
- El catálogo público de la tienda solo lee registros que tengan `is_active = true AND is_deleted = false`.
