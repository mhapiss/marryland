import { useEffect } from 'react';

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — by.marryland` : 'by.marryland — Album Kenangan Digital';

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prev;
      if (metaDesc && description) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, [title, description]);
}
