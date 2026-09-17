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
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans text-text">
      <div className="w-full max-w-[420px] card p-10 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="font-serif text-2xl font-bold mb-4">
            by.<span className="text-primary">marryland</span>
          </Link>
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-50 px-3 py-1 rounded-full uppercase border border-primary-100">
            FOR PHOTOGRAPHERS
          </div>
        </div>

        {message && (
          <div className="bg-primary-50 border border-primary-100 text-primary-700 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{message}</span>
          </div>
        )}

        {/* Google Login (Disabled temporarily for MVP) */}
        {/* <button 
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow mb-8"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Masuk dengan Google
        </button> */}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="text-[10px] font-bold text-muted tracking-widest uppercase">ATAU EMAIL</div>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="label">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-16"
                placeholder="Masukkan password kamu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-primary font-medium hover:text-primary-600"
              >
                {showPassword ? 'Tutup' : 'Lihat'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <a href="#" className="text-muted hover:text-text transition-colors">
            Lupa password?
          </a>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted">
        Belum punya akun?{' '}
        <Link to="/register" className="text-primary font-semibold hover:text-primary-600 transition-colors">
          Daftar di sini
        </Link>
      </div>
    </div>
  );
}
