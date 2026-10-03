import React from 'react';
import LegalLayout from '../components/LegalLayout';
import { APP_NAME, LAST_UPDATED_LEGAL, CONTACT_EMAIL } from '../config/constants';

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <div className="prose prose-sm sm:prose-base prose-primary max-w-none">
        <h1 className="text-3xl font-bold mb-2">Kebijakan Privasi</h1>
        <p className="text-muted mb-8">Terakhir diperbarui: {LAST_UPDATED_LEGAL}</p>

        <p className="text-muted mb-8 leading-relaxed">
          Di {APP_NAME}, privasimu adalah prioritas kami. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi yang kamu berikan saat menggunakan layanan kami.
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">1. Data yang Dikumpulkan</h2>
          <p className="text-muted leading-relaxed">
            Kami mengumpulkan beberapa informasi dasar saat kamu mendaftar dan menggunakan layanan kami, termasuk namun tidak terbatas pada: email fotografer, nama studio, nomor WhatsApp, serta data aktivitas klien yang terkait dengan proses pemilihan foto pada galeri yang dibagikan.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">2. Penyimpanan Data</h2>
          <p className="text-muted leading-relaxed">
            Data pengguna seperti kredensial akun, pengaturan profil, dan metadata galeri disimpan dengan aman menggunakan infrastruktur Supabase. Kami memastikan bahwa server dan basis data kami dilindungi dengan standar keamanan industri terkini.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">3. Akses Google Drive</h2>
          <p className="text-muted leading-relaxed">
            Terkait dengan sumber foto, platform kami hanya membaca dan memproses thumbnail dari tautan folder Google Drive yang kamu berikan. Kami tidak mengunduh, mengambil alih kepemilikan, atau menyimpan file foto asli ke server kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">4. Cookie dan Penyimpanan Lokal</h2>
          <p className="text-muted leading-relaxed">
            Kami menggunakan cookie dan penyimpanan lokal (seperti token otentikasi Supabase) semata-mata untuk mengelola sesi pengguna, menjaga keamanan akun, dan memastikan kamu tidak perlu login berulang kali saat mengakses layanan kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">5. Penggunaan WhatsApp</h2>
          <p className="text-muted leading-relaxed">
            Platform kami menyediakan fitur untuk memudahkan kamu mengirim tautan galeri kepada klien melalui WhatsApp. Kami menggunakan fitur pengalihan (redirect) ke aplikasi WhatsApp dengan pesan yang sudah diisi sebelumnya, namun tidak mengakses riwayat chat atau kotak masuk WhatsApp milikmu.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">6. Hak Pengguna</h2>
          <p className="text-muted leading-relaxed">
            Kamu memiliki hak penuh atas datamu. Kamu dapat meminta akses, mengoreksi data yang tidak akurat, atau meminta penghapusan akun serta data pribadi dari sistem kami dengan menghubungi kami secara langsung.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">7. Keamanan Data</h2>
          <p className="text-muted leading-relaxed">
            Kami menerapkan tindakan keamanan teknis dan organisasi untuk melindungi data pribadimu dari akses tanpa izin, penyalahgunaan, atau pengungkapan. Meskipun demikian, tidak ada metode transmisi di internet yang 100% aman, sehingga kamu juga diimbau untuk selalu menjaga kerahasiaan kata sandimu.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">8. Perubahan Kebijakan</h2>
          <p className="text-muted leading-relaxed">
            Kebijakan Privasi ini dapat diubah dari waktu ke waktu untuk mencerminkan pembaruan operasional atau regulasi. Kami akan memperbarui tanggal "Terakhir diperbarui" di bagian atas halaman ini untuk setiap perubahan.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">9. Kontak</h2>
          <p className="text-muted leading-relaxed">
            Jika kamu memiliki pertanyaan, masalah, atau umpan balik mengenai Kebijakan Privasi ini, silakan hubungi kami melalui email di: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
