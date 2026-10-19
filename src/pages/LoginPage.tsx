import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/products';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e11] text-zinc-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 text-white font-black text-2xl shadow-2xl shadow-red-600/40 mb-4 transform hover:scale-105 transition-transform font-heading">
            UT
          </div>
          <h1 className="text-2xl font-black tracking-wide font-heading uppercase text-white">
            UltraTuning Admin
          </h1>
          <p className="text-xs text-red-500 font-bold uppercase tracking-widest mt-1">
            Gestión Directa de Catálogo & Stock
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

          <div className="flex items-center gap-2 mb-2 text-zinc-200">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold font-heading">Acceso Administrativo</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-6">
            Inicia sesión con tu cuenta para administrar productos, visibilidad y variantes de color.
          </p>

          {!isSupabaseConfigured && (
            <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] leading-relaxed">
              💡 <strong>Aviso de Configuración:</strong> Las variables de Supabase aún no están configuradas en <code>.env</code>. Puedes ingresar con cualquier correo y contraseña de 6+ caracteres para probar el dashboard en modo demostración.
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ultratuning.ve"
                  className="w-full bg-[#1b1b22] border border-zinc-700/80 focus:border-red-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1b1b22] border border-zinc-700/80 focus:border-red-500 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-red-950/50 hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Validando acceso...</span>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a
            href={import.meta.env.VITE_STORE_URL || 'https://ultratuning.ve'}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
          >
            ← Volver a la Tienda UltraTuning
          </a>
        </div>
      </div>
    </div>
  );
};
