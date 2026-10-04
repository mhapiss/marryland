// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';

// Code-split all routes
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const GallerySelection = React.lazy(() => import('./pages/GallerySelection'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const PortfolioManager = React.lazy(() => import('./pages/PortfolioManager'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const HomeSettingsManager = React.lazy(() => import('./pages/HomeSettingsManager'));
const ClientPage = React.lazy(() => import('./pages/ClientPage'));
const FaqPage = React.lazy(() => import('./pages/FaqPage'));
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage'));
const ContentManager = React.lazy(() => import('./pages/ContentManager'));
const MediaLibraryPage = React.lazy(() => import('./pages/MediaLibraryPage'));
const CollectionDetailPage = React.lazy(() => import('./pages/CollectionDetailPage'));
const DemoPage = React.lazy(() => import('./pages/DemoPage'));
const AlbumPage = React.lazy(() => import('./pages/AlbumPage'));
const CollectionPreviewPage = React.lazy(() => import('./pages/CollectionPreviewPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-kertas">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-merah border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-sans text-tinta-lembut">Memuat...</p>
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
