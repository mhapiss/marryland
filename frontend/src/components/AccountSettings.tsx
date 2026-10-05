import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { TOAST } from '../constants/toastMessages';
import { useFocusTrap } from '../hooks/useFocusTrap';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const passwordModalRef = useRef<HTMLDivElement>(null);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Change password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useFocusTrap(showPasswordModal, passwordModalRef, {
    onEscape: () => setShowPasswordModal(false),
    returnFocus: true,
  });

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setEmailLoading(true);

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);

    if (error) {
      toast.error('Gagal memperbarui email: ' + error.message);
    } else {
      toast.success('Link konfirmasi telah dikirim ke email baru. Email lama tetap aktif sampai dikonfirmasi.');
      setNewEmail('');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error(TOAST.resetPasswordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(TOAST.resetPasswordMismatch);
      return;
    }

    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      toast.error('Gagal memperbarui password: ' + error.message);
    } else {
      toast.success('Password berhasil diubah!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 1500);
    }
  };

  return (
    <>
      <div className="bg-white border border-garis rounded-panel p-8 font-sans text-tinta">
        <div className="mb-8">
          <h2 className="font-serif text-2xl font-normal text-tinta">Keamanan Akun</h2>
          <p className="text-tinta-lembut text-xs mt-1">Kelola email masuk dan ubah kata sandi kamu.</p>
        </div>

        <div className="space-y-6">
          {/* Current email */}
          <div className="p-4 bg-kertas rounded-input border border-garis">
            <p className="text-[10px] font-mono uppercase tracking-widest text-tinta-lembut mb-1">Email Terdaftar</p>
            <p className="text-sm font-medium text-tinta flex items-center gap-2 font-mono">
              <svg className="w-4 h-4 text-merah" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              {user?.email}
            </p>
          </div>

          {/* Change email */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-3">Ubah Alamat Email</h3>
            <form onSubmit={handleChangeEmail}>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="email-baru@contoh.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
                />
                <button
                  type="submit"
                  disabled={emailLoading || !newEmail}
                  className="px-6 py-2.5 bg-merah hover:bg-merah-hover text-white text-xs font-sans font-medium rounded-btn min-h-[44px] transition-colors disabled:opacity-50"
                >
                  {emailLoading ? 'Menyimpan...' : 'Ganti Email'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-tinta-lembut font-mono">
                Tautan konfirmasi akan dikirim ke email baru. Email lama tetap aktif sampai diverifikasi.
              </p>
            </form>
          </div>

          <div className="border-b border-garis my-6"></div>

          {/* Change password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1">Kata Sandi Akun</label>
            <p className="text-[11px] text-tinta-lembut mb-3">Jaga keamanan akun studio kamu dengan kata sandi yang kuat.</p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-6 py-2.5 border border-garis hover:border-merah text-tinta hover:text-merah text-xs font-sans font-medium rounded-btn min-h-[44px] transition-colors"
            >
              Ubah Kata Sandi
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div ref={passwordModalRef} className="relative bg-white rounded-panel border border-garis shadow-xl p-8 w-full max-w-sm font-sans text-tinta animate-slide-up" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
            <div className="flex items-center justify-between mb-6">
              <h3 id="password-modal-title" className="font-serif text-xl font-normal text-tinta">Ubah Kata Sandi</h3>
              <button onClick={() => setShowPasswordModal(false)} aria-label="Tutup dialog ubah kata sandi" className="p-2 text-tinta-lembut hover:text-merah transition-colors rounded-btn min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tinta">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-tinta-lembut mb-1.5">Ulangi Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-garis text-tinta text-sm rounded-input focus:outline-none focus:border-merah focus:ring-1 focus:ring-merah transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-garis">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 px-3 border border-garis rounded-btn text-xs font-sans font-medium text-tinta hover:border-merah hover:text-merah transition-colors min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2.5 px-3 bg-merah hover:bg-merah-hover text-white text-xs font-sans font-medium rounded-btn transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {passwordLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountSettings;
