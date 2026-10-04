import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import { APP_NAME } from '../config/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success(TOAST?.resetEmailSent || 'Instruksi reset password telah dikirim ke email kamu, jika email tersebut terdaftar.');
      setEmail('');
    } catch (error: any) {
      console.error('Reset password error:', error.message);
      toast.error(TOAST?.resetEmailFail || 'Gagal mengirim email reset password. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-kertas px-4 py-12 font-sans text-tinta">
      <div className="w-full max-w-md bg-white rounded-[2px] border border-garis p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block font-serif text-2xl tracking-tight mb-2 text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <h1 className="font-serif text-2xl font-normal text-tinta mb-1">Lupa Kata Sandi</h1>
          <p className="text-xs text-tinta-lembut">
            Masukkan email terdaftar untuk menerima tautan pemulihan kata sandi akunmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[2px] border border-garis bg-white text-tinta text-sm focus:border-merah focus:ring-1 focus:ring-merah outline-none transition-colors"
              placeholder="nama@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-2.5 px-4 bg-merah hover:bg-merah-hover text-white rounded-[2px] text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Kirim Tautan Pemulihan'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-merah hover:text-merah-hover font-medium">
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
