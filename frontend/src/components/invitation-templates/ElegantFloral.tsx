import React from 'react';
import { TemplateProps } from './types';

export default function ElegantFloral({ data, forms }: TemplateProps) {
  const { invitation, guestName, timeLeft, messages } = data;
  const { rsvp, setRsvp, submitRsvp, gbName, setGbName, gbMessage, setGbMessage, submitGuestbook, gift, setGift, submitGift } = forms;

  // Use override theme color or default
  const themeColor = invitation.theme_color || invitation.invitation_templates?.default_theme_color || '#9A8478';

  return (
    <div className="font-serif bg-[#FAF7F2] text-[#4A4238] min-h-screen">
      {/* Hero Section with Floral Accents */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center p-6 overflow-hidden">
        {/* Subtle floral background placeholder */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9A8478] to-transparent pointer-events-none"></div>
        
        <div className="z-10 max-w-2xl animate-fade-in relative">
          {/* Decorative Floral Top */}
          <div className="text-4xl text-[#9A8478] mb-6 opacity-80">❀</div>
          
          <p className="tracking-widest uppercase text-xs mb-4 text-[#7A6B5D]">The Wedding Of</p>
          <h1 className="text-6xl md:text-8xl font-bold mb-4 italic" style={{ color: themeColor }}>
            {invitation.groom_name} & {invitation.bride_name}
          </h1>
          <p className="text-lg italic text-[#7A6B5D] mb-12 border-y border-[#E8E2D9] py-4">
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-t-full rounded-b-xl inline-block shadow-sm border border-[#E8E2D9]">
            <p className="text-xs uppercase tracking-widest text-[#7A6B5D] mb-3">Dear,</p>
            <p className="text-2xl font-bold" style={{ color: themeColor }}>{guestName}</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-20 text-center bg-white border-y border-[#E8E2D9]">
        <h2 className="text-2xl italic mb-10" style={{ color: themeColor }}>Menanti Hari Bahagia</h2>
        <div className="flex justify-center gap-4 md:gap-8 px-4">
          {[
            { label: 'Hari', value: timeLeft.d },
            { label: 'Jam', value: timeLeft.h },
            { label: 'Menit', value: timeLeft.m },
            { label: 'Detik', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center w-16 md:w-24">
              <div className="text-[#4A4238] text-4xl md:text-5xl font-light mb-3">
                {item.value}
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#9A8478]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Story */}
      {invitation.couple_story && (
        <section className="py-24 px-6 max-w-2xl mx-auto text-center">
          <div className="text-3xl text-[#9A8478] mb-6 opacity-60">❧</div>
          <h2 className="text-3xl italic mb-8" style={{ color: themeColor }}>Kisah Cinta Kami</h2>
          <p className="text-[#7A6B5D] leading-loose text-sm md:text-base font-light">{invitation.couple_story}</p>
        </section>
      )}

      {/* Event Details */}
      <section className="py-24 px-6 bg-[#F5F2EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl italic text-center mb-16" style={{ color: themeColor }}>Detail Acara</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-[#E8E2D9] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: themeColor }}></div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Akad Nikah</h3>
              <p className="text-[#7A6B5D] mb-6 font-light">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="font-medium mb-8 text-[#4A4238]">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white text-sm tracking-wider uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  Peta Lokasi
                </a>
              )}
            </div>
            
            <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-[#E8E2D9] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: themeColor }}></div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Resepsi</h3>
              <p className="text-[#7A6B5D] mb-6 font-light">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="font-medium mb-8 text-[#4A4238]">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white text-sm tracking-wider uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  Peta Lokasi
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-3xl italic mb-8" style={{ color: themeColor }}>Konfirmasi Kehadiran</h2>
            <form onSubmit={submitRsvp} className="space-y-5 bg-white p-8 rounded-2xl border border-[#E8E2D9] shadow-sm">
              <input type="text" placeholder="Nama Anda" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-4 bg-[#FAF7F2] border border-[#E8E2D9] focus:outline-none" />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-4 bg-[#FAF7F2] border border-[#E8E2D9] focus:outline-none">
                <option value="hadir">Akan Hadir</option>
                <option value="tidak_hadir">Maaf, Tidak Bisa Hadir</option>
                <option value="ragu">Masih Ragu-ragu</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Jumlah Tamu" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-4 bg-[#FAF7F2] border border-[#E8E2D9] focus:outline-none" />
              )}
              <textarea placeholder="Pesan singkat" rows={3} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-4 bg-[#FAF7F2] border border-[#E8E2D9] focus:outline-none"></textarea>
              <button type="submit" className="w-full py-4 text-white uppercase tracking-wider text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>Kirim RSVP</button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl italic mb-8" style={{ color: themeColor }}>Buku Tamu</h2>
            <form onSubmit={submitGuestbook} className="space-y-4 mb-8">
              <input type="text" placeholder="Nama Anda" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-4 bg-transparent border-b border-[#E8E2D9] focus:outline-none focus:border-[#9A8478]" />
              <textarea placeholder="Tuliskan doa & harapan..." rows={2} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-4 bg-transparent border-b border-[#E8E2D9] focus:outline-none focus:border-[#9A8478]"></textarea>
              <button type="submit" className="px-8 py-3 border border-[#9A8478] text-[#9A8478] uppercase text-xs tracking-widest hover:bg-[#9A8478] hover:text-white transition-colors">Kirim Ucapan</button>
            </form>

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="pb-4 border-b border-[#E8E2D9] border-dashed">
                  <p className="font-bold text-lg" style={{ color: themeColor }}>{m.guest_name}</p>
                  <p className="text-[#7A6B5D] text-sm mt-2 font-light leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-24 px-6 text-center text-white" style={{ backgroundColor: themeColor }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl opacity-50 mb-6">♡</div>
          <h2 className="text-3xl italic mb-6">Wedding Gift</h2>
          <p className="mb-12 font-light text-white/80 leading-relaxed text-sm md:text-base">Doa restu Anda merupakan karunia terindah bagi kami. Namun, apabila Anda hendak memberikan tanda kasih, dapat melalui tautan berikut:</p>
          
          <div className="bg-white/10 p-8 border border-white/20 mb-12 max-w-sm mx-auto">
            <p className="text-2xl mb-2 tracking-widest">1234 5678 90</p>
            <p className="font-light text-white/80 mb-6 uppercase text-xs tracking-widest">BCA a.n. {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Rekening disalin');}} className="px-8 py-3 bg-white text-sm uppercase tracking-wider transition-colors hover:bg-gray-100" style={{ color: themeColor }}>
              Salin Nomor
            </button>
          </div>

          <h3 className="text-lg uppercase tracking-widest mb-6 opacity-80">Konfirmasi Pengiriman</h3>
          <form onSubmit={submitGift} className="space-y-4 text-left max-w-sm mx-auto">
            <input type="text" placeholder="Nama Anda" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-4 bg-white/5 border border-white/20 text-white placeholder-white/50 focus:outline-none" />
            <input type="text" placeholder="Dari Bank (cth: BCA)" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-4 bg-white/5 border border-white/20 text-white placeholder-white/50 focus:outline-none" />
            <input type="number" placeholder="Nominal (Opsional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-4 bg-white/5 border border-white/20 text-white placeholder-white/50 focus:outline-none" />
            <button type="submit" className="w-full py-4 bg-white uppercase text-sm tracking-wider transition-colors hover:bg-gray-100" style={{ color: themeColor }}>Kirim Konfirmasi</button>
          </form>
        </div>
      </section>

      <footer className="py-10 text-center text-[#7A6B5D] text-xs uppercase tracking-widest bg-white">
        <p>Made with Love by Marryland</p>
      </footer>
    </div>
  );
}
