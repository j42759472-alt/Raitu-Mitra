import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ProfileSetupPage from '@/pages/ProfileSetupPage';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import JobsPage from '@/pages/JobsPage';
import SettingsPage from '@/pages/SettingsPage';
import CategoryPage from '@/pages/CategoryPage';
import MorePage from '@/pages/MorePage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import OrderConfirmPage from '@/pages/OrderConfirmPage';
import WorkforcePage from '@/pages/WorkforcePage';
import WorkerRegisterPage from '@/pages/WorkerRegisterPage';
import WorkerDetailPage from '@/pages/WorkerDetailPage';
import MyJobsPage from '@/pages/MyJobsPage';
import OrdersPage from '@/pages/OrdersPage';
import MySchemesPage from '@/pages/MySchemesPage';
import SchemesPage from '@/pages/SchemesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import FeedbackPage from '@/pages/FeedbackPage';
import ChatbotPage from '@/pages/ChatbotPage';
import ChatPage from '@/pages/ChatPage';
import LocationPage from '@/pages/LocationPage';
import TransportRoutePage from '@/pages/TransportRoutePage';
import EditListingPage from '@/pages/EditListingPage';

function HydrateGate({ children }: { children: React.ReactNode }) {
  const { hasHydrated } = useStore();
  if (!hasHydrated) {
    return (
      <div className="page text-center" style={{ paddingTop: 80 }}>
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, hasHydrated } = useStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          hasHydrated && isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />
      {isAuthenticated ? (
        <Route
          path="/"
          element={
            <HydrateGate>
              <AppShell />
            </HydrateGate>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      ) : (
        <Route
          path="/"
          element={
            <HydrateGate>
              <LandingPage />
            </HydrateGate>
          }
        />
      )}
      <Route path="/category" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
      <Route path="/more/:sectionId" element={<ProtectedRoute><MorePage /></ProtectedRoute>} />
      <Route path="/listing/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
      <Route path="/listing/:id/edit" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
      <Route path="/order/confirm" element={<ProtectedRoute><OrderConfirmPage /></ProtectedRoute>} />
      <Route path="/workforce" element={<ProtectedRoute><WorkforcePage /></ProtectedRoute>} />
      <Route path="/workforce/register" element={<ProtectedRoute><WorkerRegisterPage /></ProtectedRoute>} />
      <Route path="/worker/:id" element={<ProtectedRoute><WorkerDetailPage /></ProtectedRoute>} />
      <Route path="/jobs/my-jobs" element={<ProtectedRoute><MyJobsPage /></ProtectedRoute>} />
      <Route path="/jobs/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/jobs/my-schemes" element={<ProtectedRoute><MySchemesPage /></ProtectedRoute>} />
      <Route path="/schemes" element={<ProtectedRoute><SchemesPage /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
      <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
      <Route path="/chat/:orderId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/location" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />
      <Route path="/transport-route" element={<ProtectedRoute><TransportRoutePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
