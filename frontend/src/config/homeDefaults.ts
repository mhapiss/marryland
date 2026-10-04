export const HOME_DEFAULTS = {
  meta: {
    title: "by.marryland | Galeri Seleksi Foto Klien untuk Fotografer",
    description: "Platform kurasi dan seleksi foto klien yang cepat, elegan, dan terintegrasi langsung dengan Google Drive untuk fotografer pernikahan dan wisuda.",
  },
  nav: {
    logo_text: "by.marryland",
    cta_text: "Masuk",
  },
  hero: {
    eyebrow: "PILIHAN CERDAS FOTOGRAFER",
    promise: "Klien Pilih Foto *Tanpa Ribet*",
    subheadline: "Bagikan galeri foto langsung dari Google Drive. Klien memilih foto favorit tanpa perlu login, dan kamu cukup menyalin nama file langsung ke Lightroom.",
    cta_primary: "Mulai Sekarang",
    cta_demo: "Lihat Contoh Galeri",
    cta_login: "Masuk Dashboard",
    facts: [
      { text: "Tanpa simpan file asli di server" },
      { text: "Klien pilih tanpa perlu akun" },
      { text: "Salin daftar nama ke Lightroom" }
    ]
  },
  marquee: {
    heading: "Dokumentasi Autentik Berbagai Momen",
    speed_row1: "70",
    speed_row2: "90",
  },
  facts: {
    heading: "Dirancang Khusus untuk Alur Kerja Fotografer",
    items: [
      { title: "Koneksi Google Drive", description: "Cukup masukkan tautan folder, sistem membaca thumbnail otomatis tanpa perlu unggah ulang." },
      { title: "Satu Tautan Unik", description: "Klien langsung membuka galeri di ponsel atau laptop tanpa perlu unduh atau instal aplikasi." },
      { title: "Penyimpanan Realtime", description: "Setiap foto yang dipilih tersimpan otomatis, aman walau browser klien tertutup." },
      { title: "Salin Format Lightroom", description: "Daftar nama file siap dipaste ke filter pencarian teks Lightroom dalam satu klik." }
    ]
  },
  portfolio: {
    heading: "Kategori Karya",
    subheading: "Dokumentasi visual penuh emosi yang terkurasi dengan standar editorial tinggi.",
    cta_text: "Lihat Semua Portofolio",
    categories: [
      {
        name: "Wedding",
        slug: "wedding",
        description: "Janji suci, tangis haru, dan perayaan cinta yang abadi.",
        cover_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Lamaran",
        slug: "lamaran",
        description: "Langkah awal pertemuan dua keluarga dalam kehangatan.",
        cover_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Wisuda",
        slug: "wisuda",
        description: "Penghargaan atas dedikasi dan senyum bangga keluarga.",
        cover_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  problem: {
    heading: "Seleksi foto lewat chat WhatsApp melelahkan?",
    description: "Klien bingung mengingat ratusan nomor file di Google Drive, membalas chat satu per satu, dan fotografer salah catat foto yang harus diedit.",
    chat_bubbles: [
      { sender: "klien", text: "Kak, ini aku pilih IMG_0023, IMG_0024... eh bentar, IMG_0023 yang hadap kiri atau kanan ya?" },
      { sender: "fotografer", text: "Yang hadap kanan kak. Boleh kirim screenshot-nya biar nggak salah edit?" },
      { sender: "klien", text: "Aduh fotonya banyak banget di Drive, lemot buka satu-satu..." },
      { sender: "klien", text: "Bentar ya kak, aku catat di kertas dulu nanti aku fotoin." },
      { sender: "fotografer", text: "Siap kak, jangan lupa kasih nomor urut fotonya ya." },
      { sender: "klien", text: "Kak nomor 45 yang aku kirim kemarin salah, tolong ganti nomor 48 ya!" }
    ],
    note: "Status: belum kelar dan rawan salah edit."
  },
  benefits: {
    heading: "Solusi Cerdas Seleksi Foto Klien",
    items: [
      { icon: "Link", title: "Tautkan Google Drive", description: "Cukup masukkan tautan folder Google Drive, thumbnail foto langsung tampil rapi." },
      { icon: "MousePointerClick", title: "Klien Tinggal Ketuk", description: "Tampilan galeri responsif dengan mode zoom detail, klien memilih hanya dengan satu ketukan." },
      { icon: "Timer", title: "Batas Waktu & Kuota", description: "Tentukan batas maksimal foto yang boleh dipilih dan tanggal tenggat waktu otomatis." },
      { icon: "Save", title: "Tersimpan Otomatis", description: "Pilihan klien langsung tersimpan secara realtime ke database tanpa risiko hilang." },
      { icon: "Copy", title: "Salin ke Lightroom", description: "Fotografer menyalin nama file terpilih dalam format koma langsung ke filter teks Lightroom." },
      { icon: "UserMinus", title: "Tanpa Registrasi Klien", description: "Klien langsung memilih tanpa perlu daftar akun atau mengingat kata sandi." }
    ]
  },
  featured: {
    heading: "Cerita Terpilih",
    subheading: "Rangkaian momen berharga yang terabadikan secara autentik dan bermakna.",
    cta_text: "Lihat Portofolio Lengkap"
  },
  demo: {
    heading: "Rasakan Pengalaman Klien",
    description: "Coba sendiri kemudahan memilih foto dari sisi klien melalui galeri interaktif kami.",
    demo_slug: "demo",
    cta_text: "Buka Galeri Demo"
  },
  steps: {
    heading: "3 Langkah Alur Kerja",
    items: [
      { title: "Buat Galeri", description: "Atur batas foto, tanggal tenggat, dan masukkan tautan folder Google Drive." },
      { title: "Bagikan ke Klien", description: "Kirim satu tautan unik. Klien bebas memilih foto favorit dari HP atau komputer." },
      { title: "Salin ke Lightroom", description: "Buka dashboard saat klien selesai, salin daftar nama file untuk langsung mulai edit." }
    ]
  },
  pricing: {
    heading: "Pilihan Paket Studio",
    description: "Investasi terjangkau untuk menghemat puluhan jam koordinasi dengan klien setiap bulannya.",
    packages: [
      { name: "Starter", price: "[HARGA]", visible: "false", features: "Hingga 5 galeri aktif, Batas 500 foto per galeri, Integrasi Google Drive, Salin ke Lightroom" },
      { name: "Pro Studio", price: "[HARGA]", visible: "false", features: "Galeri aktif tanpa batas, Batas foto tak terbatas, Tenggat waktu otomatis, Dukungan prioritas" },
      { name: "Custom Studio", price: "[HARGA]", visible: "false", features: "Domain kustom studio, Branding tanpa watermark, Integrasi penyimpanan khusus, Konsultasi teknis" }
    ]
  },
  faq: {
    heading: "Pertanyaan yang Sering Diajukan",
    items: [
      { group: "Untuk Fotografer", question: "Apakah foto saya diunduh atau disimpan ke server by.marryland?", answer: "Tidak. by.marryland hanya membaca thumbnail dari tautan folder Google Drive Anda melalui API resmi. File foto master beresolusi tinggi tetap berada di Google Drive Anda." },
      { group: "Untuk Fotografer", question: "Bagaimana cara menyalin hasil pilihan ke Adobe Lightroom?", answer: "Di dashboard pada galeri yang sudah selesai dipilih klien, klik tombol 'Copy utk Lightroom'. Sistem menyalin daftar nama file dengan pemisah koma, siap ditempel ke filter Library Text di Lightroom." },
      { group: "Untuk Fotografer", question: "Apakah ada batasan jumlah foto dalam satu galeri?", answer: "Anda dapat memuat ratusan hingga ribuan foto dari folder Google Drive Anda. Anda juga dapat menentukan kuota berapa foto maksimal yang boleh dipilih oleh klien." },
      { group: "Untuk Klien", question: "Apakah saya harus membuat akun untuk memilih foto?", answer: "Tidak perlu. Anda cukup membuka tautan unik yang dikirimkan fotografer, lalu langsung memilih foto favorit dari HP atau komputer Anda." },
      { group: "Untuk Klien", question: "Apakah pilihan foto saya hilang jika baterai HP habis atau browser tertutup?", answer: "Tidak. Setiap foto yang Anda pilih langsung tersimpan secara realtime ke server. Anda bisa menutup halaman dan membukanya kembali kapan saja sebelum tombol Kirim Pilihan ditekan." }
    ]
  },
  cta: {
    heading: "Siap Menyederhanakan Seleksi Foto Klien?",
    subheading: "Tinggalkan format chat WhatsApp yang berantakan. Berikan pengalaman profesional bagi klien Anda hari ini.",
    cta_primary: "Mulai Sekarang",
    cta_secondary: "Coba Galeri Demo"
  },
  clientPage: {
    meta_title: "Pengalaman Memilih Foto Klien | by.marryland",
    meta_description: "Cara mudah dan nyaman bagi klien untuk meninjau dan memilih foto dari galeri yang dikirimkan oleh fotografer.",
    hero_eyebrow: "Untuk Klien",
    hero_heading: "Pilih foto terbaikmu dengan *tenang*",
    hero_sub: "Buka link galeri dari fotografermu langsung di ponsel tanpa perlu membuat akun atau memasang aplikasi. Tandai foto yang kamu suka, perbesar detail ekspresi, dan kirimkan hasilnya saat kamu sudah yakin.",
    cta_demo: "Coba Demo",
    cta_steps: "Lihat Cara Memilih",
    link_box_title: "Sudah punya link galeri dari fotografermu?",
    link_box_placeholder: "Tempel link atau ketik nama galeri (misal: studio/andi-ani)",
    link_box_btn: "Buka Galeri",
    hero_photos: [
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80", caption: "Detail busana dan ekspresi jelas", alt: "Momen pernikahan" },
      { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80", caption: "Tampilan grid rapi di layar ponsel", alt: "Sesi lamaran" },
      { url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80", caption: "Bebas memilih di sela waktu santai", alt: "Momen wisuda" }
    ],
    problem_heading: "Menerima ratusan file foto tanpa tahu harus mulai dari mana?",
    problem_desc: "Melihat thumbnail kecil di folder cloud, mencatat nomor file satu per satu di kertas, lalu mengetiknya kembali ke chat WhatsApp sangat menyita waktu dan rawan salah nomor.",
    problem_files: [
      { name: "IMG_0421.JPG", size: "8.4 MB", date: "Baru saja dibuka" },
      { name: "IMG_0422.JPG", size: "9.1 MB", date: "2 menit lalu" },
      { name: "IMG_0423.JPG", size: "7.8 MB", date: "10 menit lalu" },
      { name: "IMG_0424.JPG", size: "8.9 MB", date: "Kemarin" },
      { name: "IMG_0425.JPG", size: "8.2 MB", date: "Kemarin" }
    ],
    benefits_heading: "Enam Kemudahan yang Kamu Rasakan",
    benefits: [
      { num: "01", title: "Langsung Buka Tanpa Akun", description: "Cukup ketuk tautan yang dikirimkan fotografer lewat WhatsApp atau email. Tidak perlu registrasi akun baru atau mengingat kata sandi." },
      { num: "02", title: "Tampilan Bersih & Perbesar Detail", description: "Foto tersusun rapi dalam susunan kotak yang lapang. Ketuk foto mana saja untuk melihatnya dalam ukuran penuh dan memperbesar detail wajah." },
      { num: "03", title: "Tandai Foto Sekali Ketuk", description: "Cukup sentuh tombol centang pada foto favoritmu. Foto yang terpilih akan langsung ditandai dengan nomor urut yang jelas." },
      { num: "04", title: "Tersimpan Otomatis Setiap Detik", description: "Baterai HP habis atau halaman tidak sengaja tertutup? Pilihanmu sudah aman tersimpan di server dan tidak akan tereset." },
      { num: "05", title: "Pantau Kuota Pilihan dengan Jelas", description: "Bilah status di bagian bawah layar selalu mengingatkan berapa foto yang sudah kamu pilih dan sisa kuota yang disepakati dengan fotografer." },
      { num: "06", title: "Tinjau Ulang Sebelum Mengirim", description: "Sebelum keputusan final dikirim ke fotografer, kamu bisa meninjau seluruh foto terpilih dalam satu layar ringkas untuk memastikannya." }
    ],
    demo_heading: "Coba langsung tanpa galeri asli",
    demo_desc: "Ingin melihat bagaimana rasanya memilih foto di sistem kami? Masukkan tautan folder Google Drive publik untuk mencobanya secara langsung, atau gunakan contoh foto yang sudah kami sediakan.",
    demo_sample_folder: "",
    demo_note: "Mode simulasi lokal: Tidak ada file atau akun yang disimpan permanen.",
    situations_heading: "Kapan dan di Mana Kamu Memilih Foto",
    situations: [
      {
        title: "Di Ponsel Saat Santai",
        caption: "Buka peramban ponselmu di waktu luang tanpa harus menyalakan laptop atau mengunduh aplikasi tambahan.",
        image_url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Duduk Berdua Memilih Bersama",
        caption: "Lihat foto bersama pasangan di layar tablet atau laptop untuk mendiskusikan ekspresi terbaik.",
        image_url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Lanjutkan Kapan Saja",
        caption: "Belum selesai memilih hari ini? Tutup halaman dan lanjutkan besok, pilihanmu tetap utuh.",
        image_url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80"
      }
    ],
    steps_heading: "Empat Langkah Memilih Foto",
    steps: [
      {
        num: "01",
        title: "Buka link dari fotografer",
        description: "Buka tautan galeri unik yang kamu terima. Galeri akan langsung terbuka dengan nama acaramu.",
        image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
      },
      {
        num: "02",
        title: "Lihat dan perbesar foto",
        description: "Telusuri seluruh hasil pemotretan. Ketuk foto untuk memperbesar detail senyuman dan pencahayaan.",
        image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
      },
      {
        num: "03",
        title: "Tandai pilihan favorit",
        description: "Tekan tombol pilih pada foto terbaikmu. Bilah kuota di bawah akan menghitung secara otomatis.",
        image_url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80"
      },
      {
        num: "04",
        title: "Kirim hasil ke fotografer",
        description: "Periksa kembali di menu ringkasan pilihan, lalu tekan Kirim Pilihan untuk memberi tahu fotografermu.",
        image_url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80"
      }
    ],
    cta_heading: "Siap melihat kemudahan memilih foto?",
    cta_bottom_demo: "Coba Demo Sekarang",
    cta_photographer_text: "Kamu fotografer? Lihat halaman untuk fotografer"
  },
  contact: {
    heading: "Hubungi Kami",
    description: "Ada pertanyaan seputar alur kerja atau kendala teknis? Tim by.marryland siap membantu Anda.",
    whatsapp: "[NOMOR_WA]",
    email: "[EMAIL_KONTAK]",
    instagram: "[USERNAME_INSTAGRAM]",
    address: "[LOKASI_STUDIO]",
    hours: "Senin - Jumat, 09:00 - 17:00 WIB"
  },
  footer: {
    text: "© 2026 by.marryland. Seluruh hak cipta dilindungi."
  }
};
