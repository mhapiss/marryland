import React from 'react';
import { TemplateProps } from './types';

export default function MinimalistModern({ data, forms }: TemplateProps) {
  const { invitation, guestName, timeLeft, messages } = data;
  const { rsvp, setRsvp, submitRsvp, gbName, setGbName, gbMessage, setGbMessage, submitGuestbook, gift, setGift, submitGift } = forms;

  const themeColor = invitation.theme_color || invitation.invitation_templates?.default_theme_color || '#333333';

  return (
    <div className="font-sans bg-white text-[#111111] min-h-screen selection:bg-black selection:text-white">
      {/* Header / Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center p-6 border-b-8" style={{ borderColor: themeColor }}>
        <div className="max-w-3xl w-full animate-fade-in">
          <p className="tracking-[0.3em] uppercase text-xs mb-8 text-gray-500 font-medium">We Are Getting Married</p>
          <h1 className="text-5xl md:text-8xl font-black mb-6 uppercase tracking-tight">
            {invitation.groom_name} <br/> <span style={{ color: themeColor }}>&</span> <br/> {invitation.bride_name}
          </h1>
          <div className="h-px w-24 bg-gray-300 mx-auto mb-6"></div>
          <p className="text-xl tracking-widest uppercase mb-16 font-light">
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' })}
          </p>
          
          <div className="border border-gray-200 p-8 inline-block">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">Prepared For</p>
            <p className="text-2xl font-bold uppercase tracking-wider">{guestName}</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-24 text-center">
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-12 text-gray-400">Countdown</h2>
        <div className="flex justify-center gap-6 px-4">
          {[
            { label: 'Days', value: timeLeft.d },
            { label: 'Hours', value: timeLeft.h },
            { label: 'Mins', value: timeLeft.m },
            { label: 'Secs', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-5xl md:text-7xl font-black mb-2" style={{ color: themeColor }}>
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Couple Story */}
      {invitation.couple_story && (
        <section className="py-24 px-6 max-w-3xl mx-auto bg-gray-50">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-8 text-gray-400">The Story</h2>
          <p className="text-xl md:text-2xl font-medium leading-relaxed text-gray-800">{invitation.couple_story}</p>
        </section>
      )}

      {/* Event Details */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-16 text-center text-gray-400">Event Details</h2>
          
          <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
            <div className="bg-white p-12 text-center md:text-left flex flex-col h-full">
              <h3 className="text-3xl font-black uppercase mb-2">Akad</h3>
              <p className="text-gray-500 mb-8 font-medium tracking-wide">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-auto">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="mt-8 inline-block px-6 py-4 text-white text-xs font-bold tracking-[0.2em] uppercase transition-colors" style={{ backgroundColor: themeColor }}>
                  Open Map
                </a>
              )}
            </div>
            
            <div className="bg-white p-12 text-center md:text-left flex flex-col h-full">
              <h3 className="text-3xl font-black uppercase mb-2">Resepsi</h3>
              <p className="text-gray-500 mb-8 font-medium tracking-wide">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="font-bold text-lg mb-auto">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="mt-8 inline-block px-6 py-4 text-white text-xs font-bold tracking-[0.2em] uppercase transition-colors" style={{ backgroundColor: themeColor }}>
                  Open Map
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-gray-200">
        <div className="grid lg:grid-cols-2 gap-20">
          
          <div>
            <h2 className="text-3xl font-black uppercase mb-8">RSVP</h2>
            <form onSubmit={submitRsvp} className="space-y-6">
              <input type="text" placeholder="Name" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-4 bg-gray-50 border border-gray-200 focus:outline-none focus:border-black font-medium" />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 focus:outline-none focus:border-black font-medium">
                <option value="hadir">Will Attend</option>
                <option value="tidak_hadir">Will Not Attend</option>
                <option value="ragu">Undecided</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Number of Guests" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 border border-gray-200 focus:outline-none focus:border-black font-medium" />
              )}
              <textarea placeholder="Message (Optional)" rows={3} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 focus:outline-none focus:border-black font-medium"></textarea>
              <button type="submit" className="w-full py-5 text-white font-bold uppercase tracking-[0.2em] text-xs transition-opacity hover:opacity-90" style={{ backgroundColor: themeColor }}>Submit RSVP</button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl font-black uppercase mb-8">Wishes</h2>
            <form onSubmit={submitGuestbook} className="space-y-4 mb-10">
              <input type="text" placeholder="Your Name" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-4 border-b-2 border-gray-200 focus:outline-none focus:border-black bg-transparent font-bold" />
              <textarea placeholder="Write a wish..." rows={2} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-4 border-b-2 border-gray-200 focus:outline-none focus:border-black bg-transparent font-medium"></textarea>
              <button type="submit" className="px-8 py-4 bg-black text-white uppercase font-bold text-xs tracking-[0.2em] hover:bg-gray-800 transition-colors">Send Wish</button>
            </form>

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="p-6 bg-gray-50 border border-gray-100">
                  <p className="font-black text-sm uppercase mb-2">{m.guest_name}</p>
                  <p className="text-gray-600 font-medium">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-24 px-6 text-center text-white" style={{ backgroundColor: themeColor }}>
        <div className="max-w-md mx-auto">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-4 text-white/60">Digital Gift</h2>
          <h3 className="text-4xl font-black uppercase mb-8">Send a Gift</h3>
          <p className="mb-12 font-medium text-white/80 leading-relaxed">Your blessings are the greatest gift. If you wish to send a digital gift, you may use the details below.</p>
          
          <div className="bg-black/20 p-8 mb-12">
            <p className="text-3xl font-black tracking-widest mb-2">1234 5678 90</p>
            <p className="font-bold text-white/60 mb-6 uppercase text-xs tracking-widest">BCA / {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Copied!');}} className="px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:bg-gray-200">
              Copy Account
            </button>
          </div>

          <form onSubmit={submitGift} className="space-y-4 text-left">
            <input type="text" placeholder="Sender Name" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-4 bg-black/10 border border-white/20 text-white placeholder-white/50 focus:outline-none font-medium" />
            <input type="text" placeholder="From Bank" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-4 bg-black/10 border border-white/20 text-white placeholder-white/50 focus:outline-none font-medium" />
            <input type="number" placeholder="Amount (Optional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-4 bg-black/10 border border-white/20 text-white placeholder-white/50 focus:outline-none font-medium" />
            <button type="submit" className="w-full py-5 bg-white text-black font-bold uppercase tracking-[0.2em] text-xs transition-colors hover:bg-gray-200">Confirm Transfer</button>
          </form>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-[0.2em] bg-gray-50 border-t border-gray-200">
        <p>Powered by Marryland</p>
      </footer>
    </div>
  );
}
