import React from 'react';
import LegalLayout from '../components/LegalLayout';
import { APP_NAME, LAST_UPDATED_LEGAL, BUSINESS_NAME } from '../config/constants';

export default function TermsPage() {
  return (
    <LegalLayout>
      <div className="prose prose-sm sm:prose-base prose-primary max-w-none">
        <h1 className="text-3xl font-bold mb-2">Syarat dan Ketentuan</h1>
        <p className="text-muted mb-8">Terakhir diperbarui: {LAST_UPDATED_LEGAL}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">1. Definisi Layanan</h2>
          <p className="text-muted leading-relaxed">
            {APP_NAME} ({BUSINESS_NAME}) adalah platform seleksi foto digital yang dirancang untuk memudahkan fotografer dalam membagikan galeri foto kepada klien mereka. Platform ini memungkinkan klien untuk memilih foto secara online dengan mudah dan terorganisir.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">2. Akun Fotografer dan Tanggung Jawabnya</h2>
          <p className="text-muted leading-relaxed">
            Sebagai fotografer yang menggunakan layanan kami, kamu bertanggung jawab atas keamanan akunmu, termasuk email dan kata sandi. Kamu menjamin bahwa semua informasi yang diberikan saat pendaftaran adalah akurat dan sah. Segala aktivitas yang terjadi di bawah akunmu sepenuhnya merupakan tanggung jawabmu.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">3. Penggunaan Google Drive</h2>
          <p className="text-muted leading-relaxed">
            Layanan kami terintegrasi dengan tautan folder Google Drive yang kamu sediakan. Platform ini hanya dirancang untuk mengakses dan memuat thumbnail gambar dari folder tersebut agar dapat ditampilkan kepada klien. Kami tidak mengambil alih kepemilikan, menyalin secara permanen, atau memodifikasi file asli di Google Drive milikmu.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">4. Hak dan Tanggung Jawab Klien</h2>
          <p className="text-muted leading-relaxed">
            Klien dari fotografer akan mengakses galeri melalui tautan unik dan berperan sebagai pengguna anonim dalam platform ini. Klien bertanggung jawab untuk melakukan seleksi foto sesuai dengan kesepakatan yang telah dibuat dengan fotografer yang bersangkutan.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">5. Batas Tanggung Jawab</h2>
          <p className="text-muted leading-relaxed">
            {APP_NAME} tidak menyimpan file foto asli beresolusi tinggi pada server kami. Kami hanya menyimpan metadata, pengaturan galeri, data pilihan klien, dan memproses thumbnail dari Google Drive untuk keperluan tampilan. Kami tidak bertanggung jawab atas hilangnya data atau kerusakan file asli yang disimpan di media penyimpanan eksternal atau Google Drive milik fotografer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">6. Pembatasan Penggunaan</h2>
          <p className="text-muted leading-relaxed">
            Kamu dilarang menggunakan platform ini untuk mendistribusikan konten yang melanggar hukum, melanggar hak cipta pihak ketiga, memuat unsur pornografi, atau konten yang menyinggung norma kesusilaan. Kami berhak menangguhkan atau menghapus akun yang terbukti melanggar ketentuan ini.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-text">7. Perubahan Ketentuan</h2>
          <p className="text-muted leading-relaxed">
            Kami berhak untuk mengubah, memodifikasi, atau memperbarui Syarat dan Ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini. Dengan terus menggunakan {APP_NAME} setelah adanya perubahan, kamu dianggap telah menyetujui ketentuan yang baru.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
