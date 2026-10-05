// src/hooks/usePageMeta.ts
import { useEffect } from 'react';
import { useSiteSettings } from './useContent';

export interface PageMetaOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, any>;
}

export function usePageMeta(
  titleOrObj: string | PageMetaOptions,
  maybeDesc?: string
) {
  const { settings } = useSiteSettings();

  const options: PageMetaOptions =
    typeof titleOrObj === 'object'
      ? titleOrObj
      : { title: titleOrObj, description: maybeDesc };

  const { title, description, canonical, ogImage, ogType, jsonLd } = options;

  useEffect(() => {
    const defaultTitle =
      settings.seo_default_title ||
      'by.marryland — Galeri Seleksi Foto Klien untuk Fotografer';
    const defaultDesc =
      settings.seo_default_description ||
      'Platform kurasi dan seleksi foto klien yang cepat, elegan, dan terintegrasi langsung dengan Google Drive untuk fotografer pernikahan dan wisuda.';
    const defaultImage = 'https://by-marryland.app/og-image.jpg';

    // 1. Document Title
    const prevTitle = document.title;
    document.title = title ? `${title} — by.marryland` : defaultTitle;

    // Helper for meta tags
    const setMetaTag = (
      attr: 'name' | 'property',
      key: string,
      content: string
    ): (() => void) => {
      let meta = document.querySelector(`meta[${attr}="${key}"]`);
      const prevContent = meta?.getAttribute('content') || null;

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);

      return () => {
        if (prevContent !== null) {
          meta?.setAttribute('content', prevContent);
        } else if (meta && meta.parentNode) {
          meta.parentNode.removeChild(meta);
        }
      };
    };

    const cleanups: (() => void)[] = [];

    // 2. Meta Description
    const activeDesc = description || defaultDesc;
    cleanups.push(setMetaTag('name', 'description', activeDesc));
    cleanups.push(setMetaTag('property', 'og:description', activeDesc));
    cleanups.push(setMetaTag('name', 'twitter:description', activeDesc));

    // 3. Open Graph & Twitter Title
    const activeTitle = title || defaultTitle;
    cleanups.push(setMetaTag('property', 'og:title', activeTitle));
    cleanups.push(setMetaTag('name', 'twitter:title', activeTitle));

    // 4. Canonical & OG URL
    const activeCanonical = canonical || window.location.href.split('?')[0];
    cleanups.push(setMetaTag('property', 'og:url', activeCanonical));

    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonicalLink?.getAttribute('href') || null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', activeCanonical);
    cleanups.push(() => {
      if (prevCanonical) {
        canonicalLink?.setAttribute('href', prevCanonical);
      } else if (canonicalLink && canonicalLink.parentNode) {
        canonicalLink.parentNode.removeChild(canonicalLink);
      }
    });

    // 5. Image & Type
    const activeImage = ogImage || defaultImage;
    cleanups.push(setMetaTag('property', 'og:image', activeImage));
    cleanups.push(setMetaTag('name', 'twitter:image', activeImage));
    if (ogType) {
      cleanups.push(setMetaTag('property', 'og:type', ogType));
    }

    // 6. JSON-LD Structured Data
    if (jsonLd) {
      const scriptId = 'page-jsonld-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
      cleanups.push(() => {
        const el = document.getElementById(scriptId);
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    }

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
    };
  }, [
    title,
    description,
    canonical,
    ogImage,
    ogType,
    jsonLd,
    settings.seo_default_title,
    settings.seo_default_description,
  ]);
}
