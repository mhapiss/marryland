// src/hooks/usePageMeta.ts
import { useEffect } from 'react';
import { useSiteSettings } from './useContent';

export function usePageMeta(
  titleOrObj: string | { title?: string; description?: string },
  maybeDesc?: string
) {
  const { settings } = useSiteSettings();

  const title = typeof titleOrObj === 'object' ? titleOrObj.title : titleOrObj;
  const description =
    typeof titleOrObj === 'object' ? titleOrObj.description : maybeDesc;

  useEffect(() => {
    const defaultTitle = settings.seo_default_title || 'by.marryland | Studio Dokumentasi Pernikahan & Adat';
    const defaultDesc =
      settings.seo_default_description ||
      'Seleksi foto klien cepat, kurasi visual berstandar editorial tinggi, dan penghormatan tulus pada prosesi adat.';

    const prev = document.title;
    document.title = title ? `${title}` : defaultTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    const activeDesc = description || defaultDesc;

    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', activeDesc);

    return () => {
      document.title = prev;
      if (metaDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, [title, description, settings.seo_default_title, settings.seo_default_description]);
}
