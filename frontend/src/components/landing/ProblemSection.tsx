import React from 'react';
import { Section } from './Section';
import { MessageSquareWarning, Clock } from 'lucide-react';

interface ProblemSectionProps {
  data?: any;
}

export function ProblemSection({ data }: ProblemSectionProps) {
  const heading = data?.heading || 'Seleksi foto lewat chat WhatsApp melelahkan?';
  const description =
    data?.description ||
    'Klien bingung mengingat ratusan nomor file di Google Drive, membalas chat satu per satu, dan fotografer salah catat foto yang harus diedit.';

  const chatBubbles = data?.chat_bubbles || [
    { sender: 'klien', text: 'Kak, ini aku pilih IMG_0023, IMG_0024... eh bentar, IMG_0023 yang hadap kiri atau kanan ya?' },
    { sender: 'fotografer', text: 'Yang hadap kanan kak. Boleh kirim screenshot-nya biar nggak salah edit?' },
    { sender: 'klien', text: 'Aduh fotonya banyak banget di Drive, lemot buka satu-satu...' },
    { sender: 'klien', text: 'Bentar ya kak, aku catat di kertas dulu nanti aku fotoin.' },
    { sender: 'fotografer', text: 'Siap kak, jangan lupa kasih nomor urut fotonya ya.' },
    { sender: 'klien', text: 'Kak nomor 45 yang aku kirim kemarin salah, tolong ganti nomor 48 ya!' },
  ];

  const note = data?.note || 'Status: belum kelar dan rawan salah edit.';

  return (
    <Section id="masalah" bg="kertas-tua" doubleBorderTop doubleBorderBottom belowFold>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Heading and explanation */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-bold text-merah mb-4">
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>№ 02 &bull; KENDALA ALUR LAMA</span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal leading-tight tracking-tight mb-6">
            {heading}
          </h2>

          <p className="font-body text-base md:text-lg text-tinta-lembut leading-relaxed mb-6">
            {description}
          </p>

          <div className="p-4 bg-kertas border border-garis rounded-sm text-sm text-tinta space-y-2">
            <div className="flex items-center gap-2 font-semibold text-tinta">
              <Clock className="w-4 h-4 text-merah" />
              <span>Waktu Terbuang Sia-Sia</span>
            </div>
            <p className="font-body text-xs text-tinta-lembut leading-relaxed">
              Mencocokkan nama file di chat memakan waktu 2 hingga 4 jam per klien, ditambah risiko revisi berulang karena nomor file tertukar atau salah catat.
            </p>
          </div>
        </div>

        {/* Right Column: Simulated Chat */}
        <div className="lg:col-span-6">
          <div className="bg-kertas border border-garis rounded-sm shadow-none overflow-hidden">
            {/* Header */}
            <div className="bg-tinta text-kertas px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-sm bg-kertas/15 flex items-center justify-center font-bold text-xs text-kertas">
                  K
                </div>
                <div>
                  <h4 className="text-xs font-semibold leading-none text-kertas">Klien: Amanda (Pernikahan)</h4>
                  <span className="text-[10px] text-kertas/60 leading-none">online</span>
                </div>
              </div>
              <span className="text-[10px] bg-kertas/10 px-2 py-0.5 rounded-sm text-kertas/80 font-mono">
                Chat Berantakan
              </span>
            </div>

            {/* Chat Messages Container */}
            <div className="p-5 space-y-3 max-h-[360px] overflow-y-auto bg-kertas-tua/40">
              {chatBubbles.map((bubble: any, idx: number) => {
                const isClient = bubble.sender === 'klien';
                return (
                  <div
                    key={idx}
                    className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-sm text-xs leading-relaxed ${
                        isClient
                          ? 'bg-kertas text-tinta border border-garis'
                          : 'bg-kertas-tua text-tinta border border-garis'
                      }`}
                    >
                      <p>{bubble.text}</p>
                      <div className="text-[9px] text-tinta-lembut/70 text-right mt-1 font-mono">
                        {14 + idx}:0{idx * 2}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="bg-kertas px-4 py-2.5 border-t border-garis flex items-center justify-between text-xs">
              <span className="font-semibold text-merah flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-merah" />
                {note}
              </span>
              <span className="text-[10px] text-tinta-lembut font-mono">Alur Lama</span>
            </div>

          </div>
        </div>

      </div>
    </Section>
  );
}
