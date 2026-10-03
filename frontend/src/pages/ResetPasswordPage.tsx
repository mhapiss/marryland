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

      toast.success(TOAST?.passwordUpdated || 'Kata sandi berhasil diperbarui');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      console.error('Update password error:', error.message);
      toast.error(TOAST?.passwordUpdateFail || 'Gagal memperbarui kata sandi');
    } finally {
      setLoading(false);
    }
  };

  if (isRecoverySession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
          <h2 className="text-xl font-bold text-text mb-4">Link Tidak Valid</h2>
          <p className="text-muted mb-6">
            Link reset kata sandi tidak valid atau sudah kedaluwarsa.
          </p>
          <Link
            to="/lupa-password"
            className="inline-flex w-full py-2.5 px-4 bg-primary hover:bg-primary-600 text-white rounded-lg font-medium transition-colors justify-center"
          >
            Minta Link Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">{APP_NAME}</h1>
          <h2 className="text-xl font-semibold text-text">Reset Kata Sandi</h2>
          <p className="text-sm text-muted mt-2">
            Masukkan kata sandi baru untuk akunmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              placeholder="Ulangi kata sandi baru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Simpan Kata Sandi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
