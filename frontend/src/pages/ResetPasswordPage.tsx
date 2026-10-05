import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import { APP_NAME } from '../config/constants';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // We check for type=recovery or simply if a session is established from the recovery link
      // A more robust way is using onAuthStateChange
      setIsRecoverySession(!!session);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoverySession(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Kata sandi harus minimal 8 karakter');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      toast.success(TOAST?.resetSuccess || 'Kata sandi berhasil diperbarui');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Update password error:', error.message);
      toast.error(TOAST?.resetFail || 'Gagal memperbarui kata sandi');
    } finally {
      setLoading(false);
    }
  };

  if (isRecoverySession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kertas">
        <div className="w-8 h-8 border-4 border-merah/30 border-t-merah rounded-full animate-spin" />
      </div>
    );
  }

  if (!isRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kertas px-4 font-sans text-tinta">
        <div className="w-full max-w-md bg-white rounded-panel border border-garis p-8 text-center">
          <h2 className="font-serif text-xl font-normal text-tinta mb-3">Tautan Tidak Valid</h2>
          <p className="text-xs text-tinta-lembut mb-6 leading-relaxed">
            Tautan atur ulang kata sandi ini tidak valid atau sudah kedaluwarsa. Silakan ajukan permintaan baru.
          </p>
          <Link
            to="/lupa-password"
            className="inline-flex w-full py-2.5 px-4 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-sm font-sans font-medium transition-colors duration-150 justify-center items-center min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
          >
            Minta tautan baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kertas px-4 py-12 font-sans text-tinta">
      <div className="w-full max-w-md bg-white rounded-panel border border-garis p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block font-serif text-2xl tracking-tight mb-2 text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <h1 className="font-serif text-2xl font-normal text-tinta mb-1">Atur Ulang Kata Sandi</h1>
          <p className="text-xs text-tinta-lembut mt-1">
            Buat kata sandi baru untuk akun fotografermu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-input border border-garis bg-white text-tinta text-sm focus:border-merah focus:ring-1 focus:ring-merah outline-none transition-colors"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-input border border-garis bg-white text-tinta text-sm focus:border-merah focus:ring-1 focus:ring-merah outline-none transition-colors"
              placeholder="Ulangi kata sandi baru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-2.5 px-4 bg-merah hover:bg-merah-hover active:bg-marun text-kertas rounded-btn text-sm font-sans font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px] mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah focus-visible:ring-offset-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Simpan kata sandi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
