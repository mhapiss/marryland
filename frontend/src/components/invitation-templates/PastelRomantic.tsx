import React from 'react';
import { TemplateProps } from './types';

export default function PastelRomantic({ data, forms }: TemplateProps) {
  const { invitation, guestName, timeLeft, messages } = data;
  const { rsvp, setRsvp, submitRsvp, gbName, setGbName, gbMessage, setGbMessage, submitGuestbook, gift, setGift, submitGift } = forms;

  const themeColor = invitation.theme_color || invitation.invitation_templates?.default_theme_color || '#F4C2C2';

  return (
    <div className="font-sans bg-[#FFF9F9] text-[#594A4E] min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center text-center p-6 overflow-hidden bg-gradient-to-br from-[#FFF0F0] to-[#FFF9F9]">
        {/* Soft pastel blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full blur-[80px] opacity-40 mix-blend-multiply" style={{ backgroundColor: themeColor }}></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-[100px] opacity-30 mix-blend-multiply bg-[#FFE4E1]"></div>
        
        <div className="z-10 max-w-2xl animate-fade-in relative">
          <p className="tracking-widest uppercase text-xs mb-6 text-[#A08C90] font-medium">Save The Date</p>
          <h1 className="text-6xl md:text-8xl font-bold mb-4" style={{ color: themeColor, fontFamily: 'cursive' }}>
            {invitation.groom_name} & {invitation.bride_name}
          </h1>
          <p className="text-xl font-medium text-[#8F7A7E] mb-12">
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] inline-block shadow-sm border border-white">
            <p className="text-sm font-medium text-[#A08C90] mb-3">Spesial untuk:</p>
            <p className="text-2xl font-bold text-[#594A4E]">{guestName}</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-20 text-center bg-white">
        <h2 className="text-3xl font-bold mb-10" style={{ color: themeColor }}>Menghitung Hari</h2>
        <div className="flex justify-center gap-4 md:gap-8 px-4">
          {[
            { label: 'Hari', value: timeLeft.d },
            { label: 'Jam', value: timeLeft.h },
            { label: 'Menit', value: timeLeft.m },
            { label: 'Detik', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-[#FFF9F9] rounded-full border shadow-sm" style={{ borderColor: themeColor }}>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: themeColor }}>
                {item.value}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A08C90] mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Story */}
      {invitation.couple_story && (
        <section className="py-20 px-6 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8" style={{ color: themeColor }}>Cerita Kami</h2>
          <p className="text-[#8F7A7E] leading-relaxed text-lg font-medium">{invitation.couple_story}</p>
        </section>
      )}

      {/* Event Details */}
      <section className="py-20 px-6 bg-[#FFF0F0]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center" style={{ color: themeColor }}>Detail Acara</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] text-center shadow-sm border border-white">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#FFF9F9]" style={{ color: themeColor }}>♡</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Akad Nikah</h3>
              <p className="text-[#8F7A7E] mb-6 font-medium">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-8">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white text-sm font-bold tracking-wider uppercase rounded-full transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: themeColor }}>
                  Lihat Peta
                </a>
              )}
            </div>
            
            <div className="bg-white p-10 rounded-[40px] text-center shadow-sm border border-white">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#FFF9F9]" style={{ color: themeColor }}>♡</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Resepsi</h3>
              <p className="text-[#8F7A7E] mb-6 font-medium">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-8">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white text-sm font-bold tracking-wider uppercase rounded-full transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: themeColor }}>
                  Lihat Peta
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-20 px-6 max-w-5xl mx-auto bg-white rounded-3xl -mt-10 relative z-20 shadow-sm border border-[#FFF0F0]">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-3xl font-bold mb-8" style={{ color: themeColor }}>RSVP</h2>
            <form onSubmit={submitRsvp} className="space-y-4">
              <input type="text" placeholder="Nama Anda" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-4 bg-[#FFF9F9] border-none rounded-2xl focus:ring-2" style={{ outlineColor: themeColor }} />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-4 bg-[#FFF9F9] border-none rounded-2xl focus:ring-2" style={{ outlineColor: themeColor }}>
                <option value="hadir">Pasti Hadir</option>
                <option value="tidak_hadir">Maaf, Berhalangan</option>
                <option value="ragu">Mungkin Hadir</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Jumlah Orang" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-4 bg-[#FFF9F9] border-none rounded-2xl focus:ring-2" style={{ outlineColor: themeColor }} />
              )}
              <textarea placeholder="Pesan singkat" rows={3} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-4 bg-[#FFF9F9] border-none rounded-2xl focus:ring-2" style={{ outlineColor: themeColor }}></textarea>
              <button type="submit" className="w-full py-4 text-white font-bold uppercase tracking-wider rounded-2xl transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: themeColor }}>Kirim RSVP</button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-8" style={{ color: themeColor }}>Kirim Ucapan</h2>
            <form onSubmit={submitGuestbook} className="space-y-4 mb-8">
              <input type="text" placeholder="Nama Anda" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-4 bg-transparent border-b-2 focus:outline-none font-bold" style={{ borderColor: themeColor }} />
              <textarea placeholder="Tuliskan ucapan selamat..." rows={2} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-4 bg-transparent border-b-2 focus:outline-none font-medium" style={{ borderColor: themeColor }}></textarea>
              <button type="submit" className="w-full py-4 text-white font-bold uppercase tracking-wider rounded-2xl transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: themeColor }}>Kirim Ucapan</button>
            </form>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="p-5 bg-[#FFF9F9] rounded-2xl">
                  <p className="font-bold text-[#594A4E] mb-1">{m.guest_name}</p>
                  <p className="text-[#8F7A7E] text-sm">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-20 px-6 text-center text-white mt-10" style={{ backgroundColor: themeColor }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-6 font-serif">Hadiah Digital</h2>
          <p className="mb-10 text-white/90 leading-relaxed font-medium">Doa restu Anda adalah karunia terbesar bagi kami. Jika Anda ingin memberikan hadiah, silakan melalui rekening di bawah ini:</p>
          
          <div className="bg-white text-[#594A4E] p-8 rounded-3xl mb-10 shadow-lg">
            <p className="text-3xl font-bold tracking-widest mb-2 font-sans">1234 5678 90</p>
            <p className="font-bold text-[#8F7A7E] mb-6 uppercase tracking-widest text-sm">BCA a.n. {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Rekening disalin');}} className="px-8 py-3 text-white font-bold uppercase tracking-widest rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
              Salin Rekening
            </button>
          </div>

          <form onSubmit={submitGift} className="space-y-4 text-left">
            <input type="text" placeholder="Nama Anda" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-4 bg-white/20 border-none text-white placeholder-white/70 rounded-2xl focus:outline-none font-bold" />
            <input type="text" placeholder="Dari Bank (cth: BCA, Mandiri)" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-4 bg-white/20 border-none text-white placeholder-white/70 rounded-2xl focus:outline-none font-bold" />
            <input type="number" placeholder="Nominal (Opsional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-4 bg-white/20 border-none text-white placeholder-white/70 rounded-2xl focus:outline-none font-bold" />
            <button type="submit" className="w-full py-4 bg-white font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-colors shadow-sm" style={{ color: themeColor }}>Kirim Konfirmasi</button>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-[#A08C90] font-bold text-xs uppercase tracking-widest bg-white">
        <p>Marryland Romantic Series</p>
      </footer>
    </div>
  );
}
