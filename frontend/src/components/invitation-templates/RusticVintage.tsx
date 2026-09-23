import React from 'react';
import { TemplateProps } from './types';

export default function RusticVintage({ data, forms }: TemplateProps) {
  const { invitation, guestName, timeLeft, messages } = data;
  const { rsvp, setRsvp, submitRsvp, gbName, setGbName, gbMessage, setGbMessage, submitGuestbook, gift, setGift, submitGift } = forms;

  const themeColor = invitation.theme_color || invitation.invitation_templates?.default_theme_color || '#8B5A2B';

  return (
    <div className="font-serif bg-[#F4ECD8] text-[#5C4033] min-h-screen border-[16px]" style={{ borderColor: themeColor }}>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center p-6 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
        <div className="z-10 max-w-2xl animate-fade-in border-4 p-8 md:p-12" style={{ borderColor: themeColor }}>
          <p className="tracking-widest uppercase text-sm mb-6 font-bold" style={{ color: themeColor }}>Undangan Pernikahan</p>
          <h1 className="text-6xl md:text-7xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            {invitation.groom_name} <br/><span className="text-4xl italic font-light">&</span><br/> {invitation.bride_name}
          </h1>
          <p className="text-xl italic mb-10 border-b-2 pb-6" style={{ borderColor: themeColor, color: themeColor }}>
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="inline-block mt-4">
            <p className="text-sm font-bold uppercase tracking-widest mb-2">Kepada Yth.</p>
            <p className="text-3xl font-bold italic" style={{ color: themeColor }}>{guestName}</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-16 text-center bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#E6D5B8]">
        <h2 className="text-3xl font-bold uppercase tracking-widest mb-8" style={{ color: themeColor }}>Menuju Hari H</h2>
        <div className="flex justify-center gap-4 px-4">
          {[
            { label: 'Hari', value: timeLeft.d },
            { label: 'Jam', value: timeLeft.h },
            { label: 'Menit', value: timeLeft.m },
            { label: 'Detik', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center w-20 h-24 md:w-28 md:h-32 bg-[#F4ECD8] border-2 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]" style={{ borderColor: themeColor }}>
              <div className="text-3xl md:text-4xl font-bold" style={{ color: themeColor }}>
                {item.value}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest mt-1 text-[#5C4033]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Story */}
      {invitation.couple_story && (
        <section className="py-20 px-6 max-w-3xl mx-auto text-center bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-8" style={{ color: themeColor }}>Kisah Kami</h2>
          <p className="text-lg leading-loose italic">{invitation.couple_story}</p>
        </section>
      )}

      {/* Event Details */}
      <section className="py-20 px-6 bg-[#E6D5B8] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-12 text-center" style={{ color: themeColor }}>Waktu & Tempat</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#F4ECD8] p-10 text-center border-2 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]" style={{ borderColor: themeColor }}>
              <h3 className="text-2xl font-bold uppercase mb-4" style={{ color: themeColor }}>Akad Nikah</h3>
              <p className="text-xl italic mb-6">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-8">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white font-bold tracking-widest uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  Peta Lokasi
                </a>
              )}
            </div>
            
            <div className="bg-[#F4ECD8] p-10 text-center border-2 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]" style={{ borderColor: themeColor }}>
              <h3 className="text-2xl font-bold uppercase mb-4" style={{ color: themeColor }}>Resepsi</h3>
              <p className="text-xl italic mb-6">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-8">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white font-bold tracking-widest uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  Peta Lokasi
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-20 px-6 max-w-5xl mx-auto bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-3xl font-bold uppercase mb-8" style={{ color: themeColor }}>RSVP</h2>
            <form onSubmit={submitRsvp} className="space-y-6">
              <input type="text" placeholder="Nama" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-4 bg-transparent border-b-2 focus:outline-none placeholder-[#8B5A2B]/50 font-bold" style={{ borderColor: themeColor }} />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-4 bg-transparent border-b-2 focus:outline-none font-bold" style={{ borderColor: themeColor }}>
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir">Tidak Hadir</option>
                <option value="ragu">Ragu-ragu</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Jumlah Tamu" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-4 bg-transparent border-b-2 focus:outline-none font-bold" style={{ borderColor: themeColor }} />
              )}
              <textarea placeholder="Pesan" rows={3} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-4 bg-transparent border-b-2 focus:outline-none placeholder-[#8B5A2B]/50 font-bold" style={{ borderColor: themeColor }}></textarea>
              <button type="submit" className="w-full py-4 text-white font-bold uppercase tracking-widest transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>Kirim Konfirmasi</button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl font-bold uppercase mb-8" style={{ color: themeColor }}>Buku Tamu</h2>
            <form onSubmit={submitGuestbook} className="space-y-4 mb-8">
              <input type="text" placeholder="Nama Anda" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-4 border-2 focus:outline-none bg-white/50 font-bold" style={{ borderColor: themeColor }} />
              <textarea placeholder="Tulis ucapan..." rows={2} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-4 border-2 focus:outline-none bg-white/50 font-bold" style={{ borderColor: themeColor }}></textarea>
              <button type="submit" className="px-8 py-4 text-white uppercase font-bold tracking-widest hover:opacity-90 transition-opacity" style={{ backgroundColor: themeColor }}>Kirim Ucapan</button>
            </form>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="p-4 bg-white/50 border-l-4" style={{ borderLeftColor: themeColor }}>
                  <p className="font-bold text-lg mb-1" style={{ color: themeColor }}>{m.guest_name}</p>
                  <p className="text-[#5C4033] font-medium italic">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-20 px-6 text-center text-white" style={{ backgroundColor: themeColor }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-6">Amplop Digital</h2>
          <p className="mb-10 text-white/80 leading-relaxed italic">Tanpa mengurangi rasa hormat, bagi Anda yang ingin memberikan tanda kasih untuk kami, dapat melalui:</p>
          
          <div className="bg-[#F4ECD8] text-[#5C4033] p-8 mb-10 border-4 border-dashed border-[#5C4033]/20">
            <p className="text-3xl font-bold tracking-widest mb-2 font-sans">1234 5678 90</p>
            <p className="font-bold opacity-80 mb-6 uppercase tracking-widest">BCA a.n. {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Rekening disalin');}} className="px-8 py-3 text-white font-bold uppercase tracking-widest transition-colors hover:opacity-90 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]" style={{ backgroundColor: themeColor }}>
              Salin Rekening
            </button>
          </div>

          <form onSubmit={submitGift} className="space-y-4 text-left">
            <input type="text" placeholder="Nama Anda" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-4 bg-black/20 border-b-2 border-white/30 text-white placeholder-white/50 focus:outline-none font-bold" />
            <input type="text" placeholder="Dari Bank (cth: BCA, Mandiri)" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-4 bg-black/20 border-b-2 border-white/30 text-white placeholder-white/50 focus:outline-none font-bold" />
            <input type="number" placeholder="Nominal (Opsional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-4 bg-black/20 border-b-2 border-white/30 text-white placeholder-white/50 focus:outline-none font-bold" />
            <button type="submit" className="w-full py-4 bg-[#F4ECD8] text-[#5C4033] font-bold uppercase tracking-widest hover:bg-white transition-colors">Kirim Konfirmasi</button>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-[#5C4033] font-bold text-xs uppercase tracking-widest bg-[#F4ECD8]">
        <p>Marryland Vintage Collection</p>
      </footer>
    </div>
  );
}
