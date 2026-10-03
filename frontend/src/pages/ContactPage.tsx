import React from 'react';
import LegalLayout from '../components/LegalLayout';
import { CONTACT_EMAIL, WHATSAPP_URL } from '../config/constants';
import { MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <LegalLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Hubungi Kami</h1>
        <p className="text-muted mb-8 text-lg">
          Punya pertanyaan, kendala teknis, atau sekadar ingin memberikan masukan? Kami siap membantu! Silakan hubungi kami melalui saluran di bawah ini.
        </p>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-2">WhatsApp</h2>
            <p className="text-muted mb-4">
              Dapatkan respon lebih cepat untuk pertanyaan atau dukungan teknis.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat via WhatsApp
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-2">Email</h2>
            <p className="text-muted mb-2">
              Kirimkan pertanyaan, keluhan, atau kerjasama ke alamat email kami.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:text-primary-600 hover:underline font-medium text-lg"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </LegalLayout>
  );
}
