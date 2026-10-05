// src/pages/ContactPage.tsx
import React, { useState } from 'react';
import { useHomeData } from '../hooks/useHomeData';
import { useSiteSettings, usePageContent } from '../hooks/useContent';
import { usePageMeta } from '../hooks/usePageMeta';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { PageHero } from '../components/common/PageHero';
import { ContactCard } from '../components/common/ContactCard';
import { MapPin, Clock } from 'lucide-react';

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const { content: contactPageContent, loading } = usePageContent('contact');
  const [method, setMethod] = useState<'wa' | 'email'>('wa');
  const [form, setForm] = useState({ name: '', message: '' });

  const heading = contactPageContent?.header?.heading || 'Hubungi Kami';
  const description =
    contactPageContent?.header?.description ||
    'Punya pertanyaan, kendala, atau ingin mendiskusikan dokumentasi acara? Kami siap membantu.';

  usePageMeta({
    title: 'Kontak Studio',
    description,
  });
  const address = contactPageContent?.location?.address || '';
  const hours = contactPageContent?.location?.hours || 'Senin - Sabtu: 09.00 - 18.00 WIB';

  const email = settings.email || 'halo@marryland.id';
  const whatsapp = settings.whatsapp_number || '6281234567890';
  const instagram = settings.instagram || 'by.marryland';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo, saya ${form.name}. ${form.message}`;
    if (method === 'wa') {
      const cleanWa = whatsapp.replace(/\D/g, '');
      if (cleanWa) {
        window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } else {
      window.open(`mailto:${email}?subject=Pesan dari ${form.name}&body=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen font-sans bg-kertas text-tinta overflow-x-hidden flex flex-col selection:bg-merah selection:text-kertas">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-6 max-w-6xl mx-auto w-full md:pt-40 md:pb-32">
        <PageHero
          number="№ 04"
          category="SALURAN KOMUNIKASI"
          title={heading}
          description={description}
          className="mb-16"
        />

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: Contact Cards & Studio Info */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <ContactCard
                number="№ 01"
                label="WHATSAPP"
                title="Pesan Instan"
                detail={`+${whatsapp}`}
                description="Respon cepat untuk ketersediaan tanggal dan paket liputan."
                actionText="Chat WhatsApp"
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
              />

              <ContactCard
                number="№ 02"
                label="EMAIL"
                title="Surel Resmi"
                detail={email}
                description="Pertanyaan detail atau permohonan kerjasama dokumentasi."
                actionText="Kirim Surel"
                href={`mailto:${email}`}
              />

              <ContactCard
                number="№ 03"
                label="INSTAGRAM"
                title="Arsip Visual"
                detail={`@${instagram.replace('@', '')}`}
                description="Lihat cuplikan perhelatan terbaru dan portofolio harian."
                actionText="Buka Profil"
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                className="sm:col-span-2"
              />
            </div>

            {(address || hours) && (
              <div className="bg-kertas-tua/40 border border-garis rounded-panel p-6 space-y-4">
                {address && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-merah mr-3 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif font-normal text-tinta">Alamat Studio</h4>
                      <p className="font-body text-xs text-tinta-lembut mt-1 leading-relaxed">{address}</p>
                    </div>
                  </div>
                )}
                {address && hours && <hr className="border-garis" />}
                {hours && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-merah mr-3 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif font-normal text-tinta">Jam Operasional</h4>
                      <p className="font-body text-xs text-tinta-lembut mt-1">{hours}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-5 bg-kertas-tua/30 p-8 border border-garis rounded-panel">
            <span className="label-caps text-merah block mb-1">FORMULIR PESAN</span>
            <h3 className="font-serif text-2xl font-normal mb-6 text-tinta">Tulis Pesan Langsung</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-tinta uppercase tracking-[0.14em] mb-2">
                  Nama Kamu
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-garis rounded-input px-3.5 py-2.5 text-sm bg-kertas text-tinta focus:outline-none focus:ring-1 focus:ring-merah"
                  placeholder="Nama lengkap atau panggilan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-tinta uppercase tracking-[0.14em] mb-2">
                  Pilih Jalur Pengiriman
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('wa')}
                    className={`p-3 text-xs font-sans font-medium rounded-btn border text-center transition-colors min-h-[44px] ${
                      method === 'wa'
                        ? 'border-merah bg-merah text-kertas font-bold'
                        : 'border-garis text-tinta-lembut hover:border-tinta/40 bg-kertas'
                    }`}
                  >
                    Kirim via WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`p-3 text-xs font-sans font-medium rounded-btn border text-center transition-colors min-h-[44px] ${
                      method === 'email'
                        ? 'border-merah bg-merah text-kertas font-bold'
                        : 'border-garis text-tinta-lembut hover:border-tinta/40 bg-kertas'
                    }`}
                  >
                    Kirim via Email
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tinta uppercase tracking-[0.14em] mb-2">
                  Pesan
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-garis rounded-input px-3.5 py-2.5 text-sm bg-kertas text-tinta focus:outline-none focus:ring-1 focus:ring-merah"
                  placeholder="Tuliskan pertanyaan atau kebutuhan dokumentasimu..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-merah hover:bg-merah-hover text-kertas font-sans font-medium py-3 rounded-btn transition-colors min-h-[44px]"
              >
                Kirim Pesan Sekarang
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
