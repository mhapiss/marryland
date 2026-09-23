import React from 'react';
import { TemplateProps } from './types';

export default function LuxuryGold({ data, forms }: TemplateProps) {
  const { invitation, guestName, timeLeft, messages } = data;
  const { rsvp, setRsvp, submitRsvp, gbName, setGbName, gbMessage, setGbMessage, submitGuestbook, gift, setGift, submitGift } = forms;

  const themeColor = invitation.theme_color || invitation.invitation_templates?.default_theme_color || '#D4AF37';

  return (
    <div className="font-serif bg-[#111111] text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] overflow-hidden">
        {/* Subtle gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[150px] opacity-20 pointer-events-none" style={{ backgroundColor: themeColor }}></div>
        
        <div className="z-10 max-w-3xl animate-fade-in border border-white/10 p-12 bg-black/40 backdrop-blur-md">
          <p className="tracking-[0.4em] uppercase text-xs mb-8" style={{ color: themeColor }}>The Wedding Celebration</p>
          <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-wide">
            {invitation.groom_name} <br/> <span className="text-4xl italic" style={{ color: themeColor }}>and</span> <br/> {invitation.bride_name}
          </h1>
          <p className="text-xl tracking-widest uppercase mb-12 opacity-80 border-b border-white/20 pb-6">
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="inline-block mt-4">
            <p className="text-xs uppercase tracking-[0.3em] mb-3 text-white/50">Cordially Invited</p>
            <p className="text-3xl font-light" style={{ color: themeColor }}>{guestName}</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-24 text-center bg-[#151515]">
        <h2 className="text-sm uppercase tracking-[0.4em] mb-12" style={{ color: themeColor }}>Time Until I Do</h2>
        <div className="flex justify-center gap-6 px-4">
          {[
            { label: 'Days', value: timeLeft.d },
            { label: 'Hours', value: timeLeft.h },
            { label: 'Mins', value: timeLeft.m },
            { label: 'Secs', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center w-24">
              <div className="text-5xl md:text-6xl font-light mb-4 text-white">
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="text-xs uppercase tracking-widest" style={{ color: themeColor }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Story */}
      {invitation.couple_story && (
        <section className="py-24 px-6 max-w-4xl mx-auto text-center border-y border-white/10">
          <h2 className="text-sm uppercase tracking-[0.4em] mb-12" style={{ color: themeColor }}>Our Journey</h2>
          <p className="text-xl leading-loose font-light opacity-80">{invitation.couple_story}</p>
        </section>
      )}

      {/* Event Details */}
      <section className="py-24 px-6 bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm uppercase tracking-[0.4em] mb-16 text-center" style={{ color: themeColor }}>The Event Details</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-[#111111] p-12 text-center border border-white/10 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1" style={{ backgroundColor: themeColor }}></div>
              <h3 className="text-3xl font-light uppercase tracking-widest mb-6" style={{ color: themeColor }}>Holy Matrimony</h3>
              <p className="text-white/60 mb-6 font-sans tracking-wide">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="text-lg mb-10">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-4 text-black text-xs font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  View Map Location
                </a>
              )}
            </div>
            
            <div className="bg-[#111111] p-12 text-center border border-white/10 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1" style={{ backgroundColor: themeColor }}></div>
              <h3 className="text-3xl font-light uppercase tracking-widest mb-6" style={{ color: themeColor }}>Wedding Reception</h3>
              <p className="text-white/60 mb-6 font-sans tracking-wide">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="text-lg mb-10">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="inline-block px-8 py-4 text-black text-xs font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>
                  View Map Location
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-white/10">
        <div className="grid lg:grid-cols-2 gap-20">
          
          <div>
            <h2 className="text-sm uppercase tracking-[0.4em] mb-12" style={{ color: themeColor }}>RSVP</h2>
            <form onSubmit={submitRsvp} className="space-y-6">
              <input type="text" placeholder="Full Name" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-4 bg-[#1A1A1A] border border-white/20 text-white focus:outline-none focus:border-white font-sans" />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-4 bg-[#1A1A1A] border border-white/20 text-white focus:outline-none focus:border-white font-sans">
                <option value="hadir">Joyfully Accept</option>
                <option value="tidak_hadir">Regretfully Decline</option>
                <option value="ragu">Tentative</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Number of Guests" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-4 bg-[#1A1A1A] border border-white/20 text-white focus:outline-none focus:border-white font-sans" />
              )}
              <textarea placeholder="Message (Optional)" rows={3} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-4 bg-[#1A1A1A] border border-white/20 text-white focus:outline-none focus:border-white font-sans"></textarea>
              <button type="submit" className="w-full py-5 text-black font-bold uppercase tracking-[0.2em] text-xs transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>Submit RSVP</button>
            </form>
          </div>

          <div>
            <h2 className="text-sm uppercase tracking-[0.4em] mb-12" style={{ color: themeColor }}>Guestbook</h2>
            <form onSubmit={submitGuestbook} className="space-y-6 mb-12">
              <input type="text" placeholder="Your Name" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-4 border-b border-white/20 focus:outline-none focus:border-white bg-transparent font-sans text-white" />
              <textarea placeholder="Write your wishes..." rows={2} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-4 border-b border-white/20 focus:outline-none focus:border-white bg-transparent font-sans text-white"></textarea>
              <button type="submit" className="w-full py-4 border text-white uppercase text-xs tracking-[0.2em] transition-colors hover:bg-white hover:text-black" style={{ borderColor: themeColor }}>Send Wishes</button>
            </form>

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="p-6 bg-[#1A1A1A] border-l-2" style={{ borderLeftColor: themeColor }}>
                  <p className="font-bold text-lg mb-2 text-white">{m.guest_name}</p>
                  <p className="text-white/60 font-light leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-24 px-6 text-center text-black" style={{ backgroundColor: themeColor }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-sm font-bold uppercase tracking-[0.4em] mb-4 text-black/60">Digital Gift</h2>
          <h3 className="text-4xl font-light uppercase tracking-widest mb-8">Wedding Gift</h3>
          <p className="mb-12 font-medium text-black/80 leading-relaxed font-sans">Your presence is the most beautiful gift. However, if you wish to honor us with a gift, you may use the details below.</p>
          
          <div className="bg-black text-white p-10 mb-12">
            <p className="text-3xl font-light tracking-widest mb-4">1234 5678 90</p>
            <p className="font-bold text-white/60 mb-8 uppercase text-xs tracking-[0.2em]">BCA a.n. {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Copied!');}} className="px-8 py-4 border border-white text-white text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-black">
              Copy Account Details
            </button>
          </div>

          <form onSubmit={submitGift} className="space-y-4 text-left">
            <input type="text" placeholder="Sender Name" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-4 bg-black/10 border border-black/20 text-black placeholder-black/50 focus:outline-none font-medium font-sans" />
            <input type="text" placeholder="From Bank" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-4 bg-black/10 border border-black/20 text-black placeholder-black/50 focus:outline-none font-medium font-sans" />
            <input type="number" placeholder="Amount (Optional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-4 bg-black/10 border border-black/20 text-black placeholder-black/50 focus:outline-none font-medium font-sans" />
            <button type="submit" className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.2em] text-xs transition-colors hover:bg-gray-900">Confirm Transfer</button>
          </form>
        </div>
      </section>

      <footer className="py-12 text-center text-white/40 font-light text-xs uppercase tracking-[0.3em] bg-[#0A0A0A]">
        <p>A Marryland Luxury Signature</p>
      </footer>
    </div>
  );
}
