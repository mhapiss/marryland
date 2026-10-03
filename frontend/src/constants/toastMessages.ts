export const TOAST = {
  // Clipboard
  copySuccess: 'Link tersalin.',
  copyFail: 'Link belum dapat disalin. Coba lagi atau salin manual dari kolom alamat.',
  // Gallery CRUD
  galleryCreateSuccess: 'Galeri berhasil dibuat.',
  galleryCreateFail: 'Gagal membuat galeri. Periksa koneksi dan coba lagi.',
  galleryDeleteSuccess: 'Galeri berhasil dihapus.',
  galleryDeleteFail: 'Gagal menghapus galeri. Coba lagi nanti.',
  // Selection
  limitReached: (max: number) => `Kamu sudah mencapai batas maksimal ${max} foto.`,
  selectionSendSuccess: 'Pilihan berhasil dikirim ke fotografer.',
  selectionSendFail: 'Gagal mengirim pilihan. Periksa koneksi dan coba lagi.',
  // Portfolio
  portfolioUploadSuccess: 'Foto portofolio berhasil diupload.',
  portfolioUploadFail: 'Gagal mengupload foto portofolio.',
  portfolioDeleteSuccess: 'Foto portofolio berhasil dihapus.',
  portfolioDeleteFail: 'Gagal menghapus foto portofolio.',
  // Settings
  settingsSaveSuccess: 'Pengaturan berhasil disimpan.',
  settingsSaveFail: 'Gagal menyimpan pengaturan.',
  // Auth / Reset Password
  resetEmailSent: 'Jika email terdaftar, link reset sudah dikirim. Cek kotak masuk kamu.',
  resetEmailFail: 'Gagal mengirim link reset. Coba lagi nanti.',
  resetSuccess: 'Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru.',
  resetFail: 'Gagal memperbarui kata sandi. Link mungkin sudah kedaluwarsa.',
  resetPasswordMismatch: 'Konfirmasi kata sandi tidak cocok.',
  resetPasswordTooShort: 'Kata sandi minimal 8 karakter.',
  // Generic
  networkError: 'Koneksi terputus. Periksa internet kamu dan coba lagi.',
} as const;
