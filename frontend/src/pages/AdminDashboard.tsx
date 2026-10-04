import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface GalleryWithUser {
  id: string;
  client_name: string;
  status: string;
  created_at: string;
  user_id: string;
  max_photos_selectable: number;
  selected_count: number;
  client_whatsapp: string;
  photographer_name?: string;
  photographer_email?: string;
  photo_count?: number;
}

interface PhotographerInfo {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  gallery_count: number;
}

interface Stats {
  totalGalleries: number;
  totalPhotos: number;
  activeGalleries: number;
  completedGalleries: number;
  totalPhotographers: number;
}

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'galeri' | 'fotografer' | 'portofolio' | 'konten' | 'media' | 'beranda'>('overview');
  const [galleries, setGalleries] = useState<GalleryWithUser[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ totalGalleries: 0, totalPhotos: 0, activeGalleries: 0, completedGalleries: 0, totalPhotographers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchGalleries(), fetchPhotographers(), fetchStats()]);
    setLoading(false);
  };

  const fetchGalleries = async () => {
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch photographer info for each gallery
      const userIds = [...new Set(data.map(g => g.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Fetch photo counts
      const { data: photoCounts } = await supabase
        .from('gallery_photos')
        .select('gallery_id');

      const photoCountMap: Record<string, number> = {};
      photoCounts?.forEach(p => {
        photoCountMap[p.gallery_id] = (photoCountMap[p.gallery_id] || 0) + 1;
      });

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => { profileMap[p.id] = p.full_name || 'Tanpa Nama'; });

      // Get user emails from auth metadata
      const galleriesWithInfo = data.map(g => ({
        ...g,
        photographer_name: profileMap[g.user_id] || 'Unknown',
        photo_count: photoCountMap[g.id] || 0,
      }));

      setGalleries(galleriesWithInfo);
    }
  };

  const fetchPhotographers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('role', 'photographer')
      .order('created_at', { ascending: false });

    if (profiles) {
      // Count galleries per photographer
      const { data: galleryCounts } = await supabase
        .from('galleries')
        .select('user_id');

      const countMap: Record<string, number> = {};
      galleryCounts?.forEach(g => {
        countMap[g.user_id] = (countMap[g.user_id] || 0) + 1;
      });

      setPhotographers(profiles.map(p => ({
        id: p.id,
        full_name: p.full_name || 'Tanpa Nama',
        email: '', // Will show from profile
        created_at: p.created_at,
        gallery_count: countMap[p.id] || 0,
      })));
    }
  };

  const fetchStats = async () => {
    const { count: totalGalleries } = await supabase.from('galleries').select('*', { count: 'exact', head: true });
    const { count: totalPhotos } = await supabase.from('gallery_photos').select('*', { count: 'exact', head: true });
    const { count: activeGalleries } = await supabase.from('galleries').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: completedGalleries } = await supabase.from('galleries').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { count: totalPhotographers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'photographer');

    setStats({
      totalGalleries: totalGalleries || 0,
      totalPhotos: totalPhotos || 0,
      activeGalleries: activeGalleries || 0,
      completedGalleries: completedGalleries || 0,
      totalPhotographers: totalPhotographers || 0,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-merah/10 text-merah border-merah/25',
      completed: 'bg-kertas-tua text-tinta border-garis',
      draft: 'bg-white text-tinta-lembut border-garis',
    };
    const labels: Record<string, string> = { active: 'Aktif', completed: 'Selesai', draft: 'Draft' };
    return (
      <span className={`px-2.5 py-0.5 rounded-[2px] text-xs font-mono border ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'galeri' as const, label: 'Galeri' },
    { key: 'fotografer' as const, label: 'Fotografer' },
    { key: 'portofolio' as const, label: 'Portofolio Adat' },
    { key: 'konten' as const, label: 'Konten Situs' },
    { key: 'media' as const, label: 'Pustaka Media' },
  ];

  return (
    <div className="min-h-screen bg-kertas font-sans text-tinta">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex justify-between items-center border-b border-garis sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-serif tracking-tight text-tinta">
            by.<span className="text-merah">marryland</span>
          </Link>
          <span className="border border-garis text-merah bg-kertas-tua/60 text-[10px] px-2.5 py-0.5 rounded-[2px] font-mono tracking-widest uppercase">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/dashboard" className="text-xs font-mono text-tinta-lembut hover:text-merah transition-colors hidden sm:inline">
            Dashboard Fotografer &rarr;
          </Link>
          <span className="text-xs font-mono text-tinta-lembut hidden sm:inline truncate max-w-[200px]">{user?.email}</span>
          <button onClick={handleSignOut} className="text-tinta-lembut hover:text-merah transition-colors" title="Keluar" aria-label="Keluar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-8 border-b border-garis mt-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                activeTab === tab.key ? 'text-merah font-bold' : 'text-tinta-lembut hover:text-tinta'
              }`}
              onClick={() => {
                if (tab.key === 'portofolio') {
                  navigate('/admin/portfolio');
                } else if (tab.key === 'konten') {
                  navigate('/admin/konten');
                } else if (tab.key === 'media') {
                  navigate('/admin/media');
                } else {
                  setActiveTab(tab.key as any);
                }
              }}
            >
              {tab.label}
              {activeTab === tab.key && tab.key !== 'portofolio' && tab.key !== 'konten' && tab.key !== 'media' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-merah"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-merah/25 border-t-merah rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-tinta-lembut text-xs font-mono">Memuat data panel admin...</p>
          </div>
        ) : (
          <>
            {/* ─── Overview Tab ─── */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-garis rounded-[2px] p-6">
                    <div className="text-3xl font-serif font-normal text-merah">{stats.totalGalleries}</div>
                    <div className="text-xs font-mono text-tinta-lembut mt-1">Total Galeri</div>
                  </div>
                  <div className="bg-white border border-garis rounded-[2px] p-6">
                    <div className="text-3xl font-serif font-normal text-tinta">{stats.totalPhotos.toLocaleString()}</div>
                    <div className="text-xs font-mono text-tinta-lembut mt-1">Total Foto</div>
                  </div>
                  <div className="bg-white border border-garis rounded-[2px] p-6">
                    <div className="text-3xl font-serif font-normal text-merah">{stats.activeGalleries}</div>
                    <div className="text-xs font-mono text-tinta-lembut mt-1">Galeri Aktif</div>
                  </div>
                  <div className="bg-white border border-garis rounded-[2px] p-6">
                    <div className="text-3xl font-serif font-normal text-tinta">{stats.completedGalleries}</div>
                    <div className="text-xs font-mono text-tinta-lembut mt-1">Galeri Selesai</div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Galleries */}
                  <div className="bg-white border border-garis rounded-[2px] p-6">
                    <h3 className="font-serif text-lg font-normal text-tinta mb-4">Galeri Terbaru</h3>
                    <div className="space-y-3">
                      {galleries.slice(0, 5).map(g => (
                        <div key={g.id} className="flex items-center justify-between py-2 border-b border-garis/40 last:border-0">
                          <div>
                            <div className="font-medium text-sm text-tinta">{g.client_name}</div>
                            <div className="text-xs text-tinta-lembut">{g.photographer_name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-tinta-lembut">{g.photo_count} foto</span>
                            {statusBadge(g.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photographers */}
                  <div className="bg-white border border-garis rounded-[2px] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-lg font-normal text-tinta">Fotografer ({stats.totalPhotographers})</h3>
                    </div>
                    <div className="space-y-3">
                      {photographers.slice(0, 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between py-2 border-b border-garis/40 last:border-0">
                          <div>
                            <div className="font-medium text-sm text-tinta">{p.full_name}</div>
                            <div className="text-xs text-tinta-lembut">
                              Bergabung {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-tinta bg-kertas-tua border border-garis px-2 py-0.5 rounded-[2px]">{p.gallery_count} galeri</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Galeri Tab ─── */}
            {activeTab === 'galeri' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-serif font-normal text-tinta mb-5">Semua Galeri ({galleries.length})</h3>
                <div className="bg-white border border-garis rounded-[2px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-kertas-tua/40 border-b border-garis">
                          <th className="text-left px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Klien</th>
                          <th className="text-left px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Fotografer</th>
                          <th className="text-center px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Foto</th>
                          <th className="text-center px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Status</th>
                          <th className="text-right px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {galleries.map(g => (
                          <tr key={g.id} className="border-b border-garis/30 hover:bg-kertas/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-medium text-tinta">{g.client_name}</div>
                              <div className="text-xs text-tinta-lembut mt-0.5 font-mono">{g.client_whatsapp}</div>
                            </td>
                            <td className="px-5 py-4 text-tinta-lembut">{g.photographer_name}</td>
                            <td className="px-5 py-4 text-center font-mono text-tinta">{g.photo_count}</td>
                            <td className="px-5 py-4 text-center">{statusBadge(g.status)}</td>
                            <td className="px-5 py-4 text-right text-tinta-lembut font-mono text-xs">
                              {new Date(g.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {galleries.length === 0 && (
                    <div className="p-12 text-center text-tinta-lembut font-mono text-xs">Belum ada galeri yang dibuat.</div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Fotografer Tab ─── */}
            {activeTab === 'fotografer' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-serif font-normal text-tinta mb-5">Fotografer Terdaftar ({photographers.length})</h3>
                <div className="bg-white border border-garis rounded-[2px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-kertas-tua/40 border-b border-garis">
                          <th className="text-left px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Nama</th>
                          <th className="text-center px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Jumlah Galeri</th>
                          <th className="text-right px-5 py-3 font-medium text-tinta-lembut text-xs uppercase tracking-wider font-mono">Bergabung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {photographers.map(p => (
                          <tr key={p.id} className="border-b border-garis/30 hover:bg-kertas/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-medium text-tinta">{p.full_name}</div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="bg-kertas-tua text-tinta border border-garis px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-medium">{p.gallery_count}</span>
                            </td>
                            <td className="px-5 py-4 text-right text-tinta-lembut font-mono text-xs">
                              {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {photographers.length === 0 && (
                    <div className="p-12 text-center text-tinta-lembut font-mono text-xs">Belum ada fotografer terdaftar.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
