import React from 'react';
import { TemplateProps } from './types';

export default function IslamiGreen({ data, forms }: TemplateProps) {
  const { invitation, guestName, timeLeft, messages } = data;
  const { rsvp, setRsvp, submitRsvp, gbName, setGbName, gbMessage, setGbMessage, submitGuestbook, gift, setGift, submitGift } = forms;

  const themeColor = invitation.theme_color || invitation.invitation_templates?.default_theme_color || '#2E5041';

  return (
    <div className="font-serif bg-[#F4F9F6] text-[#1A2E25] min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center p-6 overflow-hidden">
        {/* Islamic Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at center, #2E5041 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="z-10 max-w-2xl animate-fade-in relative bg-white/80 p-12 rounded-t-[100px] border border-[#D1E2D9] shadow-sm">
          <div className="text-3xl mb-6 opacity-80" style={{ color: themeColor }}>﷽</div>
          <p className="tracking-widest uppercase text-xs mb-8" style={{ color: themeColor }}>Walimatul 'Urs</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#1A2E25]">
            {invitation.groom_name} & {invitation.bride_name}
          </h1>
          <p className="text-lg mb-10 text-[#436856]">
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="border-t border-[#D1E2D9] pt-6 mt-4">
            <p className="text-sm font-medium uppercase tracking-widest text-[#698F7C] mb-2">Kepada Yth.</p>
            <p className="text-2xl font-bold text-[#1A2E25]">{guestName}</p>
          </div>
        </div>
      </section>

      {/* Couple Story / Ayat */}
      {invitation.couple_story && (
        <section className="py-20 px-6 max-w-2xl mx-auto text-center">
          <p className="text-lg leading-loose text-[#436856] italic">
            "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang."
          </p>
          <p className="mt-4 text-sm font-bold text-[#698F7C] uppercase tracking-widest">(QS. Ar-Rum: 21)</p>
          
          <div className="mt-12 w-16 h-px mx-auto" style={{ backgroundColor: themeColor }}></div>
          <p className="mt-12 text-[#436856] leading-relaxed">{invitation.couple_story}</p>
        </section>
      )}

      {/* Countdown Section */}
      <section className="py-16 text-center bg-white border-y border-[#D1E2D9]">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-10" style={{ color: themeColor }}>Menuju Hari Bahagia</h2>
        <div className="flex justify-center gap-6 px-4">
          {[
            { label: 'Hari', value: timeLeft.d },
            { label: 'Jam', value: timeLeft.h },
            { label: 'Menit', value: timeLeft.m },
            { label: 'Detik', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-[#1A2E25]">
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#698F7C]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Event Details */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-12 text-center" style={{ color: themeColor }}>Rangkaian Acara</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-tr-[50px] rounded-bl-[50px] text-center border border-[#D1E2D9] shadow-sm">
              <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Akad Nikah</h3>
              <p className="text-[#436856] mb-6">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-8 text-[#1A2E25]">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white text-sm font-bold tracking-widest uppercase rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  Google Maps
                </a>
              )}
            </div>
            
            <div className="bg-white p-10 rounded-tl-[50px] rounded-br-[50px] text-center border border-[#D1E2D9] shadow-sm">
              <h3 className="text-2xl font-bold mb-4" style={{ color: themeColor }}>Resepsi</h3>
              <p className="text-[#436856] mb-6">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-8 text-[#1A2E25]">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-3 text-white text-sm font-bold tracking-widest uppercase rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-20 px-6 max-w-5xl mx-auto border-t border-[#D1E2D9]">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-2xl font-bold uppercase mb-8" style={{ color: themeColor }}>Kehadiran</h2>
            <form onSubmit={submitRsvp} className="space-y-4">
              <input type="text" placeholder="Nama" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-4 bg-white border border-[#D1E2D9] rounded-xl focus:outline-none focus:border-[#2E5041]" />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-4 bg-white border border-[#D1E2D9] rounded-xl focus:outline-none focus:border-[#2E5041]">
                <option value="hadir">Insya Allah Hadir</option>
                <option value="tidak_hadir">Maaf, Tidak Bisa Hadir</option>
                <option value="ragu">Masih Ragu-ragu</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Jumlah Tamu" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-4 bg-white border border-[#D1E2D9] rounded-xl focus:outline-none focus:border-[#2E5041]" />
              )}
              <textarea placeholder="Pesan singkat" rows={3} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-4 bg-white border border-[#D1E2D9] rounded-xl focus:outline-none focus:border-[#2E5041]"></textarea>
              <button type="submit" className="w-full py-4 text-white font-bold uppercase tracking-widest rounded-xl transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>Kirim RSVP</button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold uppercase mb-8" style={{ color: themeColor }}>Doa & Ucapan</h2>
            <form onSubmit={submitGuestbook} className="space-y-4 mb-8">
              <input type="text" placeholder="Nama Anda" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-4 bg-white border border-[#D1E2D9] rounded-xl focus:outline-none focus:border-[#2E5041]" />
              <textarea placeholder="Tuliskan doa untuk pengantin..." rows={3} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-4 bg-white border border-[#D1E2D9] rounded-xl focus:outline-none focus:border-[#2E5041]"></textarea>
              <button type="submit" className="w-full py-4 border-2 font-bold uppercase tracking-widest rounded-xl hover:text-white transition-colors" style={{ borderColor: themeColor, color: themeColor }}>Kirim Doa</button>
            </form>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="p-5 bg-white rounded-xl border border-[#D1E2D9]">
                  <p className="font-bold text-[#1A2E25] mb-1">{m.guest_name}</p>
                  <p className="text-[#436856] text-sm">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-20 px-6 text-center text-white" style={{ backgroundColor: themeColor }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Tanda Kasih</h2>
          <p className="mb-10 text-white/80 leading-relaxed">Kehadiran serta doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah. Namun, jika ingin mengirimkan tanda kasih, dapat melalui:</p>
          
          <div className="bg-white text-[#1A2E25] p-8 rounded-2xl mb-10 shadow-lg">
            <p className="text-3xl font-bold tracking-widest mb-2 font-sans">1234 5678 90</p>
            <p className="font-bold text-[#698F7C] mb-6 uppercase tracking-widest">BCA a.n. {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Rekening disalin');}} className="px-8 py-3 text-white font-bold uppercase tracking-widest rounded-full transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
              Salin Nomor
            </button>
          </div>

          <form onSubmit={submitGift} className="space-y-4 text-left">
            <input type="text" placeholder="Nama Anda" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-4 bg-black/20 border border-white/20 text-white rounded-xl focus:outline-none" />
            <input type="text" placeholder="Dari Bank (cth: BSI, BCA)" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-4 bg-black/20 border border-white/20 text-white rounded-xl focus:outline-none" />
            <input type="number" placeholder="Nominal (Opsional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-4 bg-black/20 border border-white/20 text-white rounded-xl focus:outline-none" />
            <button type="submit" className="w-full py-4 bg-white text-[#1A2E25] font-bold uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-colors">Konfirmasi Hadiah</button>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-[#698F7C] font-bold text-xs uppercase tracking-widest bg-white">
        <p>Wassalamu'alaikum Warahmatullahi Wabarakatuh</p>
      </footer>
    </div>
  );
}
