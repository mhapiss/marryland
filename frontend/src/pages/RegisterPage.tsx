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
    <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 font-sans text-tinta">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-11 h-11 border border-garis rounded-btn hover:border-tinta hover:bg-kertas-tua text-tinta hover:text-merah transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
            aria-label="Kembali"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <Link to="/" className="font-serif text-2xl tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <div className="w-9"></div>
        </div>
        
        <p className="text-xs font-mono uppercase tracking-widest text-merah mb-2 text-center">Registrasi Akun</p>
        <h1 className="font-serif text-3xl md:text-4xl font-normal mb-3 text-center text-tinta">
          Pilih tipe akun kamu
        </h1>
        <p className="text-tinta-lembut text-center mb-10 max-w-lg text-sm">
          Platform kurasi dan seleksi foto digital terstruktur untuk alur kerja fotografer dan kenyamanan klien.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div 
            onClick={() => navigate('/register?type=photographer')}
            className="bg-white border border-garis rounded-[2px] p-8 cursor-pointer flex flex-col items-center text-center group hover:border-merah transition-all duration-200"
          >
            <div className="w-16 h-16 bg-kertas-tua/60 border border-garis rounded-[2px] flex items-center justify-center mb-6 group-hover:bg-merah group-hover:border-merah transition-all duration-200">
              <svg className="w-8 h-8 text-merah group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <h2 className="font-serif text-xl font-normal mb-2 text-tinta group-hover:text-merah transition-colors">Untuk Fotografer & Studio</h2>
            <p className="text-tinta-lembut text-xs leading-relaxed">Buat galeri seleksi dari Google Drive, atur batas kuota & tenggat, dan ekspor nama file langsung ke Lightroom.</p>
          </div>

          <div 
            onClick={() => navigate('/register?type=family')}
            className="bg-white border border-garis rounded-[2px] p-8 cursor-pointer flex flex-col items-center text-center group hover:border-merah transition-all duration-200"
          >
            <div className="w-16 h-16 bg-kertas-tua/60 border border-garis rounded-[2px] flex items-center justify-center mb-6 group-hover:bg-merah group-hover:border-merah transition-all duration-200">
              <svg className="w-8 h-8 text-merah group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <h2 className="font-serif text-xl font-normal mb-2 text-tinta group-hover:text-merah transition-colors">Untuk Klien & Keluarga</h2>
            <p className="text-tinta-lembut text-xs leading-relaxed">Klien tidak perlu mendaftar untuk memilih foto. Cukup buka tautan galeri privat yang dikirimkan oleh fotografermu.</p>
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
      setError('Kata sandi konfirmasi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
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
      
      if (data.session) {
        navigate('/dashboard');
      } else {
        navigate('/login?message=Cek email kamu untuk verifikasi akun.');
      }
      
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kertas flex flex-col items-center justify-center p-6 font-sans text-tinta">
      <div className="w-full max-w-[440px] bg-white border border-garis rounded-panel p-8 sm:p-10 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-full flex justify-between items-center mb-6">
            <button 
              onClick={() => navigate('/register')} 
              className="w-10 h-10 border border-garis rounded-btn hover:border-tinta hover:bg-kertas-tua text-tinta hover:text-merah transition-colors duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
              aria-label="Kembali"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <Link to="/" className="font-serif text-xl tracking-tight text-tinta">by.<span className="text-merah">marryland</span></Link>
            <div className="w-7"></div>
          </div>
          
          <div className="text-[10px] font-mono tracking-[0.2em] text-merah bg-kertas-tua/60 px-3 py-1 rounded-chip uppercase mb-3 border border-garis">
            Untuk Fotografer
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-center text-tinta">Buat Akun Studio</h1>
        </div>

        {/* Google Login */}
        <button 
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-garis rounded-btn py-2.5 px-4 text-sm font-sans font-medium text-tinta hover:bg-kertas-tua hover:border-tinta transition-colors duration-150 min-h-[44px] mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
          Daftar dengan Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-garis"></div>
          <div className="text-[10px] font-mono text-tinta-lembut tracking-widest uppercase">ATAU DENGAN EMAIL</div>
          <div className="flex-1 h-px bg-garis"></div>
        </div>

        {error && (
          <div className="bg-merah/5 border border-merah/25 text-merah p-3.5 rounded-chip text-xs mb-6 flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Nama Lengkap / Studio</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              placeholder="Nama kamu atau nama studio"
            />
          </div>

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
                placeholder="Buat kata sandi"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-merah font-sans font-medium hover:text-merah-hover min-h-[44px] px-2 flex items-center"
              >
                {showPassword ? 'Tutup' : 'Lihat'}
              </button>
            </div>
            <p className="text-[11px] text-tinta-lembut mt-1">Minimal 6 karakter.</p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Ulangi Kata Sandi</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
              placeholder="Ketik ulang kata sandi"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-merah hover:bg-merah-hover active:bg-marun text-kertas text-sm font-sans font-medium rounded-btn transition-colors duration-150 min-h-[44px] disabled:opacity-50 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
          >
            {loading ? 'Mendaftar...' : 'Buat akun sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-tinta-lembut">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-merah font-medium hover:text-merah-hover transition-colors">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
