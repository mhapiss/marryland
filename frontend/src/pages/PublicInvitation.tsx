import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ElegantFloral from '../components/invitation-templates/ElegantFloral';
import MinimalistModern from '../components/invitation-templates/MinimalistModern';
import RusticVintage from '../components/invitation-templates/RusticVintage';
import IslamiGreen from '../components/invitation-templates/IslamiGreen';
import LuxuryGold from '../components/invitation-templates/LuxuryGold';
import PastelRomantic from '../components/invitation-templates/PastelRomantic';
import { TemplateProps } from '../components/invitation-templates/types';

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
    const { data } = await supabase
      .from('invitations')
      .select('*, invitation_templates(layout_key, default_theme_color)')
      .eq('slug', slug)
      .single();
      
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

  const layoutKey = invitation.invitation_templates?.layout_key || 'elegant-floral';

  const templateData = {
    invitation,
    guestName,
    timeLeft,
    messages
  };

  const templateForms = {
    rsvp, setRsvp, submitRsvp,
    gbName, setGbName, gbMessage, setGbMessage, submitGuestbook,
    gift, setGift, submitGift
  };

  const templateProps = { data: templateData, forms: templateForms };

  // Note: For a production app with dozens of templates, React.lazy/Suspense is better. 
  // For these 6, static imports or a simple switch is fine.
  // We'll import them at the top.
  return <TemplateSwitcher layoutKey={layoutKey} {...templateProps} />;
}

function TemplateSwitcher(props: TemplateProps & { layoutKey: string }) {
  const { layoutKey, ...rest } = props;
  switch (layoutKey) {
    case 'elegant-floral': return <ElegantFloral {...rest} />;
    case 'minimalist-modern': return <MinimalistModern {...rest} />;
    case 'rustic-vintage': return <RusticVintage {...rest} />;
    case 'islami-green': return <IslamiGreen {...rest} />;
    case 'luxury-gold': return <LuxuryGold {...rest} />;
    case 'pastel-romantic': return <PastelRomantic {...rest} />;
    default: return <ElegantFloral {...rest} />;
  }
}

