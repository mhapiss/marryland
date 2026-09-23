import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Gallery } from '../pages/Dashboard';

interface Invitation {
  id: string;
  slug: string;
  groom_name: string;
  bride_name: string;
  event_date: string;
  is_published: boolean;
}

interface Props {
  galleries: Gallery[]; // Kept for future linking if needed
}

const InvitationsList: React.FC<Props> = ({ galleries }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('invitations')
      .select('id, slug, groom_name, bride_name, event_date, is_published')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInvitations(data);
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    navigate('/dashboard/invitations/templates');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus undangan ini?')) return;
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      setInvitations(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/undangan/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link undangan disalin ke clipboard!');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-xl font-serif font-bold text-text">Daftar Undangan Digital</h3>
        <button
          onClick={handleCreateNew}
          disabled={creating}
          className="btn-primary"
        >
          {creating ? 'Membuat...' : '+ Buat Undangan Baru'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted py-12">Memuat undangan...</div>
      ) : invitations.length === 0 ? (
        <div className="card p-12 text-center text-muted border-dashed border-2 border-primary-200">
          Belum ada undangan digital yang dibuat.
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <div key={inv.id} className="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary-300 transition-colors">
              <div>
                <h4 className="font-bold text-lg">{inv.groom_name} & {inv.bride_name}</h4>
                <div className="text-sm text-muted mt-1 space-y-1">
                  <p>Tanggal: {new Date(inv.event_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p>
                    Status:{' '}
                    <span className={inv.is_published ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                      {inv.is_published ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCopyLink(inv.slug)}
                  className="px-4 py-2 bg-primary-50 text-primary font-medium rounded-xl hover:bg-primary-100 transition-colors text-sm"
                >
                  Salin Link
                </button>
                <button
                  onClick={() => navigate(`/dashboard/invitations/${inv.id}/edit`)}
                  className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 shadow-soft hover:shadow-card transition-all text-sm"
                >
                  Edit / Detail
                </button>
                <button
                  onClick={() => handleDelete(inv.id)}
                  className="px-4 py-2 border border-red-200 text-red-500 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationsList;
