// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import { routeLoaders } from './lib/routeLoaders';

// Code-split all routes (loader dibagi dengan prefetch hover/fokus di src/lib/routeLoaders.ts)
const LandingPage = React.lazy(routeLoaders.LandingPage);
const RegisterPage = React.lazy(routeLoaders.RegisterPage);
const LoginPage = React.lazy(routeLoaders.LoginPage);
const Dashboard = React.lazy(routeLoaders.Dashboard);
const GallerySelection = React.lazy(routeLoaders.GallerySelection);
const AdminDashboard = React.lazy(routeLoaders.AdminDashboard);
const PortfolioManager = React.lazy(routeLoaders.PortfolioManager);
const TermsPage = React.lazy(routeLoaders.TermsPage);
const PrivacyPage = React.lazy(routeLoaders.PrivacyPage);
const ContactPage = React.lazy(routeLoaders.ContactPage);
const ForgotPasswordPage = React.lazy(routeLoaders.ForgotPasswordPage);
const ResetPasswordPage = React.lazy(routeLoaders.ResetPasswordPage);
const HomeSettingsManager = React.lazy(routeLoaders.HomeSettingsManager);
const ClientPage = React.lazy(routeLoaders.ClientPage);
const FaqPage = React.lazy(routeLoaders.FaqPage);
const PortfolioPage = React.lazy(routeLoaders.PortfolioPage);
const ContentManager = React.lazy(routeLoaders.ContentManager);
const MediaLibraryPage = React.lazy(routeLoaders.MediaLibraryPage);
const CollectionDetailPage = React.lazy(routeLoaders.CollectionDetailPage);
const DemoPage = React.lazy(routeLoaders.DemoPage);
const AlbumPage = React.lazy(routeLoaders.AlbumPage);
const CollectionPreviewPage = React.lazy(routeLoaders.CollectionPreviewPage);
const NotFoundPage = React.lazy(routeLoaders.NotFoundPage);

// Fallback ringan: tampilan sama dengan layar awal di index.html (latar kertas, nama merek di tengah)
// supaya tidak berkedip saat berganti dari layar awal ke fallback ke halaman.
// Teks "Memuat..." baru muncul bila pemuatan lebih dari 400 ms.
function PageLoader() {
  const [showHint, setShowHint] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setShowHint(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-kertas" role="status" aria-label="Memuat">
      <div className="relative">
        <span className="font-serif text-[1.75rem] tracking-[-0.01em] text-tinta">by.marryland</span>
        <p
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 text-sm font-sans text-tinta-lembut whitespace-nowrap transition-opacity duration-300 ${
            showHint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Memuat...
        </p>
      </div>
    </div>
  );
}

function TextureManager() {
  const location = useLocation();
  React.useEffect(() => {
    const p = location.pathname;
    const isExcluded =
      p.startsWith('/dashboard') ||
      p.startsWith('/admin') ||
      p.startsWith('/g/') ||
      p.startsWith('/galeri/') ||
      p.startsWith('/album/') ||
      (/^\/[^/]+\/[^/]+$/.test(p) && !p.startsWith('/portofolio/'));

    if (isExcluded) {
      document.body.classList.remove('has-paper-texture');
      document.body.classList.add('no-paper-texture');
    } else {
      document.body.classList.remove('no-paper-texture');
      document.body.classList.add('has-paper-texture');
    }
  }, [location.pathname]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TextureManager />
        <OfflineBanner />
        <Toaster
          position="top-right"
          expand={false}
          closeButton
          offset={16}
          toastOptions={{
            className: 'bg-kertas border border-garis text-tinta font-sans text-sm rounded-sm shadow-menu',
            duration: 4000,
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/portofolio" element={<PortfolioPage />} />
            <Route path="/portofolio/:slug" element={<CollectionDetailPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/lupa-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/untuk-klien" element={<ClientPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/kontak" element={<ContactPage />} />

            {/* Legal pages */}
            <Route path="/syarat-ketentuan" element={<TermsPage />} />
            <Route path="/kebijakan-privasi" element={<PrivacyPage />} />

            {/* Protected dashboard (photographer) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/portfolio"
              element={
                <AdminRoute>
                  <PortfolioManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/konten"
              element={
                <AdminRoute>
                  <ContentManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/media"
              element={
                <AdminRoute>
                  <MediaLibraryPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/beranda"
              element={
                <AdminRoute>
                  <ContentManager />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/pratinjau/koleksi"
              element={
                <AdminRoute>
                  <CollectionPreviewPage />
                </AdminRoute>
              }
            />

            {/* Public: client photo selection (both /g/:slug and /:studio/:slug) */}
            <Route
              path="/g/:client_slug"
              element={
                <ErrorBoundary
                  fallbackTitle="Galeri Tidak Dapat Dimuat"
                  fallbackMessage="Terjadi masalah saat memuat galeri. Coba muat ulang halaman ini."
                  showHomeButton={false}
                >
                  <GallerySelection />
                </ErrorBoundary>
              }
            />
            <Route
              path="/galeri/:client_slug"
              element={
                <ErrorBoundary
                  fallbackTitle="Galeri Tidak Dapat Dimuat"
                  fallbackMessage="Terjadi masalah saat memuat galeri. Coba muat ulang halaman ini."
                  showHomeButton={false}
                >
                  <GallerySelection />
                </ErrorBoundary>
              }
            />
            {/* Public: Family Album (Second Link) */}
            <Route
              path="/album/:client_slug"
              element={
                <ErrorBoundary
                  fallbackTitle="Album Tidak Dapat Dimuat"
                  fallbackMessage="Terjadi kendala saat membuka album keluarga. Silakan periksa kembali tautan Anda."
                  showHomeButton={false}
                >
                  <AlbumPage />
                </ErrorBoundary>
              }
            />

            {/* Public: Custom studio slug selection route */}
            <Route
              path="/:studio_slug/:client_slug"
              element={
                <ErrorBoundary
                  fallbackTitle="Galeri Tidak Dapat Dimuat"
                  fallbackMessage="Terjadi masalah saat memuat galeri. Coba muat ulang halaman ini."
                  showHomeButton={false}
                >
                  <GallerySelection />
                </ErrorBoundary>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
