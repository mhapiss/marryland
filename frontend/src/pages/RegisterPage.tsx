import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  if (!type) {
    return <RegisterTypeSelection />;
  }

  if (type === 'photographer') {
    return <PhotographerRegistration />;
  }

  return <RegisterTypeSelection />;
};

const RegisterTypeSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans text-text">
      <div className="w-full max-w-4xl flex flex-col items-center animate-fade-in">
        <div className="w-full flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 hover:bg-black/5 rounded-full transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight">
            by.<span className="text-primary">marryland</span>
          </Link>
          <div className="w-11"></div> {/* Spacer */}
        </div>
        
        <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-center">
          Pilih tipe akun kamu
        </h1>
        <p className="text-muted text-center mb-12 max-w-lg">
          Platform yang dirancang khusus untuk mempermudah alur kerja fotografer dan menjaga kenangan klien.
        </p>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
          <div 
            onClick={() => navigate('/register?type=photographer')}
            className="card p-10 cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
              <svg className="w-10 h-10 text-primary group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <h2 className="font-serif text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Untuk Fotografer & Studio</h2>
            <p className="text-muted leading-relaxed">Buat galeri seleksi foto, kelola klien, dan bagikan album kenangan profesional dengan branding studio kamu.</p>
          </div>

          <div 
            onClick={() => navigate('/register?type=family')}
            className="card p-10 cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
              <svg className="w-10 h-10 text-primary group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <h2 className="font-serif text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Untuk Kenangan & Keluarga</h2>
            <p className="text-muted leading-relaxed">Simpan dan bagikan momen berharga dalam album digital yang indah, aman, dan mudah diakses kapan saja.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhotographerRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Password tidak sama.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            account_type: 'photographer'
          }
        }
      });

      if (error) throw error;
      
      navigate('/login?message=Cek email kamu untuk verifikasi akun.');
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 font-sans text-text">
      <div className="w-full max-w-[440px] mt-8 card p-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-full flex justify-between items-center mb-8">
            <button 
              onClick={() => navigate('/register')} 
              className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <Link to="/" className="font-serif text-xl font-bold">by.<span className="text-primary">marryland</span></Link>
            <div className="w-9"></div>
          </div>
          
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary bg-primary-50 px-3 py-1 rounded-full uppercase mb-4 border border-primary-100">
            FOR PHOTOGRAPHERS
          </div>
          <h1 className="font-serif text-3xl font-bold text-center">Buat Akun</h1>
        </div>

        <button 
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 px-4 font-medium hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow mb-8"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Daftar dengan Google
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="text-[10px] font-bold text-muted tracking-widest uppercase">ATAU DENGAN EMAIL</div>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Nama kamu"
            />
          </div>

          <div>
            <label className="label">Email</label>
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
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-16"
                placeholder="Buat password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-primary font-medium hover:text-primary-600"
              >
                {showPassword ? 'Tutup' : 'Lihat'}
              </button>
            </div>
            <p className="text-[11px] text-muted mt-2">Minimal 6 karakter.</p>
          </div>

          <div>
            <label className="label">Ulangi Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Ketik ulang password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? 'Mendaftar...' : 'Buat Akun Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-600 transition-colors">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
