import { Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import Loading from './Loading';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated } = useStore();
  if (!hasHydrated) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
