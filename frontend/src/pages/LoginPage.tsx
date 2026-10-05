import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // Check role and redirect accordingly
      if (data.user) {
        const ADMIN_EMAILS = ['admin@marryland.com'];
        const isAdmin =
          ADMIN_EMAILS.includes(data.user.email || '') ||
          data.user.user_metadata?.role === 'admin' ||
          data.user.app_metadata?.role === 'admin';

        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 font-sans text-tinta">
      <div className="w-full max-w-[420px] bg-white border border-garis rounded-panel p-8 sm:p-10 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="font-serif text-2xl tracking-tight mb-3 text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <div className="text-[10px] font-mono tracking-[0.2em] text-merah bg-kertas-tua/60 px-3 py-1 rounded-chip uppercase border border-garis">
            Untuk Fotografer
          </div>
        </div>

        {message && (
          <div className="bg-kertas-tua/40 border border-garis text-tinta p-3.5 rounded-chip text-xs mb-6 flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-merah" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{message}</span>
          </div>
        )}

        {/* Google Login */}
        <button 
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-garis rounded-btn py-2.5 px-4 text-sm font-sans font-medium text-tinta hover:bg-kertas-tua hover:border-tinta transition-colors duration-150 min-h-[44px] mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
          Masuk dengan Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-garis"></div>
          <div className="text-[10px] font-mono text-tinta-lembut tracking-widest uppercase">ATAU EMAIL</div>
          <div className="flex-1 h-px bg-garis"></div>
        </div>

        {error && (
          <div className="bg-merah/5 border border-merah/25 text-merah p-3.5 rounded-chip text-xs mb-6 flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input pr-16 focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
                placeholder="Masukkan kata sandi"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-merah font-sans font-medium hover:text-merah-hover min-h-[44px] px-2 flex items-center"
              >
                {showPassword ? 'Tutup' : 'Lihat'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-merah hover:bg-merah-hover active:bg-marun text-kertas text-sm font-sans font-medium rounded-btn transition-colors duration-150 min-h-[44px] disabled:opacity-50 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
          >
            {loading ? 'Sedang masuk...' : 'Masuk ke dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link to="/lupa-password" className="text-merah hover:text-merah-hover transition-colors font-medium">
            Lupa kata sandi?
          </Link>
        </div>
      </div>
      
      <div className="mt-6 text-center text-xs text-tinta-lembut">
        Belum punya akun?{' '}
        <Link to="/register" className="text-merah font-medium hover:text-merah-hover transition-colors">
          Daftar di sini
        </Link>
      </div>
    </div>
  );
}
