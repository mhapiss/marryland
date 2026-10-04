import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { usePageMeta } from '../hooks/usePageMeta';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { Section } from '../components/landing/Section';
import { toast } from 'sonner';
import {
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  Search,
} from 'lucide-react';
import { FaqAccordion } from '../components/common/FaqAccordion';

// Parser helper for single *accent word*
const parseAccent = (text: string) => {
  if (!text) return text;
  return text.split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic font-serif text-merah not-italic font-normal">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

export default function ClientPage() {
  const { data } = useHomeData();
  const navigate = useNavigate();

  const content = data?.content || {};
  const clientData = content['clientPage']?.content || {};
  const faqData = content['faq']?.content || {};
  const contactData = content['contact']?.content || {};
  const footerData = content['footer']?.content || {};

  // SEO Page Meta
  usePageMeta({
    title: clientData.meta_title || 'Pengalaman Memilih Foto Klien | by.marryland',
    description:
      clientData.meta_description ||
      'Cara mudah dan nyaman bagi klien untuk meninjau dan memilih foto dari galeri yang dikirimkan oleh fotografer.',
  });

  // State for "Sudah Punya Link Galeri?" Input
  const [galleryLinkInput, setGalleryLinkInput] = useState('');

  // State for "Coba Langsung" Drive input
  const [driveFolderInput, setDriveFolderInput] = useState('');

  // State for FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Validate and handle "Sudah punya link galeri?"
  const handleOpenGallery = (e: React.FormEvent) => {
    e.preventDefault();
    const input = galleryLinkInput.trim();
    if (!input) {
      toast.error('Masukkan link atau slug galeri terlebih dahulu.');
      return;
    }

    try {
      // 1. If user pasted a full URL
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const url = new URL(input);
        if (url.origin !== window.location.origin) {
          toast.error('Hanya tautan galeri dari by.marryland yang dapat dibuka di sini.');
          return;
        }
        const pathname = url.pathname;
        if (!pathname || pathname === '/') {
          toast.error('Tautan tidak memuat alamat galeri yang spesifik.');
          return;
        }
        navigate(pathname);
        return;
      }

      // 2. If user typed a slug or path: e.g. "studio/klien" or "pernikahan-andi"
      // Prevent open redirect or protocol injection
      if (!/^[a-zA-Z0-9_\-\/]+$/.test(input) || input.includes('//')) {
        toast.error('Format link galeri tidak valid.');
        return;
      }

      let cleanPath = input.startsWith('/') ? input : `/${input}`;
      const segments = cleanPath.split('/').filter(Boolean);
      if (segments.length === 1) {
        cleanPath = `/g/${segments[0]}`;
      }
      navigate(cleanPath);
    } catch {
      toast.error('Format link tidak valid.');
    }
  };

  // Handle Demo Drive folder submission
  const handleTryDemoDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveFolderInput.trim()) {
      navigate('/demo');
      return;
    }
    navigate(`/demo?folder=${encodeURIComponent(driveFolderInput.trim())}`);
  };

  // Filter FAQ for clients (group === 'Untuk Klien' or fallback)
  const clientFaqs = (faqData.items || [])
    .filter((f: any) => !f.group || f.group.toLowerCase().includes('klien'))
    .slice(0, 5);

  const heroPhotos = clientData.hero_photos || [
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      caption: 'Ekspresi haru tampak jelas beresolusi tinggi',
      alt: 'Momen pernikahan',
    },
    {
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
      caption: 'Tampilan grid bersih di ponsel',
      alt: 'Sesi lamaran',
    },
    {
      url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      caption: 'Memilih dengan tenang tanpa terburu-buru',
      alt: 'Momen wisuda',
    },
  ];

  const problemFiles = clientData.problem_files || [
    { name: 'IMG_0421.JPG', size: '8.4 MB', date: 'Baru saja dibuka' },
    { name: 'IMG_0422.JPG', size: '9.1 MB', date: '2 menit lalu' },
    { name: 'IMG_0423.JPG', size: '7.8 MB', date: '10 menit lalu' },
    { name: 'IMG_0424.JPG', size: '8.9 MB', date: 'Kemarin' },
    { name: 'IMG_0425.JPG', size: '8.2 MB', date: 'Kemarin' },
  ];

  const benefitsList = clientData.benefits || [
    {
      num: '01',
      title: 'Langsung Buka Tanpa Akun',
      description:
        'Cukup ketuk tautan yang dikirimkan fotografer lewat WhatsApp atau email. Tidak perlu registrasi akun baru atau mengingat kata sandi.',
    },
    {
      num: '02',
      title: 'Tampilan Bersih & Perbesar Detail',
      description:
        'Foto tersusun rapi dalam susunan kotak yang lapang. Ketuk foto mana saja untuk melihatnya dalam ukuran penuh dan memperbesar detail wajah.',
    },
    {
      num: '03',
      title: 'Tandai Foto Sekali Ketuk',
      description:
        'Cukup sentuh tombol centang pada foto favoritmu. Foto yang terpilih akan langsung ditandai dengan nomor urut yang jelas.',
    },
    {
      num: '04',
      title: 'Tersimpan Otomatis Setiap Detik',
      description:
        'Baterai HP habis atau halaman tidak sengaja tertutup? Pilihanmu sudah aman tersimpan di server dan tidak akan tereset.',
    },
    {
      num: '05',
      title: 'Pantau Kuota Pilihan dengan Jelas',
      description:
        'Bilah status di bagian bawah layar selalu mengingatkan berapa foto yang sudah kamu pilih dan sisa kuota yang disepakati dengan fotografer.',
    },
    {
      num: '06',
      title: 'Tinjau Ulang Sebelum Mengirim',
      description:
        'Sebelum keputusan final dikirim ke fotografer, kamu bisa meninjau seluruh foto terpilih dalam satu layar ringkas untuk memastikannya.',
    },
  ];

  const situationsList = clientData.situations || [
    {
      title: 'Di Ponsel Saat Santai',
      caption:
        'Buka peramban ponselmu di waktu luang tanpa harus menyalakan laptop atau mengunduh aplikasi tambahan.',
      image_url:
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Duduk Berdua Memilih Bersama',
      caption:
        'Lihat foto bersama pasangan di layar tablet atau laptop untuk mendiskusikan ekspresi terbaik.',
      image_url:
        'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Lanjutkan Kapan Saja',
      caption:
        'Belum selesai memilih hari ini? Tutup halaman dan lanjutkan besok, pilihanmu tetap utuh.',
      image_url:
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const stepsList = clientData.steps || [
    {
      num: '01',
      title: 'Buka link dari fotografer',
      description:
        'Buka tautan galeri unik yang kamu terima. Galeri akan langsung terbuka dengan nama acaramu.',
      image_url:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    },
    {
      num: '02',
      title: 'Lihat dan perbesar foto',
      description:
        'Telusuri seluruh hasil pemotretan. Ketuk foto untuk memperbesar detail senyuman dan pencahayaan.',
      image_url:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    },
    {
      num: '03',
      title: 'Tandai pilihan favorit',
      description:
        'Tekan tombol pilih pada foto terbaikmu. Bilah kuota di bawah akan menghitung secara otomatis.',
      image_url:
        'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
    },
    {
      num: '04',
      title: 'Kirim hasil ke fotografer',
      description:
        'Periksa kembali di menu ringkasan pilihan, lalu tekan Kirim Pilihan untuk memberi tahu fotografermu.',
      image_url:
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const faqAccordionItems = clientFaqs.map((faq: any, idx: number) => ({
    number: `№ 0${idx + 1}`,
    question: faq.question,
    answer: faq.answer,
  }));

  return (
    <div className="min-h-screen bg-kertas text-tinta flex flex-col font-sans overflow-x-hidden selection:bg-merah selection:text-kertas">
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero Section (Asymmetric Photo Composition) */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-kertas border-b border-garis">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Editorial Content & Link Opener */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="label-caps text-merah mb-3 block">
                {clientData.hero_eyebrow || 'UNTUK KLIEN'}
              </span>

              <h1 className="font-serif text-[clamp(2.4rem,4.5vw,4.25rem)] leading-[1.08] tracking-tight text-tinta mb-6">
                {parseAccent(clientData.hero_heading || 'Pilih foto terbaikmu dengan *tenang*')}
              </h1>

              <p className="font-body text-base md:text-lg text-tinta-lembut leading-relaxed mb-8 max-w-xl">
                {clientData.hero_sub ||
                  'Buka link galeri dari fotografermu langsung di ponsel tanpa perlu membuat akun atau memasang aplikasi. Tandai foto yang kamu suka, perbesar detail ekspresi, dan kirimkan hasilnya saat kamu sudah yakin.'}
              </p>

              {/* Two Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-10 w-full sm:w-auto">
                <Link
                  to="/demo"
                  className="inline-flex items-center justify-center bg-merah hover:bg-merah-hover text-kertas px-7 py-3.5 text-sm font-medium tracking-wide rounded-[2px] transition-colors min-h-[44px]"
                >
                  {clientData.cta_demo || 'Coba Demo'}
                </Link>

                <a
                  href="#cara-memilih"
                  className="inline-flex items-center justify-center border border-tinta/40 text-tinta hover:bg-kertas-tua px-6 py-3.5 text-sm font-medium tracking-wide rounded-[2px] transition-colors min-h-[44px]"
                >
                  {clientData.cta_steps || 'Lihat Cara Memilih'}
                </a>
              </div>

              {/* Box: "Sudah punya link galeri dari fotografermu?" */}
              <div className="w-full max-w-md bg-kertas-tua/40 border border-garis rounded-[2px] p-6">
                <label className="block text-xs font-semibold text-tinta mb-1 uppercase tracking-wider">
                  {clientData.link_box_title || 'Sudah punya link galeri dari fotografermu?'}
                </label>
                <p className="text-xs text-tinta-lembut mb-4">
                  Tempel tautan lengkap atau masukkan nama galeri di bawah ini.
                </p>

                <form onSubmit={handleOpenGallery} className="flex gap-2">
                  <input
                    type="text"
                    value={galleryLinkInput}
                    onChange={(e) => setGalleryLinkInput(e.target.value)}
                    placeholder={clientData.link_box_placeholder || 'misal: studio/andi-ani'}
                    className="flex-1 border border-garis rounded-[2px] px-3.5 py-2.5 text-xs bg-kertas text-tinta placeholder:text-tinta-lembut/70 focus:outline-none focus:ring-1 focus:ring-merah"
                  />
                  <button
                    type="submit"
                    className="bg-merah hover:bg-merah-hover text-kertas text-xs font-semibold px-4 py-2.5 rounded-[2px] shrink-0 transition-colors min-h-[40px]"
                  >
                    {clientData.link_box_btn || 'Buka Galeri'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Asymmetric Photo Composition with frame-cetakan */}
            <div className="lg:col-span-6 relative w-full pt-4">
              <div className="grid grid-cols-12 gap-4 items-start">
                
                {/* Main Large Photo 3:4 */}
                <div className="col-span-7 space-y-2">
                  <div className="aspect-[3/4] frame-cetakan rounded-[2px] overflow-hidden bg-kertas-tua/50">
                    <img
                      src={heroPhotos[0]?.url}
                      alt={heroPhotos[0]?.alt || ''}
                      className="w-full h-full object-cover"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <p className="text-[11px] text-tinta-lembut font-sans italic">
                    {heroPhotos[0]?.caption}
                  </p>
                </div>

                {/* Two smaller offset photos */}
                <div className="col-span-5 space-y-6 pt-8">
                  {/* Photo 2 */}
                  <div className="space-y-1.5">
                    <div className="aspect-[4/3] frame-cetakan rounded-[2px] overflow-hidden bg-kertas-tua/50">
                      <img
                        src={heroPhotos[1]?.url}
                        alt={heroPhotos[1]?.alt || ''}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-[10px] text-tinta-lembut font-sans italic leading-tight">
                      {heroPhotos[1]?.caption}
                    </p>
                  </div>

                  {/* Photo 3 */}
                  <div className="space-y-1.5">
                    <div className="aspect-square frame-cetakan rounded-[2px] overflow-hidden bg-kertas-tua/50">
                      <img
                        src={heroPhotos[2]?.url}
                        alt={heroPhotos[2]?.alt || ''}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-[10px] text-tinta-lembut font-sans italic leading-tight">
                      {heroPhotos[2]?.caption}
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* 2. Masalah: Kewalahan Menerima Ratusan File */}
        <Section id="masalah" bg="kertas-tua" className="border-b border-garis">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="label-caps text-merah block mb-3">
                KENDALA FORMAT LAMA
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal leading-tight mb-6">
                {clientData.problem_heading ||
                  'Menerima ratusan file foto tanpa tahu harus mulai dari mana?'}
              </h2>
              <p className="font-body text-base text-tinta-lembut leading-relaxed max-w-xl">
                {clientData.problem_desc ||
                  'Melihat thumbnail kecil di folder cloud, mencatat nomor file satu per satu di kertas, lalu mengetiknya kembali ke chat WhatsApp sangat menyita waktu dan rawan salah nomor.'}
              </p>
            </div>

            {/* Plain File List with thin borders */}
            <div className="lg:col-span-6">
              <div className="bg-kertas border border-garis rounded-[2px] p-6">
                <div className="pb-3 mb-3 border-b border-garis flex justify-between text-xs text-tinta-lembut font-mono uppercase">
                  <span>Nama Berkas</span>
                  <span>Ukuran / Status</span>
                </div>

                <div className="divide-y divide-garis">
                  {problemFiles.map((file: any, idx: number) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono text-tinta font-medium block">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-tinta-lembut">{file.date}</span>
                      </div>
                      <span className="font-mono text-tinta-lembut text-[11px]">{file.size}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-garis text-[11px] text-tinta-lembut italic">
                  Daftar file acak membuat perbandingan ekspresi wajah jadi melelahkan.
                </div>
              </div>
            </div>

          </div>
        </Section>

        {/* 3. Manfaat: Daftar Editorial 2 Kolom Bernomor Tanpa Kotak SaaS */}
        <Section id="manfaat" bg="kertas" className="border-b border-garis">
          <div className="mb-16 md:mb-20 pb-6 border-b border-double-b border-garis flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="label-caps text-merah block mb-2">
                PENGALAMAN NYAMAN
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
                {clientData.benefits_heading || 'Enam Kemudahan yang Kamu Rasakan'}
              </h2>
            </div>
            <p className="font-body text-sm text-tinta-lembut max-w-md">
              Kenyamanan meninjau memori berhargamu adalah prioritas utama alur seleksi kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {benefitsList.map((benefit: any, idx: number) => (
              <div key={idx} className="flex gap-6 items-start pb-8 border-b border-garis">
                <span className="font-serif text-3xl md:text-4xl text-merah/40 font-normal shrink-0 leading-none">
                  {benefit.num || `0${idx + 1}`}
                </span>
                <div>
                  <h3 className="font-serif text-xl font-normal text-tinta mb-2">
                    {benefit.title}
                  </h3>
                  <p className="font-body text-sm text-tinta-lembut leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. Coba Langsung (Demo Simulation Input) */}
        <Section id="coba-langsung" bg="kertas-tua" className="border-b border-garis">
          <div className="max-w-3xl mx-auto text-left">
            <span className="label-caps text-merah block mb-2">
              SIMULASI TANPA REGISTRASI
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight mb-4">
              {clientData.demo_heading || 'Coba langsung tanpa galeri asli'}
            </h2>
            <p className="font-body text-base text-tinta-lembut leading-relaxed mb-8">
              {clientData.demo_desc ||
                'Ingin melihat bagaimana rasanya memilih foto di sistem kami? Masukkan tautan folder Google Drive publik untuk mencobanya secara langsung, atau gunakan contoh foto yang sudah kami sediakan.'}
            </p>

            <form onSubmit={handleTryDemoDrive} className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                value={driveFolderInput}
                onChange={(e) => setDriveFolderInput(e.target.value)}
                placeholder="Tempel tautan folder Google Drive publik di sini..."
                className="flex-1 border border-garis rounded-[2px] px-4 py-3 text-sm bg-kertas text-tinta placeholder:text-tinta-lembut/70 focus:outline-none focus:ring-1 focus:ring-merah"
              />
              <button
                type="submit"
                className="bg-merah hover:bg-merah-hover text-kertas text-sm font-semibold px-6 py-3 rounded-[2px] transition-colors shrink-0 min-h-[44px]"
              >
                Coba Sekarang
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-garis">
              <button
                type="button"
                onClick={() => navigate('/demo')}
                className="text-xs font-semibold text-merah hover:underline flex items-center gap-1.5 min-h-[36px]"
              >
                <span>Coba dengan foto contoh yang sudah ada</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs text-tinta-lembut font-sans">
                {clientData.demo_note || 'Mode simulasi lokal: Tidak ada file atau akun yang disimpan permanen.'}
              </span>
            </div>
          </div>
        </Section>

        {/* 5. Situasi Pemakaian: Tata Letak Asimetris */}
        <Section id="situasi" bg="kertas" className="border-b border-garis">
          <div className="max-w-2xl mb-16">
            <span className="label-caps text-merah block mb-2">
              FLEKSIBILITAS PEMILIHAN
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
              {clientData.situations_heading || 'Kapan dan di Mana Kamu Memilih Foto'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Photo 1: Large Left */}
            <div className="md:col-span-5 space-y-3">
              <div className="aspect-[4/5] frame-cetakan rounded-[2px] overflow-hidden bg-kertas-tua/50">
                <img
                  src={situationsList[0]?.image_url}
                  alt={situationsList[0]?.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-serif text-xl font-normal text-tinta">
                {situationsList[0]?.title}
              </h3>
              <p className="font-body text-sm text-tinta-lembut leading-relaxed">
                {situationsList[0]?.caption}
              </p>
            </div>

            {/* Photo 2 & 3: Staggered Right */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 md:pt-16">
              <div className="space-y-3">
                <div className="aspect-square frame-cetakan rounded-[2px] overflow-hidden bg-kertas-tua/50">
                  <img
                    src={situationsList[1]?.image_url}
                    alt={situationsList[1]?.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif text-lg font-normal text-tinta">
                  {situationsList[1]?.title}
                </h3>
                <p className="font-body text-sm text-tinta-lembut leading-relaxed">
                  {situationsList[1]?.caption}
                </p>
              </div>

              <div className="space-y-3 sm:translate-y-12">
                <div className="aspect-[3/4] frame-cetakan rounded-[2px] overflow-hidden bg-kertas-tua/50">
                  <img
                    src={situationsList[2]?.image_url}
                    alt={situationsList[2]?.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif text-lg font-normal text-tinta">
                  {situationsList[2]?.title}
                </h3>
                <p className="font-body text-sm text-tinta-lembut leading-relaxed">
                  {situationsList[2]?.caption}
                </p>
              </div>
            </div>

          </div>
        </Section>

        {/* 6. Cara Memilih: Angka Besar Serif Tipis di Kiri, Screenshot Asli di Kanan */}
        <Section id="cara-memilih" bg="kertas-tua" className="border-b border-garis">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <span className="label-caps text-merah block mb-2">
              PANDUAN ALUR
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
              {clientData.steps_heading || 'Empat Langkah Memilih Foto'}
            </h2>
            <p className="font-body text-base text-tinta-lembut mt-3">
              Semua proses berlangsung di satu halaman web yang intuitif.
            </p>
          </div>

          <div className="space-y-16 md:space-y-20">
            {stepsList.map((step: any, idx: number) => {
              const isEven = idx % 2 === 1;

              return (
                <div
                  key={idx}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center ${
                    isEven ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Left Column: Number & Text */}
                  <div className={`lg:col-span-5 ${isEven ? 'lg:order-2' : ''}`}>
                    <span className="font-serif text-5xl md:text-6xl text-merah/30 font-normal block mb-3 leading-none">
                      {step.num || `0${idx + 1}`}
                    </span>
                    <h3 className="font-serif text-2xl md:text-3xl font-normal text-tinta mb-4">
                      {step.title}
                    </h3>
                    <p className="font-body text-base text-tinta-lembut leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Right Column: Screenshot / Illustration */}
                  <div className={`lg:col-span-7 ${isEven ? 'lg:order-1' : ''}`}>
                    <div className="aspect-[16/10] bg-kertas border border-garis rounded-[2px] overflow-hidden frame-cetakan">
                      <img
                        src={step.image_url}
                        alt={step.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 7. FAQ Klien: Akordeon Aksesibel dengan Nomor Urut */}
        <Section id="faq" bg="kertas" className="border-b border-garis">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <span className="label-caps text-merah block mb-2">
                PERTANYAAN UMUM KLIEN
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
                Jawaban untuk Keraguanmu
              </h2>
            </div>

            <div className="mb-10">
              <FaqAccordion items={faqAccordionItems} />
            </div>

            <div className="text-center">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-bold text-tinta hover:text-merah transition-colors link-vintage pb-1 min-h-[44px]"
              >
                <span>Lihat Semua Pertanyaan &amp; Jawaban</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Section>

        {/* 8. CTA Akhir */}
        <Section bg="kertas-tua" className="!py-20 md:!py-24">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="font-serif text-3xl md:text-4xl text-tinta font-normal tracking-tight">
              {clientData.cta_heading || 'Siap melihat kemudahan memilih foto?'}
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/demo"
                className="inline-flex items-center justify-center bg-merah hover:bg-merah-hover text-kertas px-8 py-3.5 text-sm font-semibold tracking-wide rounded-[2px] transition-colors min-h-[44px]"
              >
                {clientData.cta_bottom_demo || clientData.cta_demo || 'Coba Demo Sekarang'}
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center text-sm font-medium text-tinta-lembut hover:text-merah underline underline-offset-4 px-4 py-2 min-h-[44px] transition-colors"
              >
                {clientData.cta_photographer_text || 'Kamu fotografer? Lihat halaman untuk fotografer'}
              </Link>
            </div>
          </div>
        </Section>
      </main>

      {/* 9. Footer */}
      <Footer contactData={contactData} footerData={footerData} />
    </div>
  );
}
