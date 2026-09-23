import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function EditInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'rsvp' | 'guestbook' | 'gifts'>('details');
  const [invitation, setInvitation] = useState<any>(null);
  
  // Stats
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [guestbook, setGuestbook] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [views, setViews] = useState(0);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    
    // Fetch invitation
    const { data: invData } = await supabase.from('invitations').select('*').eq('id', id).single();
    if (invData) setInvitation(invData);

    // Fetch stats
    const { data: rsvpData } = await supabase.from('rsvp_responses').select('*').eq('invitation_id', id);
    if (rsvpData) setRsvps(rsvpData);

    const { data: gbData } = await supabase.from('guestbook_messages').select('*').eq('invitation_id', id).order('created_at', { ascending: false });
    if (gbData) setGuestbook(gbData);

    const { data: giftData } = await supabase.from('digital_gifts').select('*').eq('invitation_id', id).order('created_at', { ascending: false });
    if (giftData) setGifts(giftData);

    const { count } = await supabase.from('invitation_views').select('*', { count: 'exact', head: true }).eq('invitation_id', id);
    setViews(count || 0);

    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setSaving(true);
    const { error } = await supabase
      .from('invitations')
      .update({
        slug: invitation.slug,
        groom_name: invitation.groom_name,
        bride_name: invitation.bride_name,
        event_date: invitation.event_date,
        akad_time: invitation.akad_time,
        akad_location: invitation.akad_location,
        akad_maps_url: invitation.akad_maps_url,
        resepsi_time: invitation.resepsi_time,
        resepsi_location: invitation.resepsi_location,
        resepsi_maps_url: invitation.resepsi_maps_url,
        couple_story: invitation.couple_story,
        theme_color: invitation.theme_color,
        template_id: invitation.template_id,
        is_published: invitation.is_published
      })
      .eq('id', invitation.id);
      
    setSaving(false);
    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Tersimpan!');
    }
  };

  if (loading) return <div className="p-10 text-center">Memuat data...</div>;
  if (!invitation) return <div className="p-10 text-center">Undangan tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-white border-b border-primary-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-muted hover:text-primary transition-colors">
              &larr; Kembali
            </button>
            <h1 className="font-serif font-bold text-lg">Edit Undangan: {invitation.groom_name} & {invitation.bride_name}</h1>
          </div>
          <div className="text-sm font-medium text-muted">
            Total Views: <span className="text-primary">{views}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-primary-100 mb-8 overflow-x-auto hide-scrollbar">
          {['details', 'rsvp', 'guestbook', 'gifts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 text-sm font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-text'
              }`}
            >
              {tab === 'details' ? 'Detail Acara' : tab === 'rsvp' ? 'Data RSVP' : tab === 'guestbook' ? 'Buku Tamu' : 'Amplop Digital'}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <form onSubmit={handleSave} className="space-y-8 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-primary-100">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Nama Pria</label>
                <input type="text" className="input-field" value={invitation.groom_name || ''} onChange={e => setInvitation({...invitation, groom_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nama Wanita</label>
                <input type="text" className="input-field" value={invitation.bride_name || ''} onChange={e => setInvitation({...invitation, bride_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">URL Slug (Unik)</label>
                <input type="text" className="input-field" value={invitation.slug || ''} onChange={e => setInvitation({...invitation, slug: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tanggal Acara Utama</label>
                <input type="date" className="input-field" value={invitation.event_date || ''} onChange={e => setInvitation({...invitation, event_date: e.target.value})} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-3">Pilih Template Visual</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'sage-green', name: 'Sage Green (Klasik)', color: 'bg-[#6B8F71]' },
                    { id: 'elegant-gold', name: 'Elegant Gold (Mewah)', color: 'bg-[#D4AF37]' },
                    { id: 'minimalist-blush', name: 'Minimal Blush (Modern)', color: 'bg-[#B88686]' }
                  ].map(tpl => (
                    <div 
                      key={tpl.id}
                      onClick={() => setInvitation({...invitation, template_id: tpl.id})}
                      className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
                        (invitation.template_id || 'sage-green') === tpl.id 
                          ? 'border-primary bg-primary-50 ring-2 ring-primary/20' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full mb-3 ${tpl.color} shadow-sm`}></div>
                      <span className="font-semibold text-sm text-center">{tpl.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-primary-100" />

            {/* Akad */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">Informasi Akad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Waktu (Cth: 08:00 - Selesai)</label>
                  <input type="text" className="input-field" value={invitation.akad_time || ''} onChange={e => setInvitation({...invitation, akad_time: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Lokasi / Tempat</label>
                  <textarea className="input-field" rows={2} value={invitation.akad_location || ''} onChange={e => setInvitation({...invitation, akad_location: e.target.value})}></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Link Google Maps (Opsional)</label>
                  <input type="url" className="input-field" value={invitation.akad_maps_url || ''} onChange={e => setInvitation({...invitation, akad_maps_url: e.target.value})} />
                </div>
              </div>
            </div>

            <hr className="border-primary-100" />

            {/* Resepsi */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">Informasi Resepsi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Waktu (Cth: 11:00 - 14:00)</label>
                  <input type="text" className="input-field" value={invitation.resepsi_time || ''} onChange={e => setInvitation({...invitation, resepsi_time: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Lokasi / Tempat</label>
                  <textarea className="input-field" rows={2} value={invitation.resepsi_location || ''} onChange={e => setInvitation({...invitation, resepsi_location: e.target.value})}></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Link Google Maps (Opsional)</label>
                  <input type="url" className="input-field" value={invitation.resepsi_maps_url || ''} onChange={e => setInvitation({...invitation, resepsi_maps_url: e.target.value})} />
                </div>
              </div>
            </div>

            <hr className="border-primary-100" />

            {/* Cerita */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-primary">Cerita Pasangan</h3>
              <textarea className="input-field" rows={4} placeholder="Tulis cerita singkat perjalanan cinta..." value={invitation.couple_story || ''} onChange={e => setInvitation({...invitation, couple_story: e.target.value})}></textarea>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-primary-100">
              <input type="checkbox" id="is_published" checked={invitation.is_published} onChange={e => setInvitation({...invitation, is_published: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary border-primary-200" />
              <label htmlFor="is_published" className="font-medium text-text">Publikasikan Undangan</label>
            </div>

            <div className="pt-6">
              <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto px-12">
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}

        {/* RSVP Tab */}
        {activeTab === 'rsvp' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary-100">
            <h3 className="text-xl font-bold mb-6">Data Kehadiran Tamu (RSVP)</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-primary-50 rounded-2xl text-center">
                <p className="text-sm text-muted mb-1">Hadir</p>
                <p className="text-3xl font-bold text-primary">{rsvps.filter(r => r.attendance === 'hadir').reduce((acc, curr) => acc + curr.jumlah_tamu, 0)} <span className="text-sm font-normal">orang</span></p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl text-center">
                <p className="text-sm text-amber-700 mb-1">Ragu-ragu</p>
                <p className="text-3xl font-bold text-amber-600">{rsvps.filter(r => r.attendance === 'ragu').length}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl text-center">
                <p className="text-sm text-red-700 mb-1">Tidak Hadir</p>
                <p className="text-3xl font-bold text-red-600">{rsvps.filter(r => r.attendance === 'tidak_hadir').length}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-primary-100">
                    <th className="py-3 px-4 font-semibold">Nama Tamu</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Jumlah</th>
                    <th className="py-3 px-4 font-semibold">Pesan</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map(r => (
                    <tr key={r.id} className="border-b border-primary-50">
                      <td className="py-3 px-4">{r.guest_name}</td>
                      <td className="py-3 px-4 capitalize">{r.attendance.replace('_', ' ')}</td>
                      <td className="py-3 px-4">{r.jumlah_tamu}</td>
                      <td className="py-3 px-4 text-sm text-muted">{r.message}</td>
                    </tr>
                  ))}
                  {rsvps.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted">Belum ada RSVP.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guestbook Tab */}
        {activeTab === 'guestbook' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary-100">
            <h3 className="text-xl font-bold mb-6">Buku Tamu (Ucapan)</h3>
            <div className="space-y-4">
              {guestbook.map(m => (
                <div key={m.id} className="p-4 bg-background rounded-2xl">
                  <p className="font-bold text-primary mb-1">{m.guest_name}</p>
                  <p className="text-sm text-text">{m.message}</p>
                  <p className="text-xs text-muted mt-2">{new Date(m.created_at).toLocaleString('id-ID')}</p>
                </div>
              ))}
              {guestbook.length === 0 && <div className="text-center text-muted py-8">Belum ada ucapan.</div>}
            </div>
          </div>
        )}

        {/* Gifts Tab */}
        {activeTab === 'gifts' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary-100">
            <h3 className="text-xl font-bold mb-6">Konfirmasi Amplop Digital</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-primary-100">
                    <th className="py-3 px-4 font-semibold">Nama Pengirim</th>
                    <th className="py-3 px-4 font-semibold">Bank Asal</th>
                    <th className="py-3 px-4 font-semibold">Nominal (Opsional)</th>
                    <th className="py-3 px-4 font-semibold">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.map(g => (
                    <tr key={g.id} className="border-b border-primary-50">
                      <td className="py-3 px-4">{g.guest_name}</td>
                      <td className="py-3 px-4">{g.bank_name}</td>
                      <td className="py-3 px-4">{g.amount ? `Rp ${g.amount.toLocaleString('id-ID')}` : '-'}</td>
                      <td className="py-3 px-4 text-sm">{g.note}</td>
                    </tr>
                  ))}
                  {gifts.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted">Belum ada konfirmasi amplop.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
