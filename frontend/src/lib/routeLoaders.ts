// src/lib/routeLoaders.ts
// Satu sumber untuk impor dinamis tiap rute: dipakai React.lazy di App.tsx
// dan untuk prefetch potongan rute saat hover atau fokus pada tautan.

export const routeLoaders = {
  LandingPage: () => import('../pages/LandingPage'),
  RegisterPage: () => import('../pages/RegisterPage'),
  LoginPage: () => import('../pages/LoginPage'),
  Dashboard: () => import('../pages/Dashboard'),
  GallerySelection: () => import('../pages/GallerySelection'),
  AdminDashboard: () => import('../pages/AdminDashboard'),
  PortfolioManager: () => import('../pages/PortfolioManager'),
  TermsPage: () => import('../pages/TermsPage'),
  PrivacyPage: () => import('../pages/PrivacyPage'),
  ContactPage: () => import('../pages/ContactPage'),
  ForgotPasswordPage: () => import('../pages/ForgotPasswordPage'),
  ResetPasswordPage: () => import('../pages/ResetPasswordPage'),
  HomeSettingsManager: () => import('../pages/HomeSettingsManager'),
  ClientPage: () => import('../pages/ClientPage'),
  FaqPage: () => import('../pages/FaqPage'),
  PortfolioPage: () => import('../pages/PortfolioPage'),
  ContentManager: () => import('../pages/ContentManager'),
  MediaLibraryPage: () => import('../pages/MediaLibraryPage'),
  CollectionDetailPage: () => import('../pages/CollectionDetailPage'),
  DemoPage: () => import('../pages/DemoPage'),
  AlbumPage: () => import('../pages/AlbumPage'),
  CollectionPreviewPage: () => import('../pages/CollectionPreviewPage'),
  NotFoundPage: () => import('../pages/NotFoundPage'),
} as const;

const pathToLoader: Record<string, () => Promise<unknown>> = {
  '/': routeLoaders.LandingPage,
  '/portofolio': routeLoaders.PortfolioPage,
  '/untuk-klien': routeLoaders.ClientPage,
  '/demo': routeLoaders.DemoPage,
  '/faq': routeLoaders.FaqPage,
  '/kontak': routeLoaders.ContactPage,
  '/login': routeLoaders.LoginPage,
  '/register': routeLoaders.RegisterPage,
  '/dashboard': routeLoaders.Dashboard,
  '/syarat-ketentuan': routeLoaders.TermsPage,
  '/kebijakan-privasi': routeLoaders.PrivacyPage,
};

const prefetched = new Set<string>();

/** Muat potongan rute lebih awal. Aman dipanggil berulang; error jaringan diabaikan. */
export function prefetchRoute(path: string): void {
  const loader = pathToLoader[path];
  if (!loader || prefetched.has(path)) return;
  prefetched.add(path);
  loader().catch(() => prefetched.delete(path));
}
