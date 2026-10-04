import React from 'react';
import { Link } from 'react-router-dom';
import { Section } from './Section';
import { Check } from 'lucide-react';

interface PricingSectionProps {
  data?: any;
}

export function PricingSection({ data }: PricingSectionProps) {
  const heading = data?.heading || 'Pilihan Paket Studio';
  const description =
    data?.description ||
    'Investasi terjangkau untuk menghemat puluhan jam koordinasi dengan klien setiap bulannya.';

  const packages = data?.packages || [];

  // Check if at least one package is marked as visible
  const visiblePackages = packages.filter(
    (pkg: any) => pkg.visible === 'true' || pkg.visible === true
  );

  // If no package is set to visible, hide this section completely
  if (visiblePackages.length === 0) {
    return null;
  }

  return (
    <Section id="harga" bg="kertas-tua" belowFold>
      <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-merah block mb-2">
          INVESTASI TERJANGKAU
        </span>
        <h2 className="font-serif text-3xl md:text-5xl text-tinta font-normal tracking-tight">
          {heading}
        </h2>
        <p className="text-base text-tinta-lembut mt-4">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
        {visiblePackages.map((pkg: any, idx: number) => {
          const isHighlighted = idx === 1;
          const featuresList = (pkg.features || '')
            .split(',')
            .map((f: string) => f.trim())
            .filter(Boolean);

          return (
            <div
              key={idx}
              className={`bg-white p-8 rounded-[2px] border flex flex-col justify-between transition-all duration-300 ${
                isHighlighted
                  ? 'border-merah ring-1 ring-merah'
                  : 'border-garis'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-serif text-2xl font-normal text-tinta">
                    {pkg.name}
                  </h3>
                  {isHighlighted && (
                    <span className="text-[10px] bg-merah/10 text-merah font-mono px-2 py-0.5 rounded-[2px] border border-merah/25">
                      Disorot
                    </span>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-garis">
                  <div className="font-serif text-3xl font-normal text-merah">
                    {pkg.price || '[HARGA]'}
                  </div>
                  <span className="text-xs text-tinta-lembut font-mono">/ bulan (langganan studio)</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {featuresList.map((feature: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-start text-xs text-tinta-lembut gap-2.5">
                      <Check className="w-4 h-4 text-merah shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className={`w-full py-3 text-center text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors min-h-[44px] flex items-center justify-center ${
                  isHighlighted
                    ? 'bg-merah text-white hover:bg-merah-hover font-medium'
                    : 'border border-garis text-merah hover:bg-kertas-tua font-medium'
                }`}
              >
                Pilih Paket
              </Link>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
