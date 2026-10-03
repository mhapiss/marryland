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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">{APP_NAME}</h1>
          <h2 className="text-xl font-semibold text-text">Lupa Kata Sandi</h2>
          <p className="text-sm text-muted mt-2">
            Masukkan email kamu untuk mendapatkan link reset kata sandi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="nama@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Kirim Link Reset'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary hover:text-primary-600 hover:underline">
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
