import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

// Dummy data untuk visualisasi UI Admin
const DUMMY_METRICS = {
  totalUsers: 128,
  totalGalleries: 1450,
  activePro: 34,
  revenue: 'Rp 4.250.000',
};

const DUMMY_USERS = [
  { id: '1', studio: 'Dina Pictures', email: 'hello@dinapics.com', plan: 'PRO', credits: 15, status: 'active', joined: '12 Sep 2026' },
  { id: '2', studio: 'Visual Story', email: 'contact@vstory.id', plan: 'FREE', credits: 0, status: 'active', joined: '14 Sep 2026' },
  { id: '3', studio: 'Lensa Kita', email: 'lensakita@gmail.com', plan: 'FREE', credits: 2, status: 'active', joined: '15 Sep 2026' },
  { id: '4', studio: 'Kencana Photo', email: 'kencana@yahoo.com', plan: 'PRO', credits: 50, status: 'inactive', joined: '16 Sep 2026' },
];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // TODO: Nanti kita ganti dengan pengecekan role di database
  // Untuk demo, kita asumsikan semua yang masuk ke /admin bisa melihat UI ini
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#0E0E11] text-zinc-300 font-sans flex selection:bg-primary/30">
      
      {/* ─────── Sidebar (Dark Mode) ─────── */}
      <aside className="w-64 bg-[#18181B] border-r border-zinc-800/50 flex flex-col fixed inset-y-0 z-10">
        <div className="p-6">
          <h1 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            by.<span className="text-primary">marryland</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Super Admin</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Fotografer
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Billing & Payouts
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-primary font-bold">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Admin System</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─────── Main Content ─────── */}
      <main className="flex-1 ml-64 p-8 lg:p-12">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2">Control Panel</h2>
            <p className="text-zinc-400">Pantau aktivitas platform by.marryland hari ini.</p>
          </div>
          <button className="bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(191,160,106,0.3)]">
            + Broadcast Pesan
          </button>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#18181B] border border-zinc-800/50 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-zinc-400 font-medium mb-1">Total Fotografer</p>
            <h3 className="text-3xl font-bold text-white">{DUMMY_METRICS.totalUsers}</h3>
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              +12 minggu ini
            </p>
          </div>
          <div className="bg-[#18181B] border border-zinc-800/50 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-zinc-400 font-medium mb-1">Galeri Dibuat</p>
            <h3 className="text-3xl font-bold text-white">{DUMMY_METRICS.totalGalleries}</h3>
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              +145 minggu ini
            </p>
          </div>
          <div className="bg-[#18181B] border border-zinc-800/50 p-6 rounded-2xl shadow-lg">
            <p className="text-sm text-zinc-400 font-medium mb-1">User PRO Aktif</p>
            <h3 className="text-3xl font-bold text-white">{DUMMY_METRICS.activePro}</h3>
            <p className="text-xs text-zinc-500 mt-2">26% conversion rate</p>
          </div>
          <div className="bg-[#18181B] border border-zinc-800/50 p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-sm text-zinc-400 font-medium mb-1 relative z-10">Estimasi Revenue</p>
            <h3 className="text-2xl font-bold text-primary relative z-10">{DUMMY_METRICS.revenue}</h3>
            <p className="text-xs text-zinc-500 mt-2 relative z-10">Bulan ini</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#18181B] border border-zinc-800/50 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-[#18181B]">
            <h3 className="text-lg font-bold text-white">Fotografer Terbaru</h3>
            <div className="relative">
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Cari studio..." 
                className="bg-[#0E0E11] border border-zinc-800 text-sm text-zinc-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0E0E11]/50 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Studio / Email</th>
                  <th className="px-6 py-4">Paket</th>
                  <th className="px-6 py-4">Kredit</th>
                  <th className="px-6 py-4">Tanggal Gabung</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {DUMMY_USERS.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{u.studio}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {u.plan === 'PRO' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary-300 border border-primary/20">PRO</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">FREE</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {u.credits}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{u.joined}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className="text-zinc-500 hover:text-primary transition-colors text-xs font-semibold px-3 py-1.5 border border-zinc-700 hover:border-primary/50 rounded-lg bg-zinc-800/50"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ─────── Manage User Modal ─────── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
          <div className="relative bg-[#18181B] border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-1">{selectedUser.studio}</h3>
            <p className="text-sm text-zinc-500 mb-6">{selectedUser.email}</p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-[#0E0E11] rounded-xl p-4 border border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1">Status Paket</p>
                  <p className="font-semibold text-white">{selectedUser.plan}</p>
                </div>
                <button className="text-xs font-bold bg-primary/20 hover:bg-primary/30 text-primary-300 px-3 py-1.5 rounded-lg transition-colors border border-primary/20">
                  Upgrade ke PRO
                </button>
              </div>

              <div className="bg-[#0E0E11] rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-3">Manajemen Kredit</p>
                <div className="flex gap-2">
                  <input type="number" defaultValue={10} className="bg-[#18181B] border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 w-24 focus:outline-none focus:border-primary" />
                  <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    + Tambah Kredit
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedUser(null)} className="flex-1 px-4 py-2 bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-lg text-sm font-semibold transition-colors">
                Tutup
              </button>
              <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-semibold transition-colors">
                Suspend Akun
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
