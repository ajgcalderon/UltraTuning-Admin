import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, PlusCircle, ExternalLink, LogOut, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const storeUrl = import.meta.env.VITE_STORE_URL || 'https://ultratuning.ve';

  const isProductsActive = location.pathname === '/' || location.pathname.startsWith('/products');

  return (
    <div className="min-h-screen bg-[#0e0e11] text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#141418]/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform font-heading">
                UT
              </div>
              <div>
                <span className="font-heading font-black text-lg tracking-wider text-white uppercase block leading-none">
                  UltraTuning
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 block mt-0.5">
                  Admin Dashboard
                </span>
              </div>
            </Link>

            {/* Main Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-zinc-800">
              <Link
                to="/products"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isProductsActive
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Package className="w-4 h-4 text-red-500" />
                <span>Productos & Variantes</span>
              </Link>

              <Link
                to="/products/new"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-amber-500" />
                <span>Crear Producto</span>
              </Link>
            </nav>
          </div>

          {/* Right Section: DB Status, Tienda Link, User & Logout */}
          <div className="flex items-center gap-3">
            {/* DB Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-400">
              <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isSupabaseConfigured ? 'Supabase DB' : 'Modo Demo / Local'}</span>
            </div>

            {/* Ver Tienda Link */}
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              title="Ir a la tienda pública"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>

            {/* User Info */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-bold text-zinc-200 truncate max-w-[150px]">
                  {user?.email || 'Administrador'}
                </span>
                <span className="block text-[10px] text-zinc-400 flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Dueño</span>
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut()}
                className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/50 rounded-xl transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#141418]/60 py-4 text-center text-xs text-zinc-400">
        <p>UltraTuning.ve © {new Date().getFullYear()} — Panel de Control Administrativo</p>
      </footer>
    </div>
  );
};
