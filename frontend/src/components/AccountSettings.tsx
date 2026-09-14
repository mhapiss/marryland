import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Change password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setEmailLoading(true);
    setEmailMsg('');

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);

    if (error) {
      setEmailMsg('Gagal: ' + error.message);
    } else {
      setEmailMsg('Link konfirmasi telah dikirim ke email baru. Email lama tetap aktif sampai dikonfirmasi.');
      setNewEmail('');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Password tidak cocok.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordMsg('Gagal: ' + error.message);
    } else {
      setPasswordMsg('Password berhasil diubah!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg('');
      }, 2000);
    }
  };

  return (
    <>
      <div className="card p-8">
        <h2 className="font-serif text-2xl font-bold text-text mb-8">Pengaturan Akun</h2>

        {/* Current email */}
        <div className="mb-8 p-5 bg-background rounded-xl border border-primary-100/30">
          <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Email Saat Ini</p>
          <p className="text-base font-medium text-text flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            {user?.email}
          </p>
        </div>

        {/* Change email */}
        <form onSubmit={handleChangeEmail} className="mb-8">
          <label className="label">Ganti Email</label>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="email-baru@contoh.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={emailLoading || !newEmail}
              className="btn-primary px-6"
            >
              {emailLoading ? 'Menyimpan...' : 'Ganti'}
            </button>
          </div>
          {emailMsg && (
            <p className={`mt-3 text-xs flex items-center gap-1.5 ${emailMsg.includes('Gagal') ? 'text-red-600' : 'text-green-600'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={emailMsg.includes('Gagal') ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}/></svg>
              {emailMsg}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted">
            Link konfirmasi akan dikirim ke email baru. Email lama tetap aktif sampai dikonfirmasi.
          </p>
        </form>

        <div className="h-px bg-primary-100/30 my-8"></div>

        {/* Change password */}
        <div>
          <label className="label">Password Akun</label>
          <p className="text-[11px] text-muted mb-4">Pastikan akun kamu aman dengan password yang kuat.</p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-outline px-8"
          >
            Ubah Password
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative card p-8 w-full max-w-sm animate-slide-up shadow-2xl border-primary-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-text">Ubah Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 text-muted hover:text-text rounded-full hover:bg-background transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-5">
              {passwordMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${passwordMsg.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  <span>{passwordMsg}</span>
                </div>
              )}
              
              <div>
                <label className="label">Password Baru</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Ulangi Password Baru</label>
                <input
                  type="password"
                  placeholder="Ketik ulang password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-primary-100/30">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 btn-outline"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 btn-primary"
                >
                  {passwordLoading ? '...' : 'Simpan'}
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
