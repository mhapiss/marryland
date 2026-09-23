import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invitation_templates')
      .select('*')
      .eq('is_active', true)
      .order('category');
    
    if (data) setTemplates(data);
    setLoading(false);
  };

  const handleUseTemplate = async (template: any) => {
    if (!user) return;
    setCreating(true);
    
    const randomSlug = Math.random().toString(36).substring(2, 10);
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        user_id: user.id,
        slug: `undangan-${randomSlug}`,
        groom_name: 'Nama Pria',
        bride_name: 'Nama Wanita',
        event_date: new Date().toISOString().split('T')[0],
        template_id: template.id,
        theme_color: template.default_theme_color,
      })
      .select()
      .single();

    if (error) {
      alert('Gagal membuat undangan: ' + error.message);
      setCreating(false);
    } else if (data) {
      navigate(`/dashboard/invitations/${data.id}/edit`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">Memuat template...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-white border-b border-primary-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center space-x-4">
          <button onClick={() => navigate('/dashboard')} className="text-muted hover:text-primary transition-colors">
            &larr; Batal
          </button>
          <h1 className="font-serif font-bold text-lg">Pilih Desain Template</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-primary-100 flex flex-col group hover:shadow-md transition-shadow">
              <div className="h-60 overflow-hidden relative">
                <img 
                  src={template.thumbnail_url} 
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-primary">
                  {template.category}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-serif font-bold text-xl text-text mb-2">{template.name}</h3>
                <div className="flex items-center space-x-2 mb-6">
                  <span className="text-sm text-muted">Warna Bawaan:</span>
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: template.default_theme_color }}></div>
                </div>
                <button
                  onClick={() => handleUseTemplate(template)}
                  disabled={creating}
                  className="mt-auto w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
                >
                  {creating ? 'Memproses...' : 'Pakai Template Ini'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
