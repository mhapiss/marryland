// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Memuat...</p>
      </div>
    </div>
  );
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

function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background font-sans p-6">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <span className="text-xl font-serif font-bold">
            by.<span className="text-primary">marryland</span>
          </span>
        </div>
        <h1 className="text-6xl font-serif font-bold text-primary mb-3">404</h1>
        <p className="text-muted mb-8">Halaman yang kamu cari tidak ditemukan.</p>
        <a href="/" className="btn-primary text-sm px-8">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineBanner />
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          offset={16}
          toastOptions={{
            className: 'text-sm',
            duration: 4000,
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/lupa-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Legal pages */}
            <Route path="/syarat-ketentuan" element={<TermsPage />} />
            <Route path="/kebijakan-privasi" element={<PrivacyPage />} />
            <Route path="/kontak" element={<ContactPage />} />

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

            {/* Public: client photo selection */}
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
