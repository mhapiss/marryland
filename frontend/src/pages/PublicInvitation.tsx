import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PublicInvitation() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const guestName = searchParams.get('to') || 'Tamu Undangan';
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [rsvp, setRsvp] = useState({ name: guestName, attendance: 'hadir', count: 1, message: '' });
  const [gbMessage, setGbMessage] = useState('');
  const [gbName, setGbName] = useState(guestName);
  const [gift, setGift] = useState({ name: guestName, bank: '', amount: '', note: '' });

  // Data states
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchInvitation();
  }, [slug]);

  const fetchInvitation = async () => {
    if (!slug) return;
    const { data } = await supabase.from('invitations').select('*').eq('slug', slug).single();
    if (data) {
      setInvitation(data);
      // Log view
      await supabase.from('invitation_views').insert({ invitation_id: data.id, guest_slug: guestName });
      
      // Fetch messages
      const { data: msgs } = await supabase.from('guestbook_messages').select('*').eq('invitation_id', data.id).order('created_at', { ascending: false });
      if (msgs) setMessages(msgs);
    }
    setLoading(false);
  };

  const submitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('rsvp_responses').insert({
      invitation_id: invitation.id,
      guest_name: rsvp.name,
      attendance: rsvp.attendance,
      jumlah_tamu: rsvp.count,
      message: rsvp.message
    });
    alert('Terima kasih atas konfirmasinya!');
    setRsvp({ ...rsvp, message: '' });
  };

  const submitGuestbook = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from('guestbook_messages').insert({
      invitation_id: invitation.id,
      guest_name: gbName,
      message: gbMessage
    }).select().single();
    if (data) {
      setMessages([data, ...messages]);
      setGbMessage('');
    }
  };

  const submitGift = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('digital_gifts').insert({
      invitation_id: invitation.id,
      guest_name: gift.name,
      bank_name: gift.bank,
      amount: gift.amount ? parseInt(gift.amount) : null,
      note: gift.note
    });
    alert('Terima kasih atas pemberian Anda!');
    setGift({ name: guestName, bank: '', amount: '', note: '' });
  };

  // Countdown logic
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!invitation?.event_date) return;
    const eventTime = new Date(invitation.event_date).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = eventTime - now;
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [invitation?.event_date]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F0F5F1]">Memuat...</div>;
  if (!invitation || !invitation.is_published) return <div className="min-h-screen flex items-center justify-center bg-[#F0F5F1]">Undangan belum tersedia.</div>;

  return (
    <div className="font-serif bg-[#F0F5F1] min-h-screen text-[#1E2D21]">
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#D5E5D7] to-[#F0F5F1] overflow-hidden">
        {/* Ambient floating decos */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#6B8F71]/10 rounded-full blur-3xl animate-float-slow"></div>

        <div className="z-10 max-w-2xl animate-fade-in">
          <p className="tracking-widest uppercase text-sm mb-4">Pernikahan</p>
          <h1 className="text-5xl md:text-7xl font-bold text-[#375A3D] mb-4">
            {invitation.groom_name} & {invitation.bride_name}
          </h1>
          <p className="text-xl italic text-[#5E7262] mb-12">
            {new Date(invitation.event_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl inline-block shadow-soft border border-white">
            <p className="text-sm text-[#5E7262] mb-2">Kepada Yth. Bapak/Ibu/Saudara/i</p>
            <p className="text-2xl font-bold text-[#1E2D21]">{guestName}</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold text-[#375A3D] mb-8">Menuju Hari Bahagia</h2>
        <div className="flex justify-center gap-4 md:gap-8">
          {[
            { label: 'Hari', value: timeLeft.d },
            { label: 'Jam', value: timeLeft.h },
            { label: 'Menit', value: timeLeft.m },
            { label: 'Detik', value: timeLeft.s }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center w-20 md:w-24">
              <div className="bg-white text-[#375A3D] text-3xl md:text-4xl font-bold p-4 md:p-6 rounded-2xl shadow-sm border border-[#E0EDE2] w-full aspect-square flex items-center justify-center mb-2">
                {item.value}
              </div>
              <span className="text-sm font-sans uppercase tracking-wider text-[#5E7262]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cerita Pasangan */}
      {invitation.couple_story && (
        <section className="py-16 px-6 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#375A3D] mb-6">Kisah Kami</h2>
          <p className="text-[#5E7262] leading-relaxed font-sans">{invitation.couple_story}</p>
        </section>
      )}

      {/* Event Details */}
      <section className="py-20 px-6 bg-white rounded-t-[3rem]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#375A3D] mb-12 text-center">Detail Acara</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Akad */}
            <div className="bg-[#F5F8F5] p-8 rounded-3xl text-center border border-[#E0EDE2]">
              <h3 className="text-2xl font-bold text-[#486B4E] mb-2">Akad Nikah</h3>
              <p className="font-sans text-[#5E7262] mb-4">{invitation.akad_time || '08:00 - Selesai'}</p>
              <p className="font-sans font-medium mb-6">{invitation.akad_location}</p>
              {invitation.akad_maps_url && (
                <a href={invitation.akad_maps_url} target="_blank" rel="noreferrer" className="inline-block px-6 py-2 bg-[#6B8F71] text-white font-sans font-medium rounded-full hover:bg-[#5A7D60] transition-colors">
                  Buka Google Maps
                </a>
              )}
            </div>
            
            {/* Resepsi */}
            <div className="bg-[#F5F8F5] p-8 rounded-3xl text-center border border-[#E0EDE2]">
              <h3 className="text-2xl font-bold text-[#486B4E] mb-2">Resepsi</h3>
              <p className="font-sans text-[#5E7262] mb-4">{invitation.resepsi_time || '11:00 - Selesai'}</p>
              <p className="font-sans font-medium mb-6">{invitation.resepsi_location}</p>
              {invitation.resepsi_maps_url && (
                <a href={invitation.resepsi_maps_url} target="_blank" rel="noreferrer" className="inline-block px-6 py-2 bg-[#6B8F71] text-white font-sans font-medium rounded-full hover:bg-[#5A7D60] transition-colors">
                  Buka Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RSVP & Guestbook */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          
          {/* RSVP Form */}
          <div>
            <h2 className="text-3xl font-bold text-[#375A3D] mb-6">Konfirmasi Kehadiran</h2>
            <form onSubmit={submitRsvp} className="space-y-4 font-sans bg-white p-6 rounded-3xl border border-[#E0EDE2]">
              <input type="text" placeholder="Nama" value={rsvp.name} onChange={e => setRsvp({...rsvp, name: e.target.value})} required className="w-full p-3 rounded-xl bg-[#F5F8F5] border-none focus:ring-2 focus:ring-[#6B8F71]" />
              <select value={rsvp.attendance} onChange={e => setRsvp({...rsvp, attendance: e.target.value})} className="w-full p-3 rounded-xl bg-[#F5F8F5] border-none focus:ring-2 focus:ring-[#6B8F71]">
                <option value="hadir">Hadir</option>
                <option value="tidak_hadir">Tidak Hadir</option>
                <option value="ragu">Mungkin / Ragu-ragu</option>
              </select>
              {rsvp.attendance === 'hadir' && (
                <input type="number" min="1" placeholder="Jumlah Tamu" value={rsvp.count} onChange={e => setRsvp({...rsvp, count: parseInt(e.target.value)})} className="w-full p-3 rounded-xl bg-[#F5F8F5] border-none focus:ring-2 focus:ring-[#6B8F71]" />
              )}
              <textarea placeholder="Pesan singkat (opsional)" rows={2} value={rsvp.message} onChange={e => setRsvp({...rsvp, message: e.target.value})} className="w-full p-3 rounded-xl bg-[#F5F8F5] border-none focus:ring-2 focus:ring-[#6B8F71]"></textarea>
              <button type="submit" className="w-full py-3 bg-[#375A3D] text-white font-medium rounded-xl hover:bg-[#264A2C] transition-colors">Kirim Konfirmasi</button>
            </form>
          </div>

          {/* Guestbook */}
          <div>
            <h2 className="text-3xl font-bold text-[#375A3D] mb-6">Kirim Ucapan</h2>
            <form onSubmit={submitGuestbook} className="space-y-4 font-sans bg-white p-6 rounded-3xl border border-[#E0EDE2] mb-8">
              <input type="text" placeholder="Nama Anda" value={gbName} onChange={e => setGbName(e.target.value)} required className="w-full p-3 rounded-xl bg-[#F5F8F5] border-none focus:ring-2 focus:ring-[#6B8F71]" />
              <textarea placeholder="Tulis ucapan dan doa..." rows={3} value={gbMessage} onChange={e => setGbMessage(e.target.value)} required className="w-full p-3 rounded-xl bg-[#F5F8F5] border-none focus:ring-2 focus:ring-[#6B8F71]"></textarea>
              <button type="submit" className="w-full py-3 bg-[#6B8F71] text-white font-medium rounded-xl hover:bg-[#5A7D60] transition-colors">Kirim Ucapan</button>
            </form>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {messages.map(m => (
                <div key={m.id} className="bg-white p-4 rounded-2xl border border-[#E0EDE2]">
                  <p className="font-bold text-[#375A3D] font-sans">{m.guest_name}</p>
                  <p className="text-[#5E7262] font-sans text-sm mt-1">{m.message}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </section>

      {/* Amplop Digital */}
      <section className="py-20 px-6 bg-[#375A3D] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Amplop Digital</h2>
          <p className="mb-10 text-[#D5E5D7] font-sans">Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika Anda ingin memberikan tanda kasih, dapat mengirimkan melalui:</p>
          
          <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20 mb-8 max-w-sm mx-auto">
            <p className="font-sans font-bold text-xl mb-1">BCA - 1234567890</p>
            <p className="font-sans text-[#D5E5D7] mb-4">a.n. {invitation.groom_name}</p>
            <button onClick={() => {navigator.clipboard.writeText('1234567890'); alert('Rekening disalin');}} className="px-6 py-2 bg-white text-[#375A3D] font-sans font-medium rounded-full hover:bg-gray-100 transition-colors text-sm">
              Salin Nomor Rekening
            </button>
          </div>

          <h3 className="text-xl font-bold mb-4">Konfirmasi Pengiriman</h3>
          <form onSubmit={submitGift} className="space-y-3 font-sans text-left max-w-sm mx-auto bg-white/5 p-6 rounded-3xl border border-white/10">
            <input type="text" placeholder="Nama Anda" value={gift.name} onChange={e => setGift({...gift, name: e.target.value})} required className="w-full p-3 rounded-xl bg-white/10 border-none text-white placeholder-gray-300 focus:ring-2 focus:ring-white" />
            <input type="text" placeholder="Dari Bank (cth: BCA, Mandiri)" value={gift.bank} onChange={e => setGift({...gift, bank: e.target.value})} required className="w-full p-3 rounded-xl bg-white/10 border-none text-white placeholder-gray-300 focus:ring-2 focus:ring-white" />
            <input type="number" placeholder="Nominal (Opsional)" value={gift.amount} onChange={e => setGift({...gift, amount: e.target.value})} className="w-full p-3 rounded-xl bg-white/10 border-none text-white placeholder-gray-300 focus:ring-2 focus:ring-white" />
            <button type="submit" className="w-full py-3 bg-white text-[#375A3D] font-medium rounded-xl hover:bg-gray-100 transition-colors">Kirim Konfirmasi</button>
          </form>
        </div>
      </section>

      <footer className="py-8 text-center text-[#5E7262] font-sans text-sm">
        <p>Made with ❤️ by Marryland</p>
      </footer>
    </div>
  );
}
